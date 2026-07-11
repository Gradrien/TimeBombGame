import type {StripesProps} from './types';

const STRIPES_BACKGROUND =
    'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)';

/** Signature striped texture, laid as an overlay on themed surfaces. */
export function Stripes({className = 'opacity-[0.06]'}: StripesProps) {
  return (
      <div
          className={`pointer-events-none absolute inset-0 ${className}`}
          style={{backgroundImage: STRIPES_BACKGROUND}}
      />
  );
}
