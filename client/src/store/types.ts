import type {Socket} from 'socket.io-client';
import type {
  ClientToServerEvents,
  GameState,
  LoupeResult,
  RoomInfo,
  ServerToClientEvents,
} from '@timebomb/shared';

/** Client socket typed by the shared contract (shared/socketEvents.ts). */
export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface GameStoreState {
  socket: GameSocket | null;
  gameState: GameState | null;

  playerName: string;
  playerId: string;
  /** PIN being typed in the login form — never persisted. */
  pinCode: string;

  isAnimatingCut: boolean;
  openRooms: RoomInfo[];
  error: string | null;

  loupeAnimation: LoupeResult | null;
  isScannerActive: boolean;
  isReviewingCards: boolean;
  isReviewingRole: boolean;
}

export interface GameStoreActions {
  initSocket: () => void;
  login: (name: string, pin: string) => Promise<boolean>;
  logout: () => void;

  setPlayerName: (name: string) => void;
  setPinCode: (pin: string) => void;
  clearError: () => void;

  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  fetchOpenRooms: () => void;
  leaveRoom: (roomId: string) => void;
  kickPlayer: (roomId: string, targetPlayerId: string) => void;

  toggleLoupeMode: (roomId: string, enabled: boolean) => void;
  toggleTimerMode: (roomId: string, enabled: boolean, duration: number) => void;
  toggleChaosMode: (roomId: string, enabled: boolean) => void;

  startGame: (roomId: string) => void;
  confirmRole: (roomId: string) => void;
  confirmCards: (roomId: string) => void;
  cutCard: (roomId: string, targetPlayerId: string, cardId: string) => void;
  /** Triggers the loupe ('useLoupe' server event — renamed here so it does not look like a React hook). */
  activateLoupe: (roomId: string, targetPlayerId: string, cardId: string) => void;
  voteSurrender: (roomId: string) => void;
  restartGame: (roomId: string) => void;

  setScannerActive: (active: boolean) => void;
  setReviewingCards: (val: boolean) => void;
  setReviewingRole: (val: boolean) => void;
}

export type GameStore = GameStoreState & GameStoreActions;
