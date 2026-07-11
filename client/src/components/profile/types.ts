import type {ReactNode} from 'react';
import type {FormattedAchievement} from '@timebomb/shared';

export interface ProfileViewProps {
  onBack: () => void;
}

export interface IconActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

export interface StatFigureProps {
  value: string | number;
  label: string;
  accent: string;
}

export interface CampWinRateRowProps {
  label: string;
  rate: number;
  wins: number;
  games: number;
  color: string;
}

export interface RadialProgressProps {
  value: number;
  color: string;
}

export interface AchievementCardProps {
  ach: FormattedAchievement;
}

/** Rarity styling of an achievement tier (ring color, glow, French label). */
export interface TierStyle {
  ring: string;
  glow: string;
  label: string;
}
