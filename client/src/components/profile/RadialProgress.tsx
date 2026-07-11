import {motion} from 'framer-motion';
import type {RadialProgressProps} from './types';

/** SVG progress ring (global win rate). */
export function RadialProgress({value, color}: RadialProgressProps) {
  const size = 120;
  const stroke = 9;
  const pad = 8; // inner margin so the glow is not clipped by the SVG edge
  const r = (size - stroke) / 2 - pad;
  const c = 2 * Math.PI * r;

  return (
      <div className="relative shrink-0" style={{width: size, height: size}}>
        <svg width={size} height={size} className="-rotate-90 overflow-visible">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={stroke}/>
          <motion.circle
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={c}
              initial={{strokeDashoffset: c}}
              animate={{strokeDashoffset: c * (1 - value / 100)}}
              transition={{duration: 1, ease: 'easeOut'}}
              style={{filter: `drop-shadow(0 0 6px ${color}88)`}}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none drop-shadow" style={{color}}>{value}%</span>
          <span className="mt-1 text-[9px] uppercase tracking-widest text-white/45 font-bold">Victoire</span>
        </div>
      </div>
  );
}
