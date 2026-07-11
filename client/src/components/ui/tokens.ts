/**
 * Design tokens needed as JS values (framer-motion glows, SVG strokes,
 * dynamic inline styles). Class-based styling must use the Tailwind theme
 * colors declared in `src/app/globals.css` — keep both files in sync.
 */

export const COLORS = {
  gold: '#c9a56d',
  goldBright: '#ffd479',
  brass: '#b08a57',
  bronze: '#8a6842',
  cream: '#f3e7d3',
  ink: '#1a1510',
  inkDeep: '#0b0a08',
  sherlock: '#60a5fa',
  sherlockDeep: '#1d4463',
  moriarty: '#ef4444',
  moriartyDeep: '#7f1d1d',
  success: '#4ade80',
  danger: '#ef4444',
} as const;

/** Per-team accent set used by the end screen and role-themed surfaces. */
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
