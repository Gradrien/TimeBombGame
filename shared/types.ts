// Les équipes
export type Role = 'SHERLOCK' | 'MORIARTY';

// Les types de cartes
export type CardType = 'SAFE' | 'DEFUSE' | 'BOMB';

export interface Card {
  id: string; // Un identifiant unique généré par le serveur
  type: CardType;
  isRevealed: boolean;
}

export interface Player {
  id: string; // Socket ID
  name: string;
  role?: Role; // Caché aux autres joueurs
  cards: Card[]; // Le serveur n'envoie que les id et isRevealed aux autres
  isHost: boolean;
  secretCards?: CardType[];
}

export type GamePhase = 'LOBBY' | 'ROLE_REVEAL' | 'CARD_REVEAL' | 'PLAYING' | 'FINISHED';

export interface GameState {
  roomId: string;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED'; // État global
  phase: GamePhase; // Phase précise du tour
  players: Player[];
  readyPlayers: string[]; // Liste des IDs ayant validé la phase actuelle
  revealedCards: Card[]; // Cartes coupées au centre du plateau
  currentRound: number;
  cardsRevealedThisRound: number;
  totalDefusesFound: number;
  totalDefusesNeeded: number;
  playerWithClippers: string;
  winner?: 'SHERLOCK' | 'MORIARTY';
}
