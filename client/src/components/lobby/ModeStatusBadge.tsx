import type {ModeStatusBadgeProps} from './types';

/** Read-only mode state — non-host players' view. */
export function ModeStatusBadge({enabled}: ModeStatusBadgeProps) {
  return (
      <span
          className={`font-serif text-xs font-bold px-3 py-1.5 rounded-lg border shadow-inner tracking-wide uppercase ${enabled ? 'bg-sherlock-deep/80 border-sherlock/50 text-sherlock' : 'bg-black/40 border-bronze/60 text-brass'}`}>
        {enabled ? 'Activé' : 'Désactivé'}
      </span>
  );
}
