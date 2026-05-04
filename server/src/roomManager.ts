// server/src/roomManager.ts
import { Server, Socket } from 'socket.io';
import { GameState } from '@timebomb/shared';
import { assignRoles, generateInitialDeck, distributeCards, gatherAndShuffleRemainingCards } from './gameEngine';

// Stockage en RAM de toutes les parties en cours
const activeRooms = new Map<string, GameState>();

// Fonction cruciale : nettoie l'état du jeu pour qu'un joueur ne triche pas
function sanitizeStateForPlayer(gameState: GameState, targetPlayerId: string): GameState {
  // On fait une copie profonde (simplifiée) de l'état
  const sanitized = JSON.parse(JSON.stringify(gameState)) as GameState;

  sanitized.players = sanitized.players.map(p => {
	// 1. On donne au joueur ciblé le résumé exact de sa main
	if (p.id === targetPlayerId) {
	  p.secretCards = p.cards.filter(c => !c.isRevealed).map(c => c.type);
	} else {
	  delete p.role; // On cache le rôle des autres
	}

	// 2. On masque le type de TOUTES les cartes non révélées sur le plateau
	// (Même les miennes ! Comme ça, je ne sais pas à quel emplacement est ma bombe)
	p.cards = p.cards.map(c =>
		c.isRevealed ? c : { ...c, type: 'SAFE' }
	);

	return p;
  });

  return sanitized;
}

// Fonction utilitaire pour envoyer l'état à jour à tous les joueurs d'une room
function broadcastGameState(io: Server, roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  // On envoie une version personnalisée à chaque joueur
  room.players.forEach(player => {
	const safeState = sanitizeStateForPlayer(room, player.id);
	io.to(player.id).emit('gameStateUpdated', safeState);
  });
}

export function setupSocketHandlers(io: Server, socket: Socket) {

  // REJOINDRE OU CRÉER UNE ROOM
  socket.on('joinRoom', (roomId: string, playerName: string) => {
	socket.join(roomId);

	let room = activeRooms.get(roomId);
	if (!room) {
	  // Création d'une nouvelle room
	  room = {
		roomId,
		status: 'LOBBY',
		players: [],
		currentRound: 1,
		cardsRevealedThisRound: 0,
		totalDefusesFound: 0,
		totalDefusesNeeded: 0,
		playerWithClippers: '',
	  };
	  activeRooms.set(roomId, room);
	}

	// On évite les doublons si le joueur rafraîchit la page
	const existingPlayer = room.players.find(p => p.id === socket.id);
	if (!existingPlayer) {
	  room.players.push({
		id: socket.id,
		name: playerName,
		cards: [],
		isHost: room.players.length === 0, // Le premier est l'hôte
	  });
	}

	broadcastGameState(io, roomId);
  });

  // LANCER LA PARTIE
  socket.on('startGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.status !== 'LOBBY' || room.players.length < 4 || room.players.length > 8) return;

	// Le joueur qui a rejoint en dernier commence avec la pince (règle officielle)
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

  // 2. Validation du rôle
  socket.on('confirmRole', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.phase !== 'ROLE_REVEAL') return;

	if (!room.readyPlayers.includes(socket.id)) {
	  room.readyPlayers.push(socket.id);
	}

	// Si tout le monde a vu son rôle, on passe à la révélation des cartes
	if (room.readyPlayers.length === room.players.length) {
	  room.phase = 'CARD_REVEAL';
	  room.readyPlayers = [];
	}
	broadcastGameState(io, roomId);
  });

// 3. Validation des cartes du round
  socket.on('confirmCards', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room || room.phase !== 'CARD_REVEAL') return;

	if (!room.readyPlayers.includes(socket.id)) {
	  room.readyPlayers.push(socket.id);
	}

	if (room.readyPlayers.length === room.players.length) {
	  room.phase = 'PLAYING';
	  room.readyPlayers = [];
	}
	broadcastGameState(io, roomId);
  });

  // COUPER UNE CARTE
  socket.on('cutCard', (roomId: string, targetPlayerId: string, cardId: string) => {
	const room = activeRooms.get(roomId);

	// On vérifie que la partie est en cours ET qu'on n'est pas dans un écran de révélation
	if (!room || room.status !== 'PLAYING' || room.phase !== 'PLAYING') return;

	// Vérifier que c'est bien le joueur qui a la pince qui joue
	if (room.playerWithClippers !== socket.id) return;

	// On ne se coupe pas soi-même
	if (socket.id === targetPlayerId) return;

	const targetPlayer = room.players.find(p => p.id === targetPlayerId);
	if (!targetPlayer) return;

	// Trouver l'index de la carte pour pouvoir la retirer du tableau
	const cardIndex = targetPlayer.cards.findIndex(c => c.id === cardId);
	if (cardIndex === -1) return;

	const card = targetPlayer.cards[cardIndex]!;
	if (!card || card.isRevealed) return;

	// L'action est valide, on révèle la carte
	card.isRevealed = true;

	// On déplace la carte de la main du joueur vers le centre de la table
	room.revealedCards.push(card);
	targetPlayer.cards.splice(cardIndex, 1);

	room.cardsRevealedThisRound++;
	room.playerWithClippers = targetPlayerId; // La pince passe au joueur coupé

	// LOGIQUE DE VICTOIRE / DÉFAITE
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

	// VÉRIFICATION DE FIN DE MANCHE
	if (room.status === 'PLAYING' && room.cardsRevealedThisRound === room.players.length) {
	  if (room.currentRound === 4) {
		// Fin de la 4ème manche, bombe non explosée mais pas tous les defuses trouvés
		room.status = 'FINISHED';
		room.winner = 'MORIARTY';
	  } else {
		// On passe à la manche suivante
		room.currentRound++;
		room.cardsRevealedThisRound = 0;
		room.phase = 'CARD_REVEAL'; // Retour à la phase d'attente
		room.readyPlayers = []; // On réinitialise les validations

		const newDeck = gatherAndShuffleRemainingCards(room.players);
		distributeCards(newDeck, room.players);
	  }
	}

	broadcastGameState(io, roomId);
  });

  socket.on('restartGame', (roomId: string) => {
	const room = activeRooms.get(roomId);
	if (!room) return;

	// Réinitialisation complète
	room.status = 'PLAYING';
	room.phase = 'ROLE_REVEAL';
	room.readyPlayers = [];
	room.revealedCards = [];
	room.currentRound = 1;
	room.cardsRevealedThisRound = 0;
	room.totalDefusesFound = 0;
	room.winner = undefined;

	assignRoles(room.players);
	const deck = generateInitialDeck(room.players.length as any);
	distributeCards(deck, room.players);

	broadcastGameState(io, roomId);
  });

  // GESTION DE LA DÉCONNEXION
  socket.on('disconnect', () => {
	// Pour simplifier, on cherche le joueur dans toutes les rooms actives
	for (const [roomId, room] of activeRooms.entries()) {
	  const playerIndex = room.players.findIndex(p => p.id === socket.id);
	  if (playerIndex !== -1) {
		// En prod, il faudrait gérer la reconnexion avec un token.
		// Ici on le retire de la room.
		room.players.splice(playerIndex, 1);

		// S'il n'y a plus personne, on détruit la room
		if (room.players.length === 0) {
		  activeRooms.delete(roomId);
		} else {
		  broadcastGameState(io, roomId);
		}
		break;
	  }
	}
  });
}
