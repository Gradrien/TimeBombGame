export type Role = 'SHERLOCK' | 'MORIARTY' | 'BROUILLEUR';
export type CardType = 'SAFE' | 'DEFUSE' | 'BOMB' | 'LOUPE';
export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';
export type GamePhase = 'NOT_STARTED' | 'ROLE_REVEAL' | 'CARD_REVEAL' | 'PLAYING';
export type ValidPlayerCount = keyof typeof GAME_CONFIG;

export interface Card {
  id: string;
  type: CardType;
  isRevealed: boolean;
  isPublic?: boolean;
}

export interface Player {
  id: string;
  socketId?: string;
  name: string;
  role?: Role;
  cards: Card[];
  isHost: boolean;
  secretCards?: CardType[];
  /**
   * Live socket connection state. `false` means the player temporarily lost
   * their websocket (refresh, tab switch, network blip) and is within the
   * reconnection grace period — their seat is kept so the game can continue
   * without interruption. Defaults to connected when omitted.
   */
  connected?: boolean;
}

export interface GameSessionStats {
  firstCutBy: string | null;
  isFirstCutBomb: boolean;
  chouBlancAchieved: boolean;
  cutsMade: Record<string, number>;
  safeCablesCut: Record<string, number>;
  defusesFoundOn: Record<string, number>;
  loupesUsed: Record<string, number>;
  loupesJammed: Record<string, number>;
  bombCutter: string | null;
  lastCutBy: string | null;
  lastCutRound: number;
  lastCutIndex: number;
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  phase: GamePhase;
  players: Player[];
  readyPlayers: string[];
  revealedCards: Card[];
  currentRound: number;
  cardsRevealedThisRound: number;
  totalDefusesFound: number;
  totalDefusesNeeded: number;
  playerWithClippers: string;
  winner?: 'SHERLOCK' | 'MORIARTY';
  isLoupeModeEnabled?: boolean;
  teamHasLoupe?: boolean;
  stats?: GameSessionStats;
  surrenderVotes?: string[];
  isTimerModeEnabled?: boolean;
  timerDuration?: number;
  turnEndTime?: number;
  isChaosModeEnabled?: boolean;
}

export const GAME_CONFIG = {
  4: {roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 15, defuse: 4, bomb: 1},
  5: {roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 19, defuse: 5, bomb: 1},
  6: {roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 23, defuse: 6, bomb: 1},
  7: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 27,
	defuse: 7,
	bomb: 1
  },
  8: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 31,
	defuse: 8,
	bomb: 1
  },
  9: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 35,
	defuse: 9,
	bomb: 1
  },
  10: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 39,
	defuse: 10,
	bomb: 1
  },
  11: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 43,
	defuse: 11,
	bomb: 1
  },
  12: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 47,
	defuse: 12,
	bomb: 1
  },
} as const;

const playerCounts = Object.keys(GAME_CONFIG).map(Number);
export const MAX_PLAYERS = Math.max(...playerCounts);
