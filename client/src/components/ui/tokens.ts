/**
 * ============================================================================
 *  TIME BOMB — DESIGN TOKENS
 * ----------------------------------------------------------------------------
 *  Single source of truth for the steampunk / Sherlock visual language.
 *  Import these instead of hard-coding hex values so every screen stays
 *  consistent. Tailwind arbitrary values read from `COLORS.*`.
 * ============================================================================
 */

/** Raw brand palette. */
export const COLORS = {
  /* Or / laiton — accents, titres, bordures */
  gold: '#c9a56d',
  goldBright: '#ffd479',
  brass: '#b08a57',
  bronze: '#8a6842',
  /* Parchemin — texte principal clair */
  cream: '#f3e7d3',
  /* Fonds sombres (panneaux en verre) */
  ink: '#1a1510',
  inkDeep: '#0b0a08',
  /* Équipe Sherlock (bleu) */
  sherlock: '#60a5fa',
  sherlockDeep: '#1d4463',
  /* Équipe Moriarty (rouge) */
  moriarty: '#ef4444',
  moriartyDeep: '#7f1d1d',
  /* Sémantiques */
  success: '#4ade80',
  danger: '#ef4444',
} as const;

/** Per-team theming, keyed by the winning side. */
export const TEAM = {
  SHERLOCK: {
    accent: COLORS.sherlock,
    deep: COLORS.sherlockDeep,
    glow: 'rgba(96,165,250,0.45)',
    label: 'SHERLOCK',
  },
  MORIARTY: {
    accent: COLORS.moriarty,
    deep: COLORS.moriartyDeep,
    glow: 'rgba(239,68,68,0.45)',
    label: 'MORIARTY',
  },
} as const;


/** Tiny className combiner (filters falsy values). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
