import {GameState} from '@timebomb/shared';

export type ViewState = 'LOGIN' | 'MAIN' | 'JOIN' | 'PROFILE';

export interface JoinRoomViewProps {
  onBack: () => void;
}

export interface LobbyViewProps {
  gameState: GameState;
  playerName: string;
  onStart: () => void;
}

export interface LoginViewProps {
  onLoginSuccess: () => void;
  onError: (msg: string | null) => void;
}

export interface MainMenuViewProps {
  onNavigate: (view: 'JOIN' | 'PROFILE') => void;
}
