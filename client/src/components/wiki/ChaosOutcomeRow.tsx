import {motion} from 'framer-motion';
import {ChaosRoleChip} from './ChaosRoleChip';
import type {ChaosOutcomeRowProps} from './types';

export function ChaosOutcomeRow({outcome, index}: ChaosOutcomeRowProps) {
  const gradient = `linear-gradient(90deg, ${outcome.accent}99, ${outcome.accent})`;
  return (
      <div className="rounded-xl border border-bronze/25 bg-black/30 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h5 className="text-sm font-bold text-cream">{outcome.title}</h5>
            <p className="text-xs text-white/50 leading-snug mt-0.5">{outcome.desc}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {outcome.mix.map((team, i) => <ChaosRoleChip key={i} team={team}/>)}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative h-2 flex-1 rounded-full bg-black/50 overflow-hidden ring-1 ring-white/5">
            <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{background: gradient, boxShadow: `0 0 8px ${outcome.glow}`}}
                initial={{width: 0}}
                animate={{width: `${outcome.pct}%`}}
                transition={{delay: 0.15 + index * 0.1, duration: 0.6, ease: 'easeOut'}}
            />
          </div>
          <span
              className="text-sm font-black tabular-nums w-10 text-right"
              style={{color: outcome.accent, textShadow: `0 0 10px ${outcome.glow}`}}
          >
            {outcome.pct}%
          </span>
        </div>
      </div>
  );
}
