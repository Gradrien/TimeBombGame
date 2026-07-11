import {
  BROUILLEUR_JAM_CHANCE,
  GamePhase,
  GameState,
  getLoupeSuccessChance,
  isValidPlayerCount,
  LOUPE_LAST_USABLE_ROUND,
  LOUPE_MIN_PLAYERS,
  MAX_PLAYERS,
  TURN_DURATION_OPTIONS,
} from '@timebomb/shared';
import {
  applyCut,
  assignRoles,
  assignRolesChaos,
  createInitialRoomState,
  distributeCards,
  everyoneReadyToRestart,
  generateInitialDeck,
  resetRoomToLobby,
  sanitizeStateForPlayer,
} from './gameEngine';
import {initGameSessionStats, processEndGameStats, recordLoupe} from './services/statsService';
import {authenticatePlayer, toSafeUser, validateUsername} from './services/authService';
import {createSessionToken, verifySessionToken} from './services/tokenService';
import {buildUserProfile} from './services/profileService';
import {prisma} from './db';
import type {TypedServer, TypedSocket} from './socketTypes';

const activeRooms = new Map<string, GameState>();
const activeTimers = new Map<string, NodeJS.Timeout>();
/** Pending seat-removal timers for disconnected players, keyed `${roomId}:${playerId}`. */
const disconnectTimers = new Map<string, NodeJS.Timeout>();

/**
 * Grace period granted to a disconnected player before their seat may be
 * reclaimed. Long enough to absorb page refreshes, tab switches and short
 * network drops so an in-progress game is never interrupted by a transient
 * websocket loss.
 */
const RECONNECT_GRACE_MS = 60_000;

/** Time granted to the client to play the cut animation before the clock restarts. */
const CUT_ANIMATION_DELAY_MS = 2500;
/** Extra time granted to the clock during the loupe animation. */
const LOUPE_ANIMATION_EXTRA_MS = 3000;

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function broadcastGameState(io: TypedServer, roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.players.forEach(player => {
	const safeState = sanitizeStateForPlayer(room, player.id);
	if (player.socketId) io.to(player.socketId).emit('gameStateUpdated', safeState);
  });
}

// --- Turn timer ---

function clearTurnTimer(roomId: string) {
  const timer = activeTimers.get(roomId);
  if (timer) {
	clearTimeout(timer);
	activeTimers.delete(roomId);
  }
}

/** Arms the current turn's clock for `durationMs` milliseconds. */
function armTurnTimer(io: TypedServer, roomId: string, durationMs: number) {
  const room = activeRooms.get(roomId);
  if (!room || !room.isTimerModeEnabled) return;

  clearTurnTimer(roomId);
  room.turnEndTime = Date.now() + durationMs;
  activeTimers.set(roomId, setTimeout(() => executeRandomCut(io, roomId), durationMs));
}

function startTurnTimer(io: TypedServer, roomId: string, delayMs: number = 0) {
  const room = activeRooms.get(roomId);
  if (!room || !room.isTimerModeEnabled) return;
  // Push the turn's end back to absorb the client-side animation.
  armTurnTimer(io, roomId, (room.timerDuration ?? TURN_DURATION_OPTIONS[1]) * 1000 + delayMs);
}

/** Extends the running clock without resetting it (animations). */
function extendTurnTimer(io: TypedServer, roomId: string, extraMs: number) {
  const room = activeRooms.get(roomId);
  if (!room || !room.isTimerModeEnabled || !activeTimers.has(roomId)) return;
  const remainingMs = Math.max(0, (room.turnEndTime ?? Date.now()) - Date.now());
  armTurnTimer(io, roomId, remainingMs + extraMs);
}

/** The clock ran out: cut a random card on behalf of the clippers holder. */
function executeRandomCut(io: TypedServer, roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'PLAYING' || room.phase !== 'PLAYING') return;

  const clippersId = room.playerWithClippers;
  const validPlayers = room.players.filter(p => p.id !== clippersId && p.cards.some(c => !c.isRevealed));
  if (validPlayers.length === 0) return;

  const randomPlayer = validPlayers[Math.floor(Math.random() * validPlayers.length)];
  const unrevealedCards = randomPlayer.cards.filter(c => !c.isRevealed);
  const randomCard = unrevealedCards[Math.floor(Math.random() * unrevealedCards.length)];

  handleCutRequest(io, roomId, clippersId, randomPlayer.id, randomCard.id);
}

// --- Cut orchestration ---

function handleCutRequest(io: TypedServer, roomId: string, sourcePlayerId: string, targetPlayerId: string, cardId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const outcome = applyCut(room, sourcePlayerId, targetPlayerId, cardId);
  // Illegal cut (wrong turn, card already revealed…): ignore it without
  // touching the running clock.
  if (!outcome) return;

  clearTurnTimer(roomId);

  if (outcome.finished && room.stats) {
	processEndGameStats(room, room.stats)
		.then(unlockedBadges => {
		  if (unlockedBadges.length > 0) io.to(roomId).emit('achievementsUnlocked', unlockedBadges);
		})
		.catch(err => console.error('Failed to award achievements:', err));
  }

  // If the game continues within the same round, restart the clock for the
  // new clippers holder.
  if (room.status === 'PLAYING' && room.phase === 'PLAYING') {
	startTurnTimer(io, roomId, CUT_ANIMATION_DELAY_MS);
  }

  broadcastGameState(io, roomId);
}

// --- Connections / reconnections ---

function disconnectKey(roomId: string, playerId: string): string {
  return `${roomId}:${playerId}`;
}

/** Cancels a player's pending seat removal (called whenever they (re)connect). */
function cancelScheduledRemoval(roomId: string, playerId: string) {
  const key = disconnectKey(roomId, playerId);
  const timer = disconnectTimers.get(key);
  if (timer) {
	clearTimeout(timer);
	disconnectTimers.delete(key);
  }
}

/** Fully tears down a room and every timer it owns (prevents memory leaks). */
function destroyRoom(roomId: string) {
  clearTurnTimer(roomId);
  const room = activeRooms.get(roomId);
  if (room) room.players.forEach(p => cancelScheduledRemoval(roomId, p.id));
  activeRooms.delete(roomId);
}

/** Puts a room back in the lobby, clearing its clock. */
function resetRoom(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  clearTurnTimer(roomId);
  resetRoomToLobby(room);
}

/** Removes a player from a room, transferring host or destroying the room as needed. */
function removePlayer(io: TypedServer, roomId: string, playerId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  cancelScheduledRemoval(roomId, playerId);

  const index = room.players.findIndex(p => p.id === playerId);
  if (index === -1) return;

  room.players.splice(index, 1);
  if (room.players.length === 0) {
	destroyRoom(roomId);
	return;
  }
  // Transfer ownership if the host leaves.
  if (!room.players.some(p => p.isHost)) room.players[0].isHost = true;

  // The Loupe requires at least 5 players: auto-disable it below that.
  if (room.players.length < LOUPE_MIN_PLAYERS) room.isLoupeModeEnabled = false;

  // If a player leaves the end screen, the remaining already-ready players
  // must not stay stuck: switch to the lobby as soon as everyone is ready.
  if (room.status === 'FINISHED' && everyoneReadyToRestart(room)) resetRoom(roomId);

  broadcastGameState(io, roomId);
}

/** Binds a player to their current socket and marks them connected. */
function markConnected(roomId: string, playerId: string, socketId: string) {
  cancelScheduledRemoval(roomId, playerId);
  const player = activeRooms.get(roomId)?.players.find(p => p.id === playerId);
  if (player) {
	player.socketId = socketId;
	player.connected = true;
  }
}

/**
 * Handles a socket drop: the player is flagged as disconnected (peers see it
 * immediately) and a grace timer is armed. When it fires we reclaim the seat if
 * the room is still in the lobby, and destroy any fully-abandoned room.
 */
function handleDisconnect(io: TypedServer, roomId: string, playerId: string) {
  const room = activeRooms.get(roomId);
  const player = room?.players.find(p => p.id === playerId);
  if (!room || !player) return;

  player.connected = false;
  player.socketId = undefined;

  // A disconnected player on the end screen must not block the others from restarting.
  if (room.status === 'FINISHED' && everyoneReadyToRestart(room)) resetRoom(roomId);

  broadcastGameState(io, roomId);

  cancelScheduledRemoval(roomId, playerId);
  const timer = setTimeout(() => {
	disconnectTimers.delete(disconnectKey(roomId, playerId));
	const current = activeRooms.get(roomId);
	const stillThere = current?.players.find(p => p.id === playerId);
	if (!current || !stillThere || stillThere.connected) return; // came back meanwhile

	// Fully abandoned room -> destroy it (avoids ghost rooms/timers).
	if (current.players.every(p => !p.connected)) {
	  destroyRoom(roomId);
	  return;
	}

	// In the lobby an absent player frees their seat; mid-game the seat is
	// kept for a later reconnection (the state stays consistent and the others
	// can still vote to surrender).
	if (current.status === 'LOBBY') {
	  removePlayer(io, roomId, playerId);
	}
  }, RECONNECT_GRACE_MS);

  disconnectTimers.set(disconnectKey(roomId, playerId), timer);
}

/** Reattaches an authenticated socket to the seat its player already holds, if any. */
function reattachToSeat(io: TypedServer, socket: TypedSocket, userId: string) {
  for (const [roomId, room] of activeRooms.entries()) {
	const player = room.players.find(p => p.id === userId);
	if (player) {
	  markConnected(roomId, userId, socket.id);
	  socket.join(roomId);
	  broadcastGameState(io, roomId);
	  return;
	}
  }
}

// --- Authorization helpers ---

/**
 * Socket-bound identity, set by `login` / `authenticate`.
 * This is the ONLY source of identity: no handler trusts a client-supplied
 * `playerId`.
 */
function requireUser(socket: TypedSocket): { userId: string; username: string } | null {
  const {userId, username} = socket.data;
  if (!userId || !username) {
	socket.emit('gameError', 'Identification requise.');
	return null;
  }
  return {userId, username};
}

/** Applies a lobby setting, host only. */
function applyHostSetting(io: TypedServer, socket: TypedSocket, roomId: string, apply: (room: GameState) => void) {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'LOBBY') return;
  const me = room.players.find(p => p.socketId === socket.id);
  if (!me || !me.isHost) return;
  apply(room);
  broadcastGameState(io, roomId);
}

/** Records a player's "ready" and advances the phase once everyone is. */
function handleReadyConfirmation(io: TypedServer, socket: TypedSocket, roomId: string, phase: GamePhase, advance: (room: GameState) => void) {
  const room = activeRooms.get(roomId);
  if (!room || room.phase !== phase) return;
  const player = room.players.find(p => p.socketId === socket.id);
  if (player && !room.readyPlayers.includes(player.id)) room.readyPlayers.push(player.id);
  if (room.readyPlayers.length === room.players.length) {
	room.readyPlayers = [];
	advance(room);
  }
  broadcastGameState(io, roomId);
}

// --- Handlers ---

export function setupSocketHandlers(io: TypedServer, socket: TypedSocket) {

  // ------------------------------------------------------------------
  // Account & session
  // ------------------------------------------------------------------

  socket.on('login', async (username, pin, ack) => {
	try {
	  const user = await authenticatePlayer(username, pin);
	  socket.data.userId = user.id;
	  socket.data.username = user.username;
	  ack({success: true, user, token: createSessionToken(user.id)});
	} catch (error) {
	  ack({success: false, error: error instanceof Error ? error.message : 'Erreur serveur.'});
	}
  });

  socket.on('authenticate', async (token, ack) => {
	const userId = verifySessionToken(token);
	if (!userId) return ack({success: false});

	let user;
	try {
	  user = await prisma.user.findUnique({where: {id: userId}});
	} catch (error) {
	  console.error('authenticate failed:', error);
	  return ack({success: false});
	}
	if (!user) return ack({success: false});

	socket.data.userId = user.id;
	socket.data.username = user.username;
	ack({success: true, user: toSafeUser(user)});

	// Game resumption: if the player holds a seat somewhere, reattach them to it.
	reattachToSeat(io, socket, user.id);
  });

  socket.on('getUserProfile', async (ack) => {
	const userId = socket.data.userId;
	if (!userId) return ack(null);
	try {
	  ack(await buildUserProfile(userId));
	} catch (error) {
	  console.error('Failed to build profile:', error);
	  ack(null);
	}
  });

  socket.on('updateUsername', async (newName, ack) => {
	const userId = socket.data.userId;
	if (!userId) return ack({success: false, error: 'Identification requise.'});

	try {
	  const clean = validateUsername(newName);

	  const existingUser = await prisma.user.findFirst({
		where: {username: {equals: clean, mode: 'insensitive'}},
	  });
	  if (existingUser && existingUser.id !== userId) {
		return ack({success: false, error: 'Ce pseudo est déjà utilisé par un autre agent.'});
	  }

	  await prisma.user.update({where: {id: userId}, data: {username: clean}});
	  socket.data.username = clean;

	  // Update the name in the active room if the player is in a game.
	  for (const [roomId, room] of activeRooms.entries()) {
		const player = room.players.find(p => p.id === userId);
		if (player) {
		  player.name = clean;
		  broadcastGameState(io, roomId);
		}
	  }

	  ack({success: true});
	} catch (error) {
	  const message = error instanceof Error ? error.message : 'Erreur serveur lors de la mise à jour.';
	  ack({success: false, error: message});
	}
  });

  // ------------------------------------------------------------------
  // Rooms
  // ------------------------------------------------------------------

  socket.on('getOpenRooms', () => {
	const openRooms = [];
	for (const [roomId, room] of activeRooms.entries()) {
	  if (room.status === 'LOBBY') {
		openRooms.push({roomId, playerCount: room.players.length});
	  }
	}
	socket.emit('openRoomsList', openRooms);
  });

  socket.on('createRoom', () => {
	const identity = requireUser(socket);
	if (!identity) return;

	const roomId = generateRoomCode();
	const room = createInitialRoomState(roomId);
	room.players.push({
	  id: identity.userId,
	  name: identity.username,
	  cards: [],
	  isHost: true,
	  socketId: socket.id,
	  connected: true,
	});

	activeRooms.set(roomId, room);
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  socket.on('joinRoom', (roomId) => {
	const identity = requireUser(socket);
	if (!identity) return;

	const room = activeRooms.get(roomId);
	if (!room) return socket.emit('gameError', 'Ce code de Room n\'existe pas');

	const existingPlayer = room.players.find(p => p.id === identity.userId);
	if (existingPlayer) {
	  // Reconnection / rejoin: reattach the player to their existing seat.
	  markConnected(roomId, identity.userId, socket.id);
	  socket.join(roomId);
	  broadcastGameState(io, roomId);
	  return;
	}

	if (room.status !== 'LOBBY') return socket.emit('gameError', 'Partie déjà en cours, lobby fermé');
	if (room.players.length >= MAX_PLAYERS) return socket.emit('gameError', `Room complète (${MAX_PLAYERS} joueurs max)`);

	room.players.push({
	  id: identity.userId,
	  name: identity.username,
	  cards: [],
	  isHost: false,
	  socketId: socket.id,
	  connected: true,
	});
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  socket.on('leaveRoom', (roomId) => {
	const room = activeRooms.get(roomId);
	if (!room) return;

	const player = room.players.find(p => p.socketId === socket.id);
	if (player) {
	  if (room.status === 'PLAYING') {
		// Mid-game, removing the player would make their cards vanish
		// (bomb/defuses included) and could strand the clippers: keep their
		// seat as for a disconnection — they can come back, or the others can
		// vote to surrender.
		handleDisconnect(io, roomId, player.id);
	  } else {
		// Outside a game (lobby / end screen): free the seat immediately.
		removePlayer(io, roomId, player.id);
	  }
	}
	socket.leave(roomId);
  });

  socket.on('kickPlayer', (roomId, targetPlayerId) => {
	const room = activeRooms.get(roomId);
	// Kicking is lobby-only (never mid-game).
	if (!room || room.status !== 'LOBBY') return;

	const me = room.players.find(p => p.socketId === socket.id);
	if (!me || !me.isHost) return;        // Only the host can kick.
	if (me.id === targetPlayerId) return; // The host cannot kick themselves.

	const target = room.players.find(p => p.id === targetPlayerId);
	if (!target) return;

	// Tell the kicked player to go back to the menu, then free their seat.
	if (target.socketId) {
	  io.to(target.socketId).emit('kicked');
	  io.sockets.sockets.get(target.socketId)?.leave(roomId);
	}

	removePlayer(io, roomId, targetPlayerId);
  });

  // ------------------------------------------------------------------
  // Lobby settings (host only)
  // ------------------------------------------------------------------

  socket.on('toggleLoupeMode', (roomId, enabled) => {
	applyHostSetting(io, socket, roomId, room => {
	  room.isLoupeModeEnabled = enabled;
	});
  });

  socket.on('toggleChaosMode', (roomId, enabled) => {
	applyHostSetting(io, socket, roomId, room => {
	  room.isChaosModeEnabled = enabled;
	});
  });

  socket.on('toggleTimerMode', (roomId, enabled, duration) => {
	if (!(TURN_DURATION_OPTIONS as readonly number[]).includes(duration)) return;
	applyHostSetting(io, socket, roomId, room => {
	  room.isTimerModeEnabled = enabled;
	  room.timerDuration = duration;
	});
  });

  // ------------------------------------------------------------------
  // Game flow
  // ------------------------------------------------------------------

  socket.on('startGame', (roomId) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'LOBBY') return;

	const count = room.players.length;
	if (!isValidPlayerCount(count)) return;

	// Only the host can start the game (the UI guarantees it, the server enforces it).
	const me = room.players.find(p => p.socketId === socket.id);
	if (!me || !me.isHost) return;

	room.status = 'PLAYING';
	room.phase = 'ROLE_REVEAL';
	room.readyPlayers = [];
	room.revealedCards = [];
	room.totalDefusesFound = 0;
	room.totalDefusesNeeded = count;
	room.playerWithClippers = room.players[Math.floor(Math.random() * count)].id;
	room.teamHasLoupe = false;
	room.stats = initGameSessionStats();

	if (room.isChaosModeEnabled) {
	  assignRolesChaos(room.players, room.isLoupeModeEnabled);
	} else {
	  assignRoles(room.players, room.isLoupeModeEnabled);
	}
	distributeCards(generateInitialDeck(count, room.isLoupeModeEnabled), room.players);
	broadcastGameState(io, roomId);
  });

  socket.on('confirmRole', (roomId) => {
	handleReadyConfirmation(io, socket, roomId, 'ROLE_REVEAL', room => {
	  room.phase = 'CARD_REVEAL';
	});
  });

  socket.on('confirmCards', (roomId) => {
	handleReadyConfirmation(io, socket, roomId, 'CARD_REVEAL', room => {
	  room.phase = 'PLAYING';
	  startTurnTimer(io, roomId);
	});
  });

  socket.on('cutCard', (roomId, targetPlayerId, cardId) => {
	const room = activeRooms.get(roomId);
	if (!room) return;
	const me = room.players.find(p => p.socketId === socket.id);
	if (!me) return;

	handleCutRequest(io, roomId, me.id, targetPlayerId, cardId);
  });

  socket.on('useLoupe', (roomId, targetPlayerId, cardId) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'PLAYING' || !room.teamHasLoupe) return;

	// Rule 1: unusable during the last round.
	if (room.currentRound > LOUPE_LAST_USABLE_ROUND) return;

	const me = room.players.find(p => p.socketId === socket.id);
	if (!me) return;

	const targetPlayer = room.players.find(p => p.id === targetPlayerId);
	if (!targetPlayer) return;

	// Rule 2: unusable on a player who has only one hidden card left.
	const hiddenCards = targetPlayer.cards.filter(c => !c.isRevealed && !c.isPublic);
	if (hiddenCards.length <= 1) return;

	const card = targetPlayer.cards.find(c => c.id === cardId);
	if (!card || card.isRevealed || card.isPublic) return;

	room.teamHasLoupe = false;

	// Brouilleur passive power: the loupe almost always fails on them.
	const successChance = targetPlayer.role === 'BROUILLEUR'
		? 1 - BROUILLEUR_JAM_CHANCE
		: getLoupeSuccessChance(room.currentRound);

	const isSuccess = Math.random() <= successChance;

	if (room.stats) {
	  const isJammed = targetPlayer.role === 'BROUILLEUR' && !isSuccess;
	  recordLoupe(room.stats, me.id, isJammed, isJammed ? targetPlayer.id : undefined);
	}

	if (isSuccess) card.isPublic = true;
	io.to(roomId).emit('loupeResult', {success: isSuccess, targetName: targetPlayer.name});

	// Grant the clock extra time to compensate for the loupe animation.
	extendTurnTimer(io, roomId, LOUPE_ANIMATION_EXTRA_MS);

	broadcastGameState(io, roomId);
  });

  socket.on('voteSurrender', (roomId) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'PLAYING') return;

	// Identity comes from the socket: impossible to vote on someone else's behalf.
	const me = room.players.find(p => p.socketId === socket.id);
	if (!me) return;

	if (!room.surrenderVotes) room.surrenderVotes = [];
	if (!room.surrenderVotes.includes(me.id)) {
	  room.surrenderVotes.push(me.id);
	}

	// Absolute majority
	const requiredVotes = Math.floor(room.players.length / 2) + 1;

	if (room.surrenderVotes.length >= requiredVotes) {
	  resetRoom(roomId);
	  io.to(roomId).emit('gameSurrendered');
	}

	broadcastGameState(io, roomId);
  });

  socket.on('restartGame', (roomId) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'FINISHED') return;

	const player = room.players.find(p => p.socketId === socket.id);
	if (!player) return;

	// "Rejouer" is individual: the player goes back to the menus and waits for the others.
	if (!room.restartReady) room.restartReady = [];
	if (!room.restartReady.includes(player.id)) room.restartReady.push(player.id);

	// The room only returns to the lobby once everyone has clicked.
	if (everyoneReadyToRestart(room)) resetRoom(roomId);

	broadcastGameState(io, roomId);
  });

  socket.on('disconnect', () => {
	console.log('💨 Player disconnected:', socket.id);
	// Flag the player as disconnected and arm the grace period instead of
	// removing them immediately: a refresh or a network blip must not eject
	// them from their ongoing game.
	for (const [roomId, room] of activeRooms.entries()) {
	  const player = room.players.find(p => p.socketId === socket.id);
	  if (player) {
		handleDisconnect(io, roomId, player.id);
		break;
	  }
	}
  });
}
