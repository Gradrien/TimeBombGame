import type {Player} from '@timebomb/shared';

export interface TeamRowProps {
  label: string;
  accent: string;
  glow: string;
  players: Player[];
  isWinning: boolean;
  playerId: string;
  /** Ids of players who already clicked "Rejouer" and are back in the lobby. */
  restartReady: string[];
  getSkinIndex: (id: string) => number;
}

export interface PlayerResultCardProps {
  player: Player;
  index: number;
  glow: string;
  isWinning: boolean;
  isMe: boolean;
  /** True when this player already left for the lobby. */
  inMenus: boolean;
  skinIndex: number;
}
