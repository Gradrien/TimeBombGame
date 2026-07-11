import type {TierStyle} from './types';

/** Rarity color of an achievement based on its tier (3 = gold, 2 = silver, else bronze). */
export function tierStyle(tier?: number): TierStyle {
  if (tier === 3) return {ring: '#ffd479', glow: 'rgba(255,212,121,0.55)', label: 'Or'};
  if (tier === 2) return {ring: '#d8d8e0', glow: 'rgba(216,216,224,0.45)', label: 'Argent'};
  return {ring: '#c9854a', glow: 'rgba(201,133,74,0.45)', label: 'Bronze'};
}
