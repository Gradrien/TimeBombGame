import type {ReactNode} from 'react';
import type {GameState} from '@timebomb/shared';

export interface LobbyViewProps {
  gameState: GameState;
  onStart: () => void;
}

export interface ModeRowProps {
  label: string;
  /** Info button or icon rendered next to the label. */
  action?: ReactNode;
  isHost: boolean;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
  children?: ReactNode;
}

export interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export interface ModeStatusBadgeProps {
  enabled: boolean;
}
