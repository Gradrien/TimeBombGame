import  {GAME_CONFIG, Card, Role, Player, ValidPlayerCount } from '@timebomb/shared';
import {randomUUID} from 'crypto';

// Algorithme de mélange Fisher-Yates
export function shuffleArray<T>(array: readonly T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function assignRoles(players: Player[], useLoupe: boolean = false): void {
  const count = players.length as ValidPlayerCount;
  if (!GAME_CONFIG[count]) throw new Error("Le nombre de joueurs doit être entre 4 et 8");

  const rolePool = shuffleArray<Role>(GAME_CONFIG[count].roles);

  // Si la loupe est active (et 5+ joueurs), on remplace 1 Moriarty par 1 Brouilleur
  if (useLoupe && count >= 5) {
	const moriartyIndex = rolePool.indexOf('MORIARTY');
	if (moriartyIndex !== -1) {
	  rolePool[moriartyIndex] = 'BROUILLEUR';
	}
  }

  players.forEach((player, index) => {
	player.role = rolePool[index];
  });
}

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

  for (let i = 0; i < safeCount; i++) deck.push({id: randomUUID(), type: 'SAFE', isRevealed: false});
  for (let i = 0; i < config.defuse; i++) deck.push({id: randomUUID(), type: 'DEFUSE', isRevealed: false});
  deck.push({id: randomUUID(), type: 'BOMB', isRevealed: false});
  for (let i = 0; i < loupeCount; i++) deck.push({id: randomUUID(), type: 'LOUPE', isRevealed: false});

  return shuffleArray(deck);
}

export function distributeCards(deck: Card[], players: Player[]): void {
  const cardsPerPlayer = deck.length / players.length;

  players.forEach((player, index) => {
	const startIndex = index * cardsPerPlayer;
	player.cards = deck.slice(startIndex, startIndex + cardsPerPlayer);
  });
}

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
