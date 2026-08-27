/**
 * Shared Socket.IO contract: every event and its payload are typed once
 * here, then enforced on both sides:
 *
 *   - server: `new Server<ClientToServerEvents, ServerToClientEvents, …, SocketData>`
 *   - client: `Socket<ServerToClientEvents, ClientToServerEvents>`
 *
 * A payload drifting between emitter and receiver becomes a compile error
 * instead of a silent production bug.
 */

import type {GameState} from './types';
import type {AchievementDef} from './achievements';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/** A player's cumulative stats, as stored in the database. */
export interface UserStats {
  gamesPlayed: number;
  gamesAsSherlock: number;
  gamesAsMoriarty: number;
  gamesWon: number;
  winsSherlock: number;
  winsMoriarty: number;
  cablesCut: number;
  bombsExploded: number;
  loupesUsed: number;
  cardsJammed: number;
  consecutiveBombs: number;
}

/** A user as exposed to the client: never any secret (PIN hash). */
export interface PublicUser extends UserStats {
  id: string;
  username: string;
  /** Texture pack the player currently plays with (see shared/skins.ts). */
  activeSkin: string;
}

/** An achievement enriched with the player's progression, ready to display. */
export interface FormattedAchievement extends AchievementDef {
  isUnlocked: boolean;
  progress: number;
  percent: number;
  /** Achievement without a numeric target (unlocked or not, no progress bar). */
  isOneShot: boolean;
}

export interface UserProfile extends PublicUser {
  formattedAchievements: FormattedAchievement[];
  /** Ids of the texture packs this player owns (the default one included). */
  unlockedSkins: string[];
}

export interface RoomInfo {
  roomId: string;
  playerCount: number;
}

export interface LoupeResult {
  success: boolean;
  targetName: string;
}

/** Achievements a player unlocked at the end of a game. */
export interface PlayerUnlocks {
  playerId: string;
  unlockedAchievements: string[];
}

export type LoginResponse =
	| { success: true; user: PublicUser; token: string }
	| { success: false; error: string };

export type AuthenticateResponse =
	| { success: true; user: PublicUser }
	| { success: false };

export type UpdateUsernameResponse =
	| { success: true }
	| { success: false; error: string };

/** Unlocking a secret pack: the password is checked server-side only. */
export type UnlockSkinResponse =
	| { success: true; skinId: string; unlockedSkins: string[] }
	| { success: false; error: string };

export type SetActiveSkinResponse =
	| { success: true }
	| { success: false; error: string };

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface ClientToServerEvents {
  // --- Compte & session ---
  login: (username: string, pin: string, ack: (response: LoginResponse) => void) => void;
  /** Restores a socket's identity (and in-game seat) from the session token. */
  authenticate: (token: string, ack: (response: AuthenticateResponse) => void) => void;
  getUserProfile: (ack: (profile: UserProfile | null) => void) => void;
  updateUsername: (newName: string, ack: (response: UpdateUsernameResponse) => void) => void;

  // --- Apparence (texture packs) ---
  /** Redeems the password of a secret pack; unlocks it for good on success. */
  unlockSkin: (password: string, ack: (response: UnlockSkinResponse) => void) => void;
  setActiveSkin: (skinId: string, ack: (response: SetActiveSkinResponse) => void) => void;

  // --- Rooms ---
  getOpenRooms: () => void;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  kickPlayer: (roomId: string, targetPlayerId: string) => void;

  // --- Lobby settings (host only) ---
  toggleLoupeMode: (roomId: string, enabled: boolean) => void;
  toggleTimerMode: (roomId: string, enabled: boolean, duration: number) => void;
  toggleChaosMode: (roomId: string, enabled: boolean) => void;

  // --- Game flow ---
  startGame: (roomId: string) => void;
  confirmRole: (roomId: string) => void;
  confirmCards: (roomId: string) => void;
  cutCard: (roomId: string, targetPlayerId: string, cardId: string) => void;
  useLoupe: (roomId: string, targetPlayerId: string, cardId: string) => void;
  voteSurrender: (roomId: string) => void;
  restartGame: (roomId: string) => void;
}

export interface ServerToClientEvents {
  /** Game state, already filtered for this player (other hands masked). */
  gameStateUpdated: (state: GameState) => void;
  openRoomsList: (rooms: RoomInfo[]) => void;
  gameError: (message: string) => void;
  kicked: () => void;
  loupeResult: (result: LoupeResult) => void;
  achievementsUnlocked: (unlocks: PlayerUnlocks[]) => void;
  gameSurrendered: () => void;
}

/** Data attached to each socket server-side after authentication. */
export interface SocketData {
  userId?: string;
  username?: string;
}
