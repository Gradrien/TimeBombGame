import type {StatFigureProps} from './types';

/** Plain header figure (no border): big number + small label. */
export function StatFigure({value, label, accent}: StatFigureProps) {
  return (
      <div className="flex min-w-14 flex-col items-center justify-center gap-1">
        <span className="text-2xl font-bold leading-none drop-shadow sm:text-3xl" style={{color: accent}}>{value}</span>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/45">
          {label}
        </span>
      </div>
  );
}
