import {create} from 'zustand';
import {io} from 'socket.io-client';
import type {GameState} from '@timebomb/shared';
import type {GameStoreProps, RoomInfo} from "@/types/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const getSavedSession = () => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('timebomb_session');
  return saved ? JSON.parse(saved) : null;
};


export const useGameStore = create<GameStoreProps>((set, get) => ({
  socket: null,
  gameState: null,

  playerName: getSavedSession()?.username || '',
  playerId: getSavedSession()?.id || '',
  pinCode: getSavedSession()?.pinCode || '',

  isAnimatingCut: false,
  openRooms: [],
  error: null,
  isReviewingCards: false,
  setReviewingCards: (val) => set({isReviewingCards: val}),

  loupeAnimation: null,
  isScannerActive: false,
  setScannerActive: (active) => set({isScannerActive: active}),

  setPlayerName: (name) => set({playerName: name}),
  setPinCode: (pin) => set({pinCode: pin}),
  clearError: () => set({error: null}),

  login: (name, pin) => {
	return new Promise((resolve) => {
	  const { socket } = get();
	  if (!socket) return resolve(false);
	  socket.emit('login', name, pin, (response: any) => {
		if (response.success) {
		  const user = response.user;
		  set({ playerId: user.id, playerName: user.username, pinCode: user.pinCode, error: null });
		  sessionStorage.setItem('timebomb_session', JSON.stringify({
			id: user.id,
			username: user.username,
			pinCode: user.pinCode
		  }));
		  resolve(true);
		} else {
		  set({ error: response.error });
		  resolve(false);
		}
	  });
	});
  },

  logout: () => {
	sessionStorage.removeItem('timebomb_session');
	set({ playerId: '', playerName: '', pinCode: '', gameState: null });
  },

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

	socket.on('openRoomsList', (rooms: RoomInfo[]) => set({openRooms: rooms}));
	socket.on('gameError', (msg: string) => set({error: msg}));
	socket.on('loupeResult', (result) => {
	  set({loupeAnimation: result, isScannerActive: false});
	  setTimeout(() => set({loupeAnimation: null}), 3000);
	});

	socket.on('achievementsUnlocked', (unlockedData) => {
	  const myId = get().playerId;
	  const myUnlocks = unlockedData.find((d: any) => d.playerId === myId);
	  if (myUnlocks) console.log("🏆 NOUVEAUX SUCCÈS : ", myUnlocks.unlockedAchievements);
	});

	socket.on('connect', () => {
	  const { playerId } = get();
	  if (playerId) socket.emit('checkReconnection', playerId);
	});

	set({socket});
  },

  // CORRECTION : Les arguments sont passés explicitement au socket
  createRoom: (name) => {
	const {socket, playerId, playerName} = get();
	if (socket) socket.emit('createRoom', name || playerName, playerId);
  },

  joinRoom: (roomId, name) => {
	const {socket, playerId, playerName} = get();
	if (socket) socket.emit('joinRoom', roomId, name || playerName, playerId);
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
	const {socket} = get();
	if (socket) socket.emit('toggleLoupeMode', roomId, enabled);
  },

  useLoupe: (roomId, targetPlayerId, cardId) => {
	const {socket} = get();
	if (socket) {
	  socket.emit('useLoupe', roomId, targetPlayerId, cardId);
	  set({isScannerActive: false});
	}
  },

  leaveRoom: (roomId) => {
	const {socket} = get();
	if (socket) socket.emit('leaveRoom', roomId);
	set({gameState: null, isScannerActive: false, isReviewingCards: false});
  },

  confirmRole: (roomId) => {
	const {socket} = get();
	if (socket) socket.emit('confirmRole', roomId);
  },

  confirmCards: (roomId) => {
	const {socket} = get();
	if (socket) socket.emit('confirmCards', roomId);
  },

  restartGame: (roomId) => {
	const {socket} = get();
	if (socket) socket.emit('restartGame', roomId);
  }
}));
