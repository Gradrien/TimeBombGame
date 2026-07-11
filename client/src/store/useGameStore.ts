import {create} from 'zustand';
import {io} from 'socket.io-client';
import type {GameSocket, GameStore} from './types';
import {clearSession, loadSession, saveSession} from '@/utils/session';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

/** Animation display durations, kept in sync with the server-side delays. */
const CUT_ANIMATION_MS = 2500;
const LOUPE_ANIMATION_MS = 3000;

const savedSession = loadSession();

/** Guard: the `visibilitychange` listener must only be installed once. */
let visibilityHandlerInstalled = false;

export const useGameStore = create<GameStore>((set, get) => {
  /** Runs `fn` if the socket is initialized (every action depends on it). */
  const withSocket = (fn: (socket: GameSocket) => void) => {
	const {socket} = get();
	if (socket) fn(socket);
  };

  return {
	socket: null,
	gameState: null,

	playerName: savedSession?.username || '',
	playerId: savedSession?.id || '',
	pinCode: '',

	isAnimatingCut: false,
	openRooms: [],
	error: null,
	loupeAnimation: null,
	isScannerActive: false,
	isReviewingCards: false,
	isReviewingRole: false,

	// ------------------------------------------------------------------
	// Socket & session
	// ------------------------------------------------------------------

	initSocket: () => {
	  if (get().socket) return;
	  const socket: GameSocket = io(SOCKET_URL);

	  socket.on('connect', () => {
		const session = loadSession();
		if (!session) return;
		// Identity is bound to the socket server-side: on every (re)connection we
		// present the session token, which also automatically reattaches the
		// player to their ongoing game.
		socket.emit('authenticate', session.token, (response) => {
		  if (response.success) {
			set({playerId: response.user.id, playerName: response.user.username});
		  } else {
			// Invalid token or deleted account: force a fresh login.
			clearSession();
			set({playerId: '', playerName: '', gameState: null});
		  }
		});
	  });

	  if (typeof window !== 'undefined' && !visibilityHandlerInstalled) {
		visibilityHandlerInstalled = true;
		document.addEventListener('visibilitychange', () => {
		  const currentSocket = get().socket;
		  if (document.visibilityState === 'visible' && currentSocket?.disconnected) {
			currentSocket.connect();
		  }
		});
	  }

	  socket.on('gameStateUpdated', (newState) => {
		const currentState = get().gameState;
		if (currentState && newState.revealedCards.length > currentState.revealedCards.length) {
		  set({isAnimatingCut: true});
		  setTimeout(() => set({isAnimatingCut: false}), CUT_ANIMATION_MS);
		}
		set({gameState: newState, error: null});
	  });

	  socket.on('openRoomsList', (rooms) => set({openRooms: rooms}));
	  socket.on('gameError', (msg) => set({error: msg}));

	  socket.on('kicked', () => {
		set({
		  gameState: null,
		  isScannerActive: false,
		  isReviewingCards: false,
		  error: "Vous avez été expulsé du lobby par l'hôte.",
		});
	  });

	  socket.on('loupeResult', (result) => {
		set({loupeAnimation: result, isScannerActive: false});
		setTimeout(() => set({loupeAnimation: null}), LOUPE_ANIMATION_MS);
	  });

	  socket.on('achievementsUnlocked', (unlocks) => {
		const myUnlocks = unlocks.find(u => u.playerId === get().playerId);
		if (myUnlocks) console.log('🏆 NOUVEAUX SUCCÈS : ', myUnlocks.unlockedAchievements);
	  });

	  set({socket});
	},

	login: (name, pin) => {
	  return new Promise((resolve) => {
		const {socket} = get();
		if (!socket) return resolve(false);
		socket.emit('login', name, pin, (response) => {
		  if (response.success) {
			// Never persist the PIN: only the signed token.
			saveSession({id: response.user.id, username: response.user.username, token: response.token});
			set({playerId: response.user.id, playerName: response.user.username, error: null});
			resolve(true);
		  } else {
			set({error: response.error});
			resolve(false);
		  }
		});
	  });
	},

	logout: () => {
	  clearSession();
	  set({playerId: '', playerName: '', pinCode: '', gameState: null});
	},

	setPlayerName: (name) => set({playerName: name}),
	setPinCode: (pin) => set({pinCode: pin}),
	clearError: () => set({error: null}),

	// ------------------------------------------------------------------
	// Rooms
	// ------------------------------------------------------------------

	createRoom: () => withSocket(s => s.emit('createRoom')),
	joinRoom: (roomId) => withSocket(s => s.emit('joinRoom', roomId)),
	fetchOpenRooms: () => withSocket(s => s.emit('getOpenRooms')),
	kickPlayer: (roomId, targetPlayerId) => withSocket(s => s.emit('kickPlayer', roomId, targetPlayerId)),

	leaveRoom: (roomId) => {
	  withSocket(s => s.emit('leaveRoom', roomId));
	  set({gameState: null, isScannerActive: false, isReviewingCards: false});
	},

	// ------------------------------------------------------------------
	// Lobby settings
	// ------------------------------------------------------------------

	toggleLoupeMode: (roomId, enabled) => withSocket(s => s.emit('toggleLoupeMode', roomId, enabled)),
	toggleTimerMode: (roomId, enabled, duration) => withSocket(s => s.emit('toggleTimerMode', roomId, enabled, duration)),
	toggleChaosMode: (roomId, enabled) => withSocket(s => s.emit('toggleChaosMode', roomId, enabled)),

	// ------------------------------------------------------------------
	// Game flow
	// ------------------------------------------------------------------

	startGame: (roomId) => withSocket(s => s.emit('startGame', roomId)),
	confirmRole: (roomId) => withSocket(s => s.emit('confirmRole', roomId)),
	confirmCards: (roomId) => withSocket(s => s.emit('confirmCards', roomId)),
	cutCard: (roomId, targetPlayerId, cardId) => withSocket(s => s.emit('cutCard', roomId, targetPlayerId, cardId)),
	voteSurrender: (roomId) => withSocket(s => s.emit('voteSurrender', roomId)),
	restartGame: (roomId) => withSocket(s => s.emit('restartGame', roomId)),

	activateLoupe: (roomId, targetPlayerId, cardId) => {
	  withSocket(s => s.emit('useLoupe', roomId, targetPlayerId, cardId));
	  set({isScannerActive: false});
	},

	// ------------------------------------------------------------------
	// Local UI state
	// ------------------------------------------------------------------

	setScannerActive: (active) => set({isScannerActive: active}),
	setReviewingCards: (val) => set({isReviewingCards: val}),
	setReviewingRole: (val) => set({isReviewingRole: val}),
  };
});
