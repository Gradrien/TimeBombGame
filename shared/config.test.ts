import {describe, expect, it} from 'vitest';
import {
  CHAOS_PROBABILITIES,
  GAME_CONFIG,
  getLoupeSuccessChance,
  getRoleDistributionRange,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ValidPlayerCount,
} from './config';
import {getTeam, isOnTeam, shuffleArray} from './utils';

const PLAYER_COUNTS = Object.keys(GAME_CONFIG).map(Number) as ValidPlayerCount[];

describe('GAME_CONFIG', () => {
  it('couvre tous les nombres de joueurs de MIN_PLAYERS à MAX_PLAYERS', () => {
	for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count++) {
	  expect(PLAYER_COUNTS).toContain(count);
	}
  });

  it('produit toujours un paquet divisible par le nombre de joueurs', () => {
	PLAYER_COUNTS.forEach(count => {
	  const {safe, defuse, bomb} = GAME_CONFIG[count];
	  expect((safe + defuse + bomb) % count).toBe(0);
	});
  });

  it("propose au moins autant de cartes rôle que de joueurs", () => {
	PLAYER_COUNTS.forEach(count => {
	  expect(GAME_CONFIG[count].roles.length).toBeGreaterThanOrEqual(count);
	});
  });
});

describe('getRoleDistributionRange', () => {
  it('correspond à la table officielle du jeu', () => {
	expect(getRoleDistributionRange(4)).toEqual({sherlock: {min: 2, max: 3}, moriarty: {min: 1, max: 2}});
	expect(getRoleDistributionRange(5)).toEqual({sherlock: {min: 3, max: 3}, moriarty: {min: 2, max: 2}});
	expect(getRoleDistributionRange(7)).toEqual({sherlock: {min: 4, max: 5}, moriarty: {min: 2, max: 3}});
	expect(getRoleDistributionRange(12)).toEqual({sherlock: {min: 8, max: 8}, moriarty: {min: 4, max: 4}});
  });

  it('borne toujours une fourchette cohérente', () => {
	PLAYER_COUNTS.forEach(count => {
	  const {sherlock, moriarty} = getRoleDistributionRange(count);
	  expect(sherlock.min).toBeLessThanOrEqual(sherlock.max);
	  expect(moriarty.min).toBeLessThanOrEqual(moriarty.max);
	  // The combined extremes cover the table exactly.
	  expect(sherlock.min + moriarty.max).toBe(count);
	  expect(sherlock.max + moriarty.min).toBe(count);
	});
  });
});

describe('règles chiffrées', () => {
  it('les probabilités du Mode Chaos somment à 1', () => {
	const total = Object.values(CHAOS_PROBABILITIES).reduce((sum, p) => sum + p, 0);
	expect(total).toBeCloseTo(1);
  });

  it('le taux de réussite de la loupe décroît de 10 % par manche', () => {
	expect(getLoupeSuccessChance(1)).toBeCloseTo(1);
	expect(getLoupeSuccessChance(2)).toBeCloseTo(0.9);
	expect(getLoupeSuccessChance(3)).toBeCloseTo(0.8);
	expect(getLoupeSuccessChance(99)).toBe(0); // never negative
  });
});

describe('utils', () => {
  it('getTeam rattache le Brouilleur au camp Moriarty', () => {
	expect(getTeam('SHERLOCK')).toBe('SHERLOCK');
	expect(getTeam('MORIARTY')).toBe('MORIARTY');
	expect(getTeam('BROUILLEUR')).toBe('MORIARTY');
	expect(getTeam(undefined)).toBeUndefined();
  });

  it('isOnTeam compare rôle et camp', () => {
	expect(isOnTeam('BROUILLEUR', 'MORIARTY')).toBe(true);
	expect(isOnTeam('BROUILLEUR', 'SHERLOCK')).toBe(false);
	expect(isOnTeam(undefined, 'SHERLOCK')).toBe(false);
  });

  it('shuffleArray conserve les éléments sans muter la source', () => {
	const source = [1, 2, 3, 4, 5];
	const shuffled = shuffleArray(source);
	expect(shuffled).not.toBe(source);
	expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
	expect(source).toEqual([1, 2, 3, 4, 5]);
  });
});
