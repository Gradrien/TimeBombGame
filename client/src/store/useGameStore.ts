// client/src/store/useGameStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../../../shared';

// En dev ça tapera sur le port 3001, plus tard on mettra l'URL de ton VPS
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerName: string;
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

  setPlayerName: (name) => set({ playerName: name }),

  initSocket: () => {
	// On évite de créer de multiples connexions si le composant re-render
	if (get().socket) return;

	const socket = io(SOCKET_URL);

	// Le listener magique : dès que le serveur parle, React se met à jour
	socket.on('gameStateUpdated', (state: GameState) => {
	  set({ gameState: state });
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
