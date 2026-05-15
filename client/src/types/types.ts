import {Card as CardType, Player, GameState} from '@timebomb/shared';
import {Socket} from 'socket.io-client';

export interface CardProps {
  card: CardType;
  isInteractable: boolean;
  forceFaceUp?: boolean;
  onAction: (cardId: string) => void;
}

export interface CardRevealProps {
  cards: string[];
  flippedIndices: number[];
  isShuffling: boolean;
}

export interface GamePlayAreaProps {
  viewedPlayer: Player;
  isViewingOpponent: boolean;
  iHaveClippers: boolean;
  playerWithClippers: string;
  handleCutCard: (cardId: string) => void;
  players: Player[];
}

export interface GameStatsBarProps {
  currentRound: number;
  totalPlayers: number;
  defusesFound: number;
  defusesNeeded: number;
  revealedCards: CardType[];
}

export interface RoleRevealProps {
  role: string;
  revealed: boolean;
  isReady: boolean;
  isConfirming: boolean;
  onReveal: () => void;
}

export interface TopNavBarProps {
  me: Player;
  opponents: Player[];
  viewedPlayerId: string | null;
  setViewedPlayerId: (id: string | null) => void;
  playerWithClippers: string;
  iHaveClippers: boolean;
}

export interface RoomInfo {
  roomId: string;
  playerCount: number;
}

export interface GameStoreProps {
  socket: Socket | null;
  gameState: GameState | null;

  playerName: string;
  playerId: string;
  pinCode: string;

  isAnimatingCut: boolean;
  openRooms: RoomInfo[];
  error: string | null;

  loupeAnimation: { success: boolean, targetName: string } | null;
  isScannerActive: boolean;
  setScannerActive: (active: boolean) => void;
  toggleLoupeMode: (roomId: string, enabled: boolean) => void;
  useLoupe: (roomId: string, targetPlayerId: string, cardId: string) => void;

  setPlayerName: (name: string) => void;
  setPinCode: (pin: string) => void;

  clearError: () => void;
  initSocket: () => void;

  login: (name: string, pin: string) => Promise<boolean>;
  logout: () => void;

  createRoom: (name: string) => void;
  joinRoom: (roomId: string, name: string) => void;
  fetchOpenRooms: () => void;
  startGame: (roomId: string) => void;
  cutCard: (roomId: string, targetPlayerId: string, cardId: string) => void;

  leaveRoom: (roomId: string) => void;
  isReviewingCards: boolean;
  setReviewingCards: (val: boolean) => void;

  confirmRole: (roomId: string) => void;
  confirmCards: (roomId: string) => void;
  restartGame: (roomId: string) => void;
}
