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

  /** Texture pack the player plays with (see shared/skins.ts). */
  activeSkin: string;
  /** Packs the player owns — loaded with the profile, where skins are picked. */
  unlockedSkins: string[];

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
  /** Equips an owned pack; resolves false when already active or refused by the server. */
  setActiveSkin: (skinId: string) => Promise<boolean>;
  /** Redeems a secret pack's password; on success the pack is unlocked and equipped. */
  unlockSkin: (password: string) => Promise<{success: true; skinId: string} | {success: false; error: string}>;
  setUnlockedSkins: (skins: string[]) => void;
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
