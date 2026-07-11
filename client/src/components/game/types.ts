import type {Card as CardModel, Player} from '@timebomb/shared';

export interface TopNavBarProps {
  me: Player;
  opponents: Player[];
  viewedPlayerId: string | null;
  setViewedPlayerId: (id: string | null) => void;
  playerWithClippers: string;
}

export interface GameStatsBarProps {
  currentRound: number;
  totalPlayers: number;
  defusesFound: number;
  defusesNeeded: number;
  revealedCards: CardModel[];
}

export interface GamePlayAreaProps {
  viewedPlayer: Player;
  isViewingOpponent: boolean;
  iHaveClippers: boolean;
  playerWithClippers: string;
  handleCutCard: (cardId: string) => void;
  players: Player[];
}

export interface CardProps {
  card: CardModel;
  isInteractable: boolean;
  /** Show the face even if the card is not revealed (own-hand review). */
  forceFaceUp?: boolean;
  onAction: (cardId: string) => void;
}

export interface BombTimerProps {
  /** Server timestamp (ms) when the turn expires, or null when no timer runs. */
  endTime: number | null;
  isPaused?: boolean;
}
