import {motion} from 'framer-motion';
import {Stripes} from './Stripes';
import type {PanelProps} from './types';

/** Base themed surface — a single visual layer, never nested in another Panel. */
export function Panel({children, className = '', as = 'div', motionProps}: PanelProps) {
  const Comp = as === 'section' ? motion.section : motion.div;
  return (
      <Comp
          {...motionProps}
          className={`relative overflow-hidden rounded-2xl border border-gold/25 bg-ink/55 p-5 shadow-2xl backdrop-blur-md sm:p-6 ${className}`}
      >
        <Stripes/>
        <div className="relative z-10">{children}</div>
      </Comp>
  );
}
