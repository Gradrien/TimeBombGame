import type {Role, Team} from './types';

/**
 * Returns the camp a role belongs to.
 * Le Brouilleur remplace un Moriarty : il appartient donc au camp Moriarty (rouge).
 */
export function getTeam(role: Role | undefined): Team | undefined {
  if (!role) return undefined;
  return role === 'SHERLOCK' ? 'SHERLOCK' : 'MORIARTY';
}

/** Whether a role belongs to the given camp. */
export function isOnTeam(role: Role | undefined, team: Team): boolean {
  return getTeam(role) === team;
}

/** Fisher-Yates shuffle that does not mutate the original array. */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
