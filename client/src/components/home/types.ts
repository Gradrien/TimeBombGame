/** Sub-views the home screen can display. */
export type HomeViewState = 'LOGIN' | 'MAIN' | 'JOIN' | 'PROFILE';

export interface LoginViewProps {
  onLoginSuccess: () => void;
  onError: (msg: string | null) => void;
}

export interface MainMenuViewProps {
  onNavigate: (view: 'JOIN' | 'PROFILE') => void;
}

export interface JoinRoomViewProps {
  onBack: () => void;
}
