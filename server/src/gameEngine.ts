// server/src/gameEngine.ts

import type { Card, Role, Player } from '@timebomb/shared';
import { randomUUID } from 'crypto';

// Algorithme de mélange Fisher-Yates (optimisé et impartial)
export function shuffleArray<T>(array: readonly T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 1. Définition de la configuration selon les règles
const GAME_CONFIG = {
  4: { roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 15, defuse: 4, bomb: 1 },
  5: { roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 19, defuse: 5, bomb: 1 },
  6: { roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 23, defuse: 6, bomb: 1 },
  7: { roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY'], safe: 27, defuse: 7, bomb: 1 },
  8: { roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY'], safe: 31, defuse: 8, bomb: 1 },
} as const;

type ValidPlayerCount = keyof typeof GAME_CONFIG;

// 2. Assignation des rôles
export function assignRoles(players: Player[]): void {
  const count = players.length as ValidPlayerCount;
  if (!GAME_CONFIG[count]) throw new Error("Le nombre de joueurs doit être entre 4 et 8");

  // On récupère le pool de rôles et on le mélange
  const rolePool = shuffleArray(GAME_CONFIG[count].roles);

  // On distribue un rôle à chaque joueur (le rôle surnuméraire à 4 ou 7 joueurs sera naturellement ignoré)
  players.forEach((player, index) => {
	player.role = rolePool[index] as Role;
  });
}

// 3. Création du Deck Initial
export function generateInitialDeck(playerCount: ValidPlayerCount): Card[] {
  const config = GAME_CONFIG[playerCount];
  const deck: Card[] = [];

  // Ajout des câbles sécurisés
  for (let i = 0; i < config.safe; i++) deck.push({ id: randomUUID(), type: 'SAFE', isRevealed: false });
  // Ajout des câbles de désamorçage
  for (let i = 0; i < config.defuse; i++) deck.push({ id: randomUUID(), type: 'DEFUSE', isRevealed: false });
  // Ajout de la bombe
  deck.push({ id: randomUUID(), type: 'BOMB', isRevealed: false });

  // On mélange le deck complet avant de le distribuer
  return shuffleArray(deck);
}

// 4. Distribution des cartes aux joueurs (utilisable à chaque début de manche)
export function distributeCards(deck: Card[], players: Player[]): void {
  // Le nombre de cartes par joueur dépend de la taille du deck restant
  const cardsPerPlayer = deck.length / players.length;

  players.forEach((player, index) => {
	const startIndex = index * cardsPerPlayer;
	// On coupe le deck en parts égales
	player.cards = deck.slice(startIndex, startIndex + cardsPerPlayer);
  });
}

// Fonction utilitaire pour remélanger les cartes non révélées à la fin d'une manche
export function gatherAndShuffleRemainingCards(players: Player[]): Card[] {
  const remainingCards: Card[] = [];

  players.forEach(player => {
	// On récupère les cartes non coupées
	const unrevealed = player.cards.filter(card => !card.isRevealed);
	remainingCards.push(...unrevealed);
	// On vide la main du joueur en attendant la redistribution
	player.cards = [];
  });

  return shuffleArray(remainingCards);
}
