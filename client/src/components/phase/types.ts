import type {CardType, Role} from '@timebomb/shared';

export interface RoleRevealProps {
  role: Role;
  revealed: boolean;
  /** True once the player confirmed and is waiting for the others. */
  isConfirming: boolean;
  onReveal: () => void;
  skinIndex?: number;
  onConfirm: () => void;
}

/** Display copy and accent color for each role card. */
export interface RoleInfo {
  name: string;
  team: string;
  desc: string;
  color: string;
}

export interface CardRevealProps {
  cards: CardType[];
  flippedIndices: number[];
  isShuffling: boolean;
}
