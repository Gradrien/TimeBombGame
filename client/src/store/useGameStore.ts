// client/src/store/useGameStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../../../shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerName: string;
  isAnimatingCut: boolean;
  setPlayerName: (name: string) => void;
  initSocket: () => void;
  joinRoom: (roomId: string, name: string) => void;
  startGame: (roomId: string) => void;
  cutCard: (roomId: string, targetPlayerId: string, cardId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerName: '',
  isAnimatingCut: false,

  setPlayerName: (name) => set({ playerName: name }),

  initSocket: () => {
	if (get().socket) return;
	const socket = io(SOCKET_URL);

	socket.on('gameStateUpdated', (newState: GameState) => {
	  const currentState = get().gameState;

	  // MAGIE DU TIMING : Si le tableau de cartes révélées a grandi, c'est qu'il y a eu une coupe !
	  if (currentState && newState.revealedCards && currentState.revealedCards && newState.revealedCards.length > currentState.revealedCards.length) {
		set({ isAnimatingCut: true });
		// On libère le changement d'écran après 2.5s (durée de l'animation)
		setTimeout(() => set({ isAnimatingCut: false }), 2500);
	  }

	  set({ gameState: newState });
	});

	set({ socket });
  },

  joinRoom: (roomId, name) => {
	const { socket } = get();
	if (socket) socket.emit('joinRoom', roomId, name);
  },

  startGame: (roomId) => {
	const { socket } = get();
	if (socket) socket.emit('startGame', roomId);
  },

  cutCard: (roomId, targetPlayerId, cardId) => {
	const { socket } = get();
	if (socket) socket.emit('cutCard', roomId, targetPlayerId, cardId);
  }
}));
