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
		player.socketId = socket.id;
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

	room.players.push({id: playerId, name: playerName, cards: [], isHost: true, socketId: socket.id});
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
	  existingPlayer.socketId = socket.id;
	  socket.join(roomId);
	  broadcastGameState(io, roomId);
	  return;
	}

	if (room.status !== 'LOBBY') return socket.emit('gameError', 'Partie déjà en cours, lobby fermé');
	if (room.players.length >= MAX_PLAYERS) return socket.emit('gameError', `Room complète (${MAX_PLAYERS} joueurs max)`);

	room.players.push({id: playerId, name: playerName, cards: [], isHost: false, socketId: socket.id} as any);
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

	const playerIndex = room.players.findIndex(p => (p as any).socketId === socket.id);
	if (playerIndex !== -1) {
	  room.players.splice(playerIndex, 1);
	  if (room.players.length === 0) {
		clearTurnTimer(roomId);
		activeRooms.delete(roomId);
	  } else {
		// Transfère l'ownership si l'hôte part
		if (!room.players.some(p => p.isHost)) room.players[0].isHost = true;
		broadcastGameState(io, roomId);
	  }
	}
	socket.leave(roomId);
  });

  socket.on('restartGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return;

	clearTurnTimer(roomId);

	room.status = 'LOBBY';
	room.phase = "NOT_STARTED";
	room.readyPlayers = [];
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

	broadcastGameState(io, roomId);
  });

  socket.on('disconnect', () => {
	for (const [roomId, room] of activeRooms.entries()) {
	  const playerIndex = room.players.findIndex(p => (p as any).socketId === socket.id);
	  if (playerIndex !== -1) {
		if (room.status === 'LOBBY' || room.status === 'FINISHED') {
		  room.players.splice(playerIndex, 1);
		  if (room.players.length === 0) {
			clearTurnTimer(roomId);
			activeRooms.delete(roomId);
		  } else {
			// Si l'hôte part, on donne le lead au suivant
			if (!room.players.some(p => p.isHost)) room.players[0].isHost = true;
			broadcastGameState(io, roomId);
		  }
		}
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
	  clearTurnTimer(roomId);

	  room.status = 'LOBBY';
	  room.phase = 'NOT_STARTED';
	  room.surrenderVotes = [];
	  room.readyPlayers = [];
	  room.revealedCards = [];
	  room.currentRound = 1;
	  room.cardsRevealedThisRound = 0;
	  room.totalDefusesFound = 0;
	  room.teamHasLoupe = false;
	  delete room.stats;

	  room.players.forEach(p => {
		p.cards = [];
		p.secretCards = [];
		delete p.role;
	  });

	  io.to(roomId).emit('gameSurrendered');
	}

	broadcastGameState(io, roomId);
  });
}
