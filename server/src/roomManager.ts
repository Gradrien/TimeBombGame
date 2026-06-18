import {Server, Socket} from 'socket.io';
import {AchievementDef, ACHIEVEMENTS, GameState, MAX_PLAYERS, ValidPlayerCount} from '@timebomb/shared';
import {assignRoles, assignRolesChaos, generateInitialDeck, distributeCards, gatherAndShuffleRemainingCards} from './gameEngine';
import {
  initGameSessionStats,
  recordCut,
  recordLoupe,
  recordRoundEnd,
  processEndGameStats
} from './services/statsService';
import {authenticatePlayer} from './services/authService';

import 'dotenv/config';
import {Pool} from 'pg';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from "./generated/client/index";

const pool = new Pool({connectionString: process.env.DATABASE_URL});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});

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

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function sanitizeStateForPlayer(gameState: GameState, targetPlayerId: string): GameState {
  const sanitized = JSON.parse(JSON.stringify(gameState)) as GameState;

  sanitized.players = sanitized.players.map(p => {
	if (p.id === targetPlayerId) {
	  p.secretCards = p.cards.filter(c => !c.isRevealed).map(c => c.type);
	} else {
	  if (sanitized.status !== 'FINISHED') delete p.role;
	  p.cards = p.cards.map(c => (c.isRevealed || c.isPublic) ? c : {...c, type: 'SAFE'});
	}
	return p;
  });

  return sanitized;
}

function broadcastGameState(io: Server, roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.players.forEach(player => {
	const safeState = sanitizeStateForPlayer(room, player.id);
	if (player.socketId) io.to(player.socketId).emit('gameStateUpdated', safeState);
  });
}

// --- GESTION DU CHRONOMÈTRE ---
function clearTurnTimer(roomId: string) {
  if (activeTimers.has(roomId)) {
	clearTimeout(activeTimers.get(roomId));
	activeTimers.delete(roomId);
  }
}

function startTurnTimer(io: Server, roomId: string, delayMs: number = 0) {
  const room = activeRooms.get(roomId);
  if (!room || !room.isTimerModeEnabled) return;

  clearTurnTimer(roomId);

  const durationMs = (room.timerDuration || 15) * 1000;

  // On décale la fin du tour pour absorber l'animation
  room.turnEndTime = Date.now() + durationMs + delayMs;

  const timeoutId = setTimeout(() => {
	executeRandomCut(io, roomId);
  }, durationMs + delayMs);

  activeTimers.set(roomId, timeoutId);
}

function executeRandomCut(io: Server, roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'PLAYING' || room.phase !== 'PLAYING') return;

  const clippersId = room.playerWithClippers;
  // Trouver tous les joueurs ciblables (sauf celui qui a la pince, et qui ont encore des cartes)
  const validPlayers = room.players.filter(p => p.id !== clippersId && p.cards.some(c => !c.isRevealed));

  if (validPlayers.length === 0) return;

  // Choix aléatoire d'un joueur et d'une de ses cartes
  const randomPlayer = validPlayers[Math.floor(Math.random() * validPlayers.length)];
  const unrevealedCards = randomPlayer.cards.filter(c => !c.isRevealed);
  const randomCard = unrevealedCards[Math.floor(Math.random() * unrevealedCards.length)];

  // On exécute la coupe de force
  handleCutLogic(io, roomId, clippersId, randomPlayer.id, randomCard.id);
}

// --- LOGIQUE COMMUNE DE COUPE ---
function handleCutLogic(io: Server, roomId: string, sourcePlayerId: string, targetPlayerId: string, cardId: string) {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'PLAYING' || room.phase !== 'PLAYING') return;

  clearTurnTimer(roomId);

  if (room.playerWithClippers !== sourcePlayerId) return;
  if (sourcePlayerId === targetPlayerId) return;

  const targetPlayer = room.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return;

  const cardIndex = targetPlayer.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return;

  const card = targetPlayer.cards[cardIndex]!;
  if (!card || card.isRevealed) return;

  card.isRevealed = true;
  room.revealedCards.push(card);
  targetPlayer.cards.splice(cardIndex, 1);
  room.cardsRevealedThisRound++;
  room.playerWithClippers = targetPlayerId;

  if (room.stats) {
	recordCut(room.stats, sourcePlayerId, targetPlayerId, card.type, room.currentRound, room.cardsRevealedThisRound);
  }

  // Vérification de victoire
  if (card.type === 'BOMB') {
	room.status = 'FINISHED';
	room.winner = 'MORIARTY';
  } else if (card.type === 'DEFUSE') {
	room.totalDefusesFound++;
	if (room.totalDefusesFound === room.totalDefusesNeeded) {
	  room.status = 'FINISHED';
	  room.winner = 'SHERLOCK';
	}
  } else if (card.type === 'LOUPE') {
	room.teamHasLoupe = true;
  }

  // Vérification de fin de manche
  if (room.status === 'PLAYING' && room.cardsRevealedThisRound === room.players.length) {
	if (room.stats) {
	  const defusesThisRound = room.revealedCards.slice(-room.players.length).filter(c => c.type === 'DEFUSE').length;
	  recordRoundEnd(room.stats, defusesThisRound, false);
	}

	if (room.currentRound === 4) {
	  room.status = 'FINISHED';
	  room.winner = 'MORIARTY';
	} else {
	  room.currentRound++;
	  room.cardsRevealedThisRound = 0;
	  room.phase = 'CARD_REVEAL';
	  room.readyPlayers = [];
	  const newDeck = gatherAndShuffleRemainingCards(room.players);
	  distributeCards(newDeck, room.players);
	}
  }

  if (room.status === 'FINISHED' && room.stats) {
	processEndGameStats(room, room.stats)
		.then(unlockedBadges => {
		  if (unlockedBadges && unlockedBadges.length > 0) {
			io.to(roomId).emit('achievementsUnlocked', unlockedBadges);
		  }
		})
		.catch(err => console.error("Erreur d'attribution des succès :", err));
  }

  // Si le jeu continue sur la même manche, on relance le chronomètre pour le nouveau joueur
  if (room.status === 'PLAYING' && room.phase === 'PLAYING') {
	startTurnTimer(io, roomId, 2500);
  }

  broadcastGameState(io, roomId);
}


// --- GESTION DES CONNEXIONS / RECONNEXIONS ---

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

/** Removes a player from a room, transferring host or destroying the room as needed. */
function removePlayer(io: Server, roomId: string, playerId: string) {
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
  // Transfère l'ownership si l'hôte part.
  if (!room.players.some(p => p.isHost)) room.players[0].isHost = true;

  // La Loupe nécessite au moins 5 joueurs : on la désactive automatiquement en dessous
  if (room.players.length < 5) room.isLoupeModeEnabled = false;

  // Si un joueur quitte l'écran de fin, les restants déjà prêts ne doivent pas
  // rester bloqués : on bascule au lobby dès que tout le monde est prêt.
  if (room.status === 'FINISHED' && everyoneReadyToRestart(room)) resetRoomToLobby(roomId);

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
function handleDisconnect(io: Server, roomId: string, playerId: string) {
  const room = activeRooms.get(roomId);
  const player = room?.players.find(p => p.id === playerId);
  if (!room || !player) return;

  player.connected = false;
  player.socketId = undefined;

  // Un déconnecté sur l'écran de fin ne doit pas empêcher les autres de relancer.
  if (room.status === 'FINISHED' && everyoneReadyToRestart(room)) resetRoomToLobby(roomId);

  broadcastGameState(io, roomId);

  cancelScheduledRemoval(roomId, playerId);
  const timer = setTimeout(() => {
    disconnectTimers.delete(disconnectKey(roomId, playerId));
    const current = activeRooms.get(roomId);
    const stillThere = current?.players.find(p => p.id === playerId);
    if (!current || !stillThere || stillThere.connected) return; // revenu entre-temps

    // Room totalement abandonnée -> on la détruit (évite les rooms/timers fantômes).
    if (current.players.every(p => !p.connected)) {
      destroyRoom(roomId);
      return;
    }

    // Dans le lobby, un absent libère sa place ; en pleine partie on garde le
    // siège pour une reconnexion ultérieure (l'état reste cohérent et les
    // autres peuvent toujours voter l'abandon).
    if (current.status === 'LOBBY') {
      removePlayer(io, roomId, playerId);
    }
  }, RECONNECT_GRACE_MS);

  disconnectTimers.set(disconnectKey(roomId, playerId), timer);
}

/**
 * True once every player still present has either gone back to the menus
 * ("Rejouer") or is disconnected — i.e. nobody connected is left on the end
 * screen. Used to decide when the whole room may return to the lobby.
 */
function everyoneReadyToRestart(room: GameState): boolean {
  if (room.players.length === 0) return false;
  const ready = room.restartReady ?? [];
  return room.players.every(p => ready.includes(p.id) || p.connected === false);
}

/** Resets a room to its lobby state. Shared by restart & surrender (DRY). */
function resetRoomToLobby(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  clearTurnTimer(roomId);

  room.status = 'LOBBY';
  room.phase = 'NOT_STARTED';
  room.readyPlayers = [];
  room.restartReady = [];
  room.revealedCards = [];
  room.currentRound = 1;
  room.cardsRevealedThisRound = 0;
  room.totalDefusesFound = 0;
  room.teamHasLoupe = false;
  room.surrenderVotes = [];
  delete room.stats;

  room.players.forEach(p => {
    p.cards = [];
    p.secretCards = [];
    delete p.role;
  });
}

export function setupSocketHandlers(io: Server, socket: Socket) {

  socket.on('login', async (username: string, pin: string, callback: Function) => {
	try {
	  const user = await authenticatePlayer(username, pin);
	  callback({success: true, user});
	} catch (error: any) {
	  callback({success: false, error: error.message});
	}
  });

  socket.on('checkReconnection', (playerId: string) => {
	for (const [roomId, room] of activeRooms.entries()) {
	  const player = room.players.find(p => p.id === playerId);
	  if (player) {
		markConnected(roomId, playerId, socket.id);
		socket.join(roomId);
		io.to(socket.id).emit('gameStateUpdated', sanitizeStateForPlayer(room, playerId));
		broadcastGameState(io, roomId);
		return;
	  }
	}
  });

  socket.on('getOpenRooms', () => {
	const openRooms = [];
	for (const [roomId, room] of activeRooms.entries()) {
	  if (room.status === 'LOBBY') {
		openRooms.push({roomId, playerCount: room.players.length});
	  }
	}
	socket.emit('openRoomsList', openRooms);
  });

  socket.on('createRoom', (playerName: string, playerId: string) => {
	const roomId = generateRoomCode();
	const room: GameState = {
	  roomId,
	  phase: 'NOT_STARTED',
	  status: 'LOBBY',
	  players: [],
	  currentRound: 1,
	  cardsRevealedThisRound: 0,
	  totalDefusesFound: 0,
	  totalDefusesNeeded: 0,
	  playerWithClippers: '',
	  isLoupeModeEnabled: false,
	  isTimerModeEnabled: false,
	  isChaosModeEnabled: false,
	  timerDuration: 15,
	  teamHasLoupe: false,
	  revealedCards: [],
	  readyPlayers: [],
	  surrenderVotes: [],
	};

	room.players.push({id: playerId, name: playerName, cards: [], isHost: true, socketId: socket.id, connected: true});
	activeRooms.set(roomId, room);
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  socket.on('toggleLoupeMode', (roomId: string, enabled: boolean) => {
	const room = activeRooms.get(roomId);
	if (room && room.status === 'LOBBY') {
	  const me = room.players.find(p => p.socketId === socket.id);
	  if (me && me.isHost) {
		room.isLoupeModeEnabled = enabled;
		broadcastGameState(io, roomId);
	  }
	}
  });

  // --- Handler Toggle Chaos ---
  socket.on('toggleChaosMode', (roomId: string, enabled: boolean) => {
	const room = activeRooms.get(roomId);
	if (room && room.status === 'LOBBY') {
	  const me = room.players.find(p => p.socketId === socket.id);
	  if (me && me.isHost) {
		room.isChaosModeEnabled = enabled;
		broadcastGameState(io, roomId);
	  }
	}
  });

  // --- NOUVEAU : Handler Toggle Chrono ---
  socket.on('toggleTimerMode', (roomId: string, enabled: boolean, duration: number) => {
	const room = activeRooms.get(roomId);
	if (room && room.status === 'LOBBY') {
	  const me = room.players.find(p => p.socketId === socket.id);
	  if (me && me.isHost) {
		room.isTimerModeEnabled = enabled;
		room.timerDuration = duration;
		broadcastGameState(io, roomId);
	  }
	}
  });

  socket.on('joinRoom', (roomId: string, playerName: string, playerId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return socket.emit('gameError', 'Ce code de Room n\'existe pas');

	const existingPlayer = room.players.find(p => p.id === playerId);
	if (existingPlayer) {
	  // Reconnexion / rejoin : on rebranche le joueur sur son siège existant.
	  markConnected(roomId, playerId, socket.id);
	  socket.join(roomId);
	  broadcastGameState(io, roomId);
	  return;
	}

	if (room.status !== 'LOBBY') return socket.emit('gameError', 'Partie déjà en cours, lobby fermé');
	if (room.players.length >= MAX_PLAYERS) return socket.emit('gameError', `Room complète (${MAX_PLAYERS} joueurs max)`);

	room.players.push({id: playerId, name: playerName, cards: [], isHost: false, socketId: socket.id, connected: true});
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  socket.on('startGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'LOBBY' || room.players.length < 4 || room.players.length > MAX_PLAYERS) return;
	const randomIndex = Math.floor(Math.random() * room.players.length);

	room.status = 'PLAYING';
	room.phase = 'ROLE_REVEAL';
	room.readyPlayers = [];
	room.revealedCards = [];
	room.totalDefusesFound = 0;
	room.totalDefusesNeeded = room.players.length;
	room.playerWithClippers = room.players[randomIndex].id;
	room.teamHasLoupe = false;
	room.stats = initGameSessionStats();

	if (room.isChaosModeEnabled) {
	  assignRolesChaos(room.players);
	} else {
	  assignRoles(room.players, room.isLoupeModeEnabled);
	}
	const deck = generateInitialDeck(room.players.length as ValidPlayerCount, room.isLoupeModeEnabled);
	distributeCards(deck, room.players);
	broadcastGameState(io, roomId);
  });

  socket.on('confirmRole', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.phase !== 'ROLE_REVEAL') return;
	const player = room.players.find(p => p.socketId === socket.id);
	if (player && !room.readyPlayers.includes(player.id)) room.readyPlayers.push(player.id);
	if (room.readyPlayers.length === room.players.length) {
	  room.phase = 'CARD_REVEAL';
	  room.readyPlayers = [];
	}
	broadcastGameState(io, roomId);
  });

  socket.on('confirmCards', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.phase !== 'CARD_REVEAL') return;
	const player = room.players.find(p => p.socketId === socket.id);
	if (player && !room.readyPlayers.includes(player.id)) room.readyPlayers.push(player.id);
	if (room.readyPlayers.length === room.players.length) {
	  room.phase = 'PLAYING';
	  room.readyPlayers = [];
	  startTurnTimer(io, roomId);
	}
	broadcastGameState(io, roomId);
  });

  socket.on('cutCard', (roomId: string, targetPlayerId: string, cardId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return;
	const me = room.players.find(p => p.socketId === socket.id);
	if (!me) return;

	handleCutLogic(io, roomId, me.id, targetPlayerId, cardId);
  });

  socket.on('getUserProfile', async (playerId, callback) => {
	try {
	  const user = await prisma.user.findUnique({
		where: { id: playerId },
		include: { achievements: true }
	  });

	  if (!user) return callback(null);

	  const unlockedIds = user.achievements.map(a => a.achievementId);

	  // Fonction de progression (déplacée du front vers le back)
	  const getProgress = (achId: string) => {
		if (achId.startsWith('DEMOLITION')) return user.bombsExploded || 0;
		if (achId.startsWith('DOIGTS_FEE')) return user.cablesCut || 0;
		if (achId.startsWith('ROI_STRATEGIE')) return user.gamesWon || 0;
		if (achId.startsWith('SHERLOCK')) return user.winsSherlock || 0;
		if (achId.startsWith('MORIARTY')) return user.winsMoriarty || 0;
		if (achId.startsWith('OEIL_LYNX')) return user.loupesUsed || 0;
		if (achId.startsWith('BROUILLEUR')) return user.cardsJammed || 0;
		return unlockedIds.includes(achId) ? 1 : 0;
	  };

	  // Grouper et filtrer les paliers
	  const groups: Record<string, AchievementDef[]> = {};
	  Object.values(ACHIEVEMENTS).forEach((ach) => {
		const baseId = ach.id.replace(/_\d+$/, '');
		if (!groups[baseId]) groups[baseId] = [];
		groups[baseId].push(ach);
	  });

	  const formattedAchievements: any[] = [];

	  Object.values(groups).forEach((group) => {
		group.sort((a, b) => (a.tier || 0) - (b.tier || 0));
		let currentAch = group[0];
		for (let i = 0; i < group.length; i++) {
		  if (!unlockedIds.includes(group[i].id)) {
			currentAch = group[i];
			break;
		  }
		  currentAch = group[i];
		}

		const rawProgress = getProgress(currentAch.id);
		const isOneShot = currentAch.target === undefined;
		const progress = isOneShot ? rawProgress : Math.min(rawProgress, currentAch.target!);
		const percent = !isOneShot ? Math.round((progress / currentAch.target!) * 100) : (unlockedIds.includes(currentAch.id) ? 100 : 0);

		formattedAchievements.push({
		  ...currentAch,
		  isUnlocked: unlockedIds.includes(currentAch.id),
		  progress,
		  percent,
		  isOneShot
		});
	  });

	  // On renvoie l'objet formaté complet
	  callback({ ...user, formattedAchievements });

	} catch (error) {
	  console.error("Erreur profil:", error);
	  callback(null);
	}
  });

  socket.on('useLoupe', (roomId: string, targetPlayerId: string, cardId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'PLAYING' || !room.teamHasLoupe) return;

	// Règle 1 : Inutilisable au dernier round (Manche 4)
	if (room.currentRound >= 4) return;

	const targetPlayer = room.players.find(p => p.id === targetPlayerId);
	if (!targetPlayer) return;

	// Règle 2 : Inutilisable sur un joueur avec une seule carte cachée
	const hiddenCards = targetPlayer.cards.filter(c => !c.isRevealed && !c.isPublic);
	if (hiddenCards.length <= 1) return;

	const card = targetPlayer.cards.find(c => c.id === cardId);
	if (!card || card.isRevealed || card.isPublic) return;

	room.teamHasLoupe = false;

	let successChance;

	if (targetPlayer.role === 'BROUILLEUR') {
	  // Le pouvoir passif du Brouilleur s'active : 90% de chance d'échec
	  successChance = 0.1;
	} else {
	  // Calcul normal : 100% Round 1, 90% Round 2, 80% Round 3
	  successChance = 1 - ((room.currentRound - 1) * 0.1);
	}

	const isSuccess = Math.random() <= successChance;

	const me = room.players.find(p => p.socketId === socket.id);
	if (me && room.stats) {
	  const isJammed = targetPlayer.role === 'BROUILLEUR' && !isSuccess;
	  recordLoupe(room.stats, me.id, isJammed, isJammed ? targetPlayer.id : undefined);
	}

	if (isSuccess) {
	  card.isPublic = true;
	  io.to(roomId).emit('loupeResult', {success: true, targetName: targetPlayer.name});
	} else {
	  io.to(roomId).emit('loupeResult', {success: false, targetName: targetPlayer.name});
	}

	// On accorde un délai supplémentaire au timer pour compenser l'animation de la loupe
	if (room.isTimerModeEnabled && activeTimers.has(roomId)) {
	  clearTurnTimer(roomId);

	  const remainingMs = Math.max(0, (room.turnEndTime || Date.now()) - Date.now());
	  const newRemainingMs = remainingMs + 3000; // <-- Délai de la loupe

	  room.turnEndTime = Date.now() + newRemainingMs;

	  const timeoutId = setTimeout(() => {
		executeRandomCut(io, roomId);
	  }, newRemainingMs);

	  activeTimers.set(roomId, timeoutId);
	}

	broadcastGameState(io, roomId);
  });

  socket.on('leaveRoom', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return;

	// Départ explicite : on libère immédiatement le siège (pas de délai de grâce).
	const player = room.players.find(p => p.socketId === socket.id);
	if (player) removePlayer(io, roomId, player.id);
	socket.leave(roomId);
  });

  socket.on('kickPlayer', (roomId: string, targetPlayerId: string) => {
	const room = activeRooms.get(roomId);
	// On ne peut expulser que depuis le lobby (jamais en pleine partie).
	if (!room || room.status !== 'LOBBY') return;

	const me = room.players.find(p => p.socketId === socket.id);
	if (!me || !me.isHost) return;        // Seul l'hôte expulse.
	if (me.id === targetPlayerId) return; // L'hôte ne peut pas s'expulser lui-même.

	const target = room.players.find(p => p.id === targetPlayerId);
	if (!target) return;

	// On prévient le joueur expulsé pour qu'il revienne au menu, puis on libère son siège.
	if (target.socketId) {
	  io.to(target.socketId).emit('kicked');
	  io.sockets.sockets.get(target.socketId)?.leave(roomId);
	}

	removePlayer(io, roomId, targetPlayerId);
  });

  socket.on('restartGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'FINISHED') return;

	const player = room.players.find(p => p.socketId === socket.id);
	if (!player) return;

	// "Rejouer" est individuel : le joueur rejoint les menus et attend les autres.
	if (!room.restartReady) room.restartReady = [];
	if (!room.restartReady.includes(player.id)) room.restartReady.push(player.id);

	// La room ne retourne au lobby que lorsque tout le monde a cliqué.
	if (everyoneReadyToRestart(room)) resetRoomToLobby(roomId);

	broadcastGameState(io, roomId);
  });

  socket.on('disconnect', () => {
	console.log('💨 Joueur déconnecté:', socket.id);
	// On marque le joueur comme déconnecté et on arme le délai de grâce, plutôt
	// que de le retirer immédiatement : un rafraîchissement ou un blip réseau ne
	// doit pas l'éjecter de sa partie en cours.
	for (const [roomId, room] of activeRooms.entries()) {
	  const player = room.players.find(p => p.socketId === socket.id);
	  if (player) {
		handleDisconnect(io, roomId, player.id);
		break;
	  }
	}
  });

  socket.on('updateUsername', async ({ playerId, newName }, callback) => {
	try {
	  // 1. Vérifier que le pseudo n'est pas déjà pris par quelqu'un d'autre
	  const existingUser = await prisma.user.findUnique({ where: { username: newName } });
	  if (existingUser && existingUser.id !== playerId) {
		return callback({ success: false, error: "Ce pseudo est déjà utilisé par un autre agent." });
	  }

	  // 2. Mettre à jour en BDD
	  await prisma.user.update({
		where: { id: playerId },
		data: { username: newName }
	  });

	  // 3. (Optionnel) Mettre à jour le nom dans la room active si le joueur est en jeu
	  for (const [roomId, room] of activeRooms.entries()) {
		const player = room.players.find(p => p.id === playerId);
		if (player) {
		  player.name = newName;
		  broadcastGameState(io, roomId);
		}
	  }

	  callback({ success: true });
	} catch (error) {
	  console.error("Erreur updateUsername:", error);
	  callback({ success: false, error: "Erreur serveur lors de la mise à jour." });
	}
  });

  socket.on('voteSurrender', (roomId: string, playerId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'PLAYING') return;

	if (!room.surrenderVotes) room.surrenderVotes = [];
	if (!room.surrenderVotes.includes(playerId)) {
	  room.surrenderVotes.push(playerId);
	}

	// Majorité absolue
	const requiredVotes = Math.floor(room.players.length / 2) + 1;

	if (room.surrenderVotes.length >= requiredVotes) {
	  resetRoomToLobby(roomId);
	  io.to(roomId).emit('gameSurrendered');
	}

	broadcastGameState(io, roomId);
  });
}
