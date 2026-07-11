/**
 * Game configuration and numeric rules — single source of truth.
 *
 * The server enforces these values, the client displays them (wiki, lobby,
 * counters): the two can therefore never diverge.
 */

/** Minimum number of players to start a game. */
export const MIN_PLAYERS = 4;

/**
 * Maximum number of rounds: if the last one ends before every defuse is
 * found, Moriarty wins.
 */
export const MAX_ROUNDS = 4;

/** The Loupe extension (and its Brouilleur role) requires at least 5 players. */
export const LOUPE_MIN_PLAYERS = 5;

/** The Loupe is unusable during the last round. */
export const LOUPE_LAST_USABLE_ROUND = MAX_ROUNDS - 1;

/** Loupe success rate: 100% in round 1, then -10% per round. */
export function getLoupeSuccessChance(round: number): number {
  return Math.max(0, 1 - (round - 1) * 0.1);
}

/** Brouilleur passive power: chance that a Loupe used on them fails. */
export const BROUILLEUR_JAM_CHANCE = 0.9;

/** Turn durations offered in timer mode (seconds). */
export const TURN_DURATION_OPTIONS = [10, 15, 30, 60] as const;
export const DEFAULT_TURN_SECONDS = 15;

/**
 * Chaos-mode scenario probabilities (sum = 1).
 * Displayed as-is in the lobby wiki.
 */
export const CHAOS_PROBABILITIES = {
  /** The whole table is Moriarty. */
  ALL_MORIARTY: 0.2,
  /** The whole table is Sherlock. */
  ALL_SHERLOCK: 0.1,
  /** A single Sherlock among the Moriarty. */
  LONE_SHERLOCK: 0.1,
  /** Each player draws their camp independently (50/50). */
  RANDOM: 0.6,
} as const;

/**
 * Game composition per player count. As in the board game, there can be
 * more role cards than players: the exact split
 * of the camps is then uncertain (see `getRoleDistributionRange`).
 */
export const GAME_CONFIG = {
  4: {roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 15, defuse: 4, bomb: 1},
  5: {roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 19, defuse: 5, bomb: 1},
  6: {roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY'], safe: 23, defuse: 6, bomb: 1},
  7: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 27,
	defuse: 7,
	bomb: 1
  },
  8: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 31,
	defuse: 8,
	bomb: 1
  },
  9: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 35,
	defuse: 9,
	bomb: 1
  },
  10: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 39,
	defuse: 10,
	bomb: 1
  },
  11: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 43,
	defuse: 11,
	bomb: 1
  },
  12: {
	roles: ['SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'SHERLOCK', 'MORIARTY', 'MORIARTY', 'MORIARTY', 'MORIARTY'],
	safe: 47,
	defuse: 12,
	bomb: 1
  },
} as const;

export type ValidPlayerCount = keyof typeof GAME_CONFIG;

const playerCounts = Object.keys(GAME_CONFIG).map(Number);
export const MAX_PLAYERS = Math.max(...playerCounts);

export function isValidPlayerCount(count: number): count is ValidPlayerCount {
  return count in GAME_CONFIG;
}

export interface RoleRange {
  min: number;
  max: number;
}

/**
 * Possible role range per camp for a given player count. When there are
 * more role cards than players, the exact composition varies from one game
 * to the next (e.g. with 4 players: 2-3 Sherlock, 1-2 Moriarty).
 */
export function getRoleDistributionRange(count: ValidPlayerCount): { sherlock: RoleRange; moriarty: RoleRange } {
  const roles = GAME_CONFIG[count].roles;
  const extra = roles.length - count;
  const sherlockTotal = roles.filter(r => r === 'SHERLOCK').length;
  const moriartyTotal = roles.length - sherlockTotal;
  return {
	sherlock: {min: sherlockTotal - extra, max: Math.min(sherlockTotal, count)},
	moriarty: {min: moriartyTotal - extra, max: Math.min(moriartyTotal, count)},
  };
}
