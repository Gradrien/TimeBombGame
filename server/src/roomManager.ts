// server/src/roomManager.ts
import { Server, Socket } from 'socket.io';
import { GameState } from '@timebomb/shared';
import { assignRoles, generateInitialDeck, distributeCards, gatherAndShuffleRemainingCards } from './gameEngine';

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
	p.cards = p.cards.map(c => c.isRevealed ? c : { ...c, type: 'SAFE' });
	return p;
  });
  return sanitized;
}

function broadcastGameState(io: Server, roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.players.forEach(player => {
	// On utilise maintenant 'socketId' pour envoyer l'état au bon onglet du joueur
	const safeState = sanitizeStateForPlayer(room, player.id);
	if (player.socketId) io.to(player.socketId).emit('gameStateUpdated', safeState);
  });
}

export function setupSocketHandlers(io: Server, socket: Socket) {

  // 1. RECONNEXION SILENCIEUSE
  socket.on('checkReconnection', (playerId: string) => {
	for (const [roomId, room] of activeRooms.entries()) {
	  const player = room.players.find(p => p.id === playerId);
	  if (player) {
		player.socketId = socket.id; // On met à jour son onglet actif
		socket.join(roomId);
		io.to(socket.id).emit('gameStateUpdated', sanitizeStateForPlayer(room, playerId));
		broadcastGameState(io, roomId); // Prévient les autres qu'il est de retour
		return;
	  }
	}
  });

  // 2. LISTER LES LOBBYS OUVERTS
  socket.on('getOpenRooms', () => {
	const openRooms = [];
	for (const [roomId, room] of activeRooms.entries()) {
	  if (room.status === 'LOBBY') {
		openRooms.push({ roomId, playerCount: room.players.length });
	  }
	}
	socket.emit('openRoomsList', openRooms);
  });

  // 3. CRÉER UNE ROOM
  socket.on('createRoom', (playerName: string, playerId: string) => {
	const roomId = generateRoomCode();
	const room: GameState = {
	  roomId, status: 'LOBBY', players: [], currentRound: 1,
	  cardsRevealedThisRound: 0, totalDefusesFound: 0, totalDefusesNeeded: 0, playerWithClippers: '',
	};
	// isOffline: false n'existe pas dans ton typage de base, on peut l'ignorer ou l'ajouter dans shared
	room.players.push({ id: playerId, name: playerName, cards: [], isHost: true, socketId: socket.id } as any);
	activeRooms.set(roomId, room);
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  // 4. REJOINDRE UNE ROOM
  socket.on('joinRoom', (roomId: string, playerName: string, playerId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return socket.emit('gameError', 'Ce code de Room n\'existe pas');

	// Vérifie si le joueur est déjà dedans (cas d'un refresh violent)
	const existingPlayer = room.players.find(p => p.id === playerId);
	if (existingPlayer) {
	  existingPlayer.socketId = socket.id;
	  socket.join(roomId);
	  broadcastGameState(io, roomId);
	  return;
	}

	if (room.status !== 'LOBBY') return socket.emit('gameError', 'Partie déjà en cours, lobby fermé');
	if (room.players.length >= 8) return socket.emit('gameError', 'Room complète (8 joueurs max)');

	room.players.push({ id: playerId, name: playerName, cards: [], isHost: false, socketId: socket.id } as any);
	socket.join(roomId);
	broadcastGameState(io, roomId);
  });

  // 5. LANCER ET JOUER (Même code qu'avant...)
  socket.on('startGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'LOBBY' || room.players.length < 4 || room.players.length > 8) return;
	const lastPlayer = room.players[room.players.length - 1];
	room.status = 'PLAYING';
	room.phase = 'ROLE_REVEAL';
	room.readyPlayers = [];
	room.revealedCards = [];
	room.totalDefusesFound = 0;
	room.totalDefusesNeeded = room.players.length;
	room.playerWithClippers = lastPlayer.id;

	assignRoles(room.players);
	const deck = generateInitialDeck(room.players.length as any);
	distributeCards(deck, room.players);
	broadcastGameState(io, roomId);
  });

  socket.on('confirmRole', (roomId: string) => { /* Ton code actuel */
	const room = activeRooms.get(roomId);
	if (!room || room.phase !== 'ROLE_REVEAL') return;
	const player = room.players.find(p => p.socketId === socket.id);
	if (player && !room.readyPlayers.includes(player.id)) room.readyPlayers.push(player.id);
	if (room.readyPlayers.length === room.players.length) { room.phase = 'CARD_REVEAL'; room.readyPlayers = []; }
	broadcastGameState(io, roomId);
  });

  socket.on('confirmCards', (roomId: string) => { /* Ton code actuel */
	const room = activeRooms.get(roomId);
	if (!room || room.phase !== 'CARD_REVEAL') return;
	const player = room.players.find(p => p.socketId === socket.id);
	if (player && !room.readyPlayers.includes(player.id)) room.readyPlayers.push(player.id);
	if (room.readyPlayers.length === room.players.length) { room.phase = 'PLAYING'; room.readyPlayers = []; }
	broadcastGameState(io, roomId);
  });

  socket.on('cutCard', (roomId: string, targetPlayerId: string, cardId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'PLAYING' || room.phase !== 'PLAYING') return;

	// On récupère le playerId de celui qui a cliqué
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

  // 6. REJOUER : On remet en mode LOBBY !
  socket.on('restartGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return;
	room.status = 'LOBBY';
	room.phase = undefined;
	room.readyPlayers = [];
	room.revealedCards = [];
	room.currentRound = 1;
	room.cardsRevealedThisRound = 0;
	room.totalDefusesFound = 0;
	room.winner = undefined;
	room.players.forEach(p => { p.cards = []; p.secretCards = []; p.role = undefined; });
	broadcastGameState(io, roomId);
  });

  // 7. DÉCONNEXION
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
		} else {
		  // En pleine partie, on ne fait rien pour ne pas casser le jeu !
		  // Le joueur pourra revenir grâce à la reconnexion automatique.
		}
		break;
	  }
	}
  });
}
