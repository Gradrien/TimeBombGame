import type {Card} from '@timebomb/shared';

/** Data captured when a card is cut, shown by the fullscreen cut overlay. */
export interface CutRevealData {
  card: Card;
  ownerName: string;
}

export interface CardCutAnimationProps {
  data: CutRevealData;
}

export interface LoupeResultAnimationProps {
  success: boolean;
  targetName: string;
}
