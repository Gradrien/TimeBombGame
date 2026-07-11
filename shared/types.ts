/**
 * Domain types shared between the client and the server.
 * Game configuration constants live in `config.ts`, the socket event
 * contract in `socketEvents.ts`.
 */

export type Role = 'SHERLOCK' | 'MORIARTY' | 'BROUILLEUR';

/** The two camps of the game. The winner is always one of them. */
export type Team = 'SHERLOCK' | 'MORIARTY';

export type CardType = 'SAFE' | 'DEFUSE' | 'BOMB' | 'LOUPE';
export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';
export type GamePhase = 'NOT_STARTED' | 'ROLE_REVEAL' | 'CARD_REVEAL' | 'PLAYING';

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

/** Stats of an ongoing game, filled in cut by cut. */
export interface GameSessionStats {
  firstCutBy: string | null;
  isFirstCutBomb: boolean;
  /** Finishing a round with no defuse and no bomb cut. */
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
  /**
   * Ids of players who, on the end screen, have clicked "Rejouer" and gone back
   * to the menus. The room only returns to the lobby once everyone present has.
   */
  restartReady?: string[];
  revealedCards: Card[];
  currentRound: number;
  cardsRevealedThisRound: number;
  totalDefusesFound: number;
  totalDefusesNeeded: number;
  playerWithClippers: string;
  winner?: Team;
  isLoupeModeEnabled?: boolean;
  teamHasLoupe?: boolean;
  stats?: GameSessionStats;
  surrenderVotes?: string[];
  isTimerModeEnabled?: boolean;
  timerDuration?: number;
  turnEndTime?: number;
  isChaosModeEnabled?: boolean;
}
