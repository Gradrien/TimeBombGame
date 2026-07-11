import {PlayerResultCard} from './PlayerResultCard';
import type {TeamRowProps} from './types';

export function TeamRow({
                          label, accent, glow, players, isWinning, playerId, restartReady, getSkinIndex,
                        }: TeamRowProps) {
  if (players.length === 0) return null;

  return (
      <section className="flex flex-col items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-px w-6 sm:w-10" style={{background: `linear-gradient(to right, transparent, ${accent})`}}/>
          <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-[0.3em]" style={{color: accent}}>
            {label}
          </h2>
          <span className="h-px w-6 sm:w-10" style={{background: `linear-gradient(to left, transparent, ${accent})`}}/>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5 landscape:gap-3">
          {players.map((p, i) => (
              <PlayerResultCard
                  key={p.id}
                  player={p}
                  index={i}
                  glow={glow}
                  isWinning={isWinning}
                  isMe={p.id === playerId}
                  inMenus={restartReady.includes(p.id)}
                  skinIndex={getSkinIndex(p.id)}
              />
          ))}
        </div>
      </section>
  );
}
