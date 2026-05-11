// server/src/roomManager.ts
import {Server, Socket} from 'socket.io';
import {GameState, ValidPlayerCount} from '@timebomb/shared';
import {assignRoles, generateInitialDeck, distributeCards, gatherAndShuffleRemainingCards} from './gameEngine';

const activeRooms = new Map<string, GameState>();

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
	}

	// CORRECTION LOUPE : On masque le type sauf si la carte est révélée (coupée) OU publique (scannée)
	p.cards = p.cards.map(c => (c.isRevealed || c.isPublic) ? c : {...c, type: 'SAFE'});
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

export function setupSocketHandlers(io: Server, socket: Socket) {

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
	  teamHasLoupe: false,
	  revealedCards: [],
	  readyPlayers: []
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
	if (room.players.length >= 8) return socket.emit('gameError', 'Room complète (8 joueurs max)');

	room.players.push({id: playerId, name: playerName, cards: [], isHost: false, socketId: socket.id} as any);
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  socket.on('startGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'LOBBY' || room.players.length < 4 || room.players.length > 8) return;
	const randomIndex = Math.floor(Math.random() * room.players.length);

	room.status = 'PLAYING';
	room.phase = 'ROLE_REVEAL';
	room.readyPlayers = [];
	room.revealedCards = [];
	room.totalDefusesFound = 0;
	room.totalDefusesNeeded = room.players.length;
	room.playerWithClippers = room.players[randomIndex].id;
	room.teamHasLoupe = false; // Reset du joker

	assignRoles(room.players, room.isLoupeModeEnabled);
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
	}
	broadcastGameState(io, roomId);
  });

  socket.on('cutCard', (roomId: string, targetPlayerId: string, cardId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'PLAYING' || room.phase !== 'PLAYING') return;

	const me = room.players.find(p => p.socketId === socket.id);
	if (!me || room.playerWithClippers !== me.id) return;
	if (me.id === targetPlayerId) return;

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

	if (room.status === 'PLAYING' && room.cardsRevealedThisRound === room.players.length) {
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
	broadcastGameState(io, roomId);
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

	// On consomme le joker
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

	if (isSuccess) {
	  card.isPublic = true;
	  io.to(roomId).emit('loupeResult', {success: true, targetName: targetPlayer.name});
	} else {
	  io.to(roomId).emit('loupeResult', {success: false, targetName: targetPlayer.name});
	}

	broadcastGameState(io, roomId);
  });

  socket.on('restartGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return;
	room.status = 'LOBBY';
	room.phase = "NOT_STARTED";
	room.readyPlayers = [];
	room.revealedCards = [];
	room.currentRound = 1;
	room.cardsRevealedThisRound = 0;
	room.totalDefusesFound = 0;
	room.teamHasLoupe = false;

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
		if (room.status === 'LOBBY') {
		  // S'ils sont dans le lobby, on les supprime vraiment
		  room.players.splice(playerIndex, 1);
		  if (room.players.length === 0) {
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
}
