import {motion} from 'framer-motion';
import type {CampWinRateRowProps} from './types';

/** Win-rate line for one camp: full-width animated bar, no box. */
export function CampWinRateRow({label, rate, wins, games, color}: CampWinRateRowProps) {
  return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold" style={{color}}>
            <span className="h-2.5 w-2.5 rounded-full"
                  style={{backgroundColor: color, boxShadow: `0 0 8px ${color}`}}/>
            {label}
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold leading-none" style={{color}}>{rate}%</span>
            <span className="text-[10px] font-bold text-white/40">{wins}/{games}</span>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-black/40 bg-black/40">
          <motion.div
              initial={{width: 0}}
              animate={{width: `${rate}%`}}
              transition={{duration: 0.8, ease: 'easeOut'}}
              className="h-full rounded-full"
              style={{backgroundColor: color, boxShadow: `0 0 10px ${color}66`}}
          />
        </div>
      </div>
  );
}
