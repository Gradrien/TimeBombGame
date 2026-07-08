import type { Role } from './types';

export function shuffleArray<T>(array: readonly T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Winning-team identifier: every role belongs to one of the two camps.
 * Kept separate from `Role` because `BROUILLEUR` is a variant that plays on
 * Moriarty's side rather than a third team.
 */
export type Team = 'SHERLOCK' | 'MORIARTY';

/**
 * Maps a player role to the team it wins/loses with.
 *
 * The `BROUILLEUR` (loupe mode) works for Moriarty — it replaces a Moriarty at
 * role assignment — so it belongs to the `MORIARTY` (red) camp. Centralising
 * this here (single source of truth, DRY) prevents team checks from forgetting
 * the Brouilleur, e.g. showing it on the losing side when Moriarty wins.
 */
export function getRoleTeam(role?: Role): Team {
  return role === 'MORIARTY' || role === 'BROUILLEUR' ? 'MORIARTY' : 'SHERLOCK';
}

