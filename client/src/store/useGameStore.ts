// client/src/store/useGameStore.ts
import {create} from 'zustand';
import {io, Socket} from 'socket.io-client';
import type {GameState} from '../../../shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Fonction pour générer ou récupérer l'ID unique du joueur sur cet appareil
const getPersistentPlayerId = () => {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('timebomb_playerId');
  if (!id) {
	id = Math.random().toString(36).substring(2, 15);
	sessionStorage.setItem('timebomb_playerId', id);
  }
  return id;
};

interface RoomInfo {
  roomId: string;
  playerCount: number;
}

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerName: string;
  playerId: string;
  isAnimatingCut: boolean;
  openRooms: RoomInfo[];
  error: string | null;

  loupeAnimation: { success: boolean, targetName: string } | null;
  isScannerActive: boolean; // Le mode scanner devient global
  setScannerActive: (active: boolean) => void;
  toggleLoupeMode: (roomId: string, enabled: boolean) => void;
  useLoupe: (roomId: string, targetPlayerId: string, cardId: string) => void;

  setPlayerName: (name: string) => void;
  clearError: () => void;
  initSocket: () => void;
  createRoom: (name: string) => void;
  joinRoom: (roomId: string, name: string) => void;
  fetchOpenRooms: () => void;
  startGame: (roomId: string) => void;
  cutCard: (roomId: string, targetPlayerId: string, cardId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerName: '',
  playerId: getPersistentPlayerId(),
  isAnimatingCut: false,
  openRooms: [],
  error: null,

  loupeAnimation: null,
  isScannerActive: false,
  setScannerActive: (active) => set({ isScannerActive: active }),

  setPlayerName: (name) => set({playerName: name}),
  clearError: () => set({error: null}),

  initSocket: () => {
	if (get().socket) return;
	const socket = io(SOCKET_URL);

	socket.on('gameStateUpdated', (newState: GameState) => {
	  const currentState = get().gameState;
	  if (currentState && newState.revealedCards && currentState.revealedCards && newState.revealedCards.length > currentState.revealedCards.length) {
		set({isAnimatingCut: true});
		setTimeout(() => set({isAnimatingCut: false}), 2500);
	  }
	  set({gameState: newState, error: null});
	});

	socket.on('openRoomsList', (rooms: RoomInfo[]) => {
	  set({openRooms: rooms});
	});

	socket.on('gameError', (msg: string) => {
	  set({error: msg});
	});

	socket.on('loupeResult', (result: { success: boolean, targetName: string }) => {
	  set({ loupeAnimation: result, isScannerActive: false });
	  setTimeout(() => set({ loupeAnimation: null }), 3000);
	});

	// AUTO-RECONNEXION : Au démarrage, on demande au serveur si on est déjà dans une partie
	socket.on('connect', () => {
	  socket.emit('checkReconnection', get().playerId);
	});

	set({socket});
  },

  createRoom: (name) => {
	const {socket, playerId} = get();
	if (socket) socket.emit('createRoom', name, playerId);
  },

  joinRoom: (roomId, name) => {
	const {socket, playerId} = get();
	if (socket) socket.emit('joinRoom', roomId, name, playerId);
  },

  fetchOpenRooms: () => {
	const {socket} = get();
	if (socket) socket.emit('getOpenRooms');
  },

  startGame: (roomId) => {
	const {socket} = get();
	if (socket) socket.emit('startGame', roomId);
  },

  cutCard: (roomId, targetPlayerId, cardId) => {
	const {socket} = get();
	if (socket) socket.emit('cutCard', roomId, targetPlayerId, cardId);
  },

  toggleLoupeMode: (roomId, enabled) => {
	const { socket } = get();
	if (socket) socket.emit('toggleLoupeMode', roomId, enabled);
  },

  useLoupe: (roomId, targetPlayerId, cardId) => {
	const { socket } = get();
	if (socket) socket.emit('useLoupe', roomId, targetPlayerId, cardId);
	set({ isScannerActive: false });
  }
}));
