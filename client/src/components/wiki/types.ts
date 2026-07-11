import type {ReactNode} from 'react';

/** Props shared by every wiki modal (Loupe, Chaos, Rules…). */
export interface WikiModalControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface WikiModalProps extends WikiModalControlProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export type ChaosTeam = 'blue' | 'red';

/** One possible Chaos-mode role distribution with its display styling. */
export interface ChaosOutcome {
  pct: number;
  accent: string;
  glow: string;
  title: string;
  desc: string;
  mix: ChaosTeam[];
}

export interface ChaosOutcomeRowProps {
  outcome: ChaosOutcome;
  index: number;
}

export interface ChaosRoleChipProps {
  team: ChaosTeam;
}
