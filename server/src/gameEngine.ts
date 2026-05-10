// server/src/gameEngine.ts

import {Card, Role, Player, ValidPlayerCount, GAME_CONFIG} from '@timebomb/shared';
import {randomUUID} from 'crypto';

// Algorithme de mélange Fisher-Yates (optimisé et impartial)
export function shuffleArray<T>(array: readonly T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 1. Assignation des rôles
export function assignRoles(players: Player[], useLoupe: boolean = false): void {
  const count = players.length as ValidPlayerCount;
  if (!GAME_CONFIG[count]) throw new Error("Le nombre de joueurs doit être entre 4 et 8");

  // On récupère le pool de rôles et on le mélange
  const rolePool = shuffleArray(GAME_CONFIG[count].roles);

  // Si la loupe est active (et 5+ joueurs), on remplace 1 Moriarty par 1 Brouilleur
  if (useLoupe && count >= 5) {
	const moriartyIndex = rolePool.indexOf('MORIARTY');
	if (moriartyIndex !== -1) {
	  rolePool[moriartyIndex] = 'BROUILLEUR' as Role;
	}
  }

  // On distribue un rôle à chaque joueur (le rôle surnuméraire à 4 ou 7 joueurs sera naturellement ignoré)
  players.forEach((player, index) => {
	player.role = rolePool[index] as Role;
  });
}

// 2. Création du Deck Initial (Modifié pour la Loupe)
export function generateInitialDeck(playerCount: ValidPlayerCount, useLoupe: boolean = false): Card[] {
  const config = GAME_CONFIG[playerCount];
  const deck: Card[] = [];

  let safeCount = config.safe;
  let loupeCount = 0;

  // Règle de la Loupe : Remplace un câble Safe si activé et qu'il y a au moins 5 joueurs
  if (useLoupe && playerCount >= 5) {
	loupeCount = 1;
	safeCount -= 1;
  }

  // Ajout des câbles sécurisés
  for (let i = 0; i < safeCount; i++) deck.push({id: randomUUID(), type: 'SAFE', isRevealed: false});
  // Ajout des câbles de désamorçage
  for (let i = 0; i < config.defuse; i++) deck.push({id: randomUUID(), type: 'DEFUSE', isRevealed: false});
  // Ajout de la bombe
  deck.push({id: randomUUID(), type: 'BOMB', isRevealed: false});
  // Ajout de la Loupe (s'il y en a une)
  for (let i = 0; i < loupeCount; i++) deck.push({id: randomUUID(), type: 'LOUPE', isRevealed: false});

  // On mélange le deck complet avant de le distribuer
  return shuffleArray(deck);
}

// 3. Distribution des cartes aux joueurs (utilisable à chaque début de manche)
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
	const unrevealed = player.cards.filter(card => !card.isRevealed);

	unrevealed.forEach(card => {
	  card.isPublic = false;
	});

	remainingCards.push(...unrevealed);
	player.cards = [];
  });

  return shuffleArray(remainingCards);
}
