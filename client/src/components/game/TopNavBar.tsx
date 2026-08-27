import Image from 'next/image';
import {ASSETS} from '@/utils/assets';
import {useSkinAsset} from '@/skins';
import {Stripes} from '@/components/ui';
import type {TopNavBarProps} from './types';

export function TopNavBar({
                            me,
                            opponents,
                            viewedPlayerId,
                            setViewedPlayerId,
                            playerWithClippers,
                          }: TopNavBarProps) {
  const isViewingOpponent = viewedPlayerId !== null && viewedPlayerId !== me.id;
  const skinned = useSkinAsset();

  const playerButtonBase = `
      min-w-0 rounded-lg border font-serif uppercase tracking-widest font-bold
      transition-all shadow-sm
      flex items-center justify-center gap-2
      px-3 py-2 text-xs
      sm:px-4 sm:text-sm
      landscape:px-5 landscape:text-base
    `;

  const activeClasses =
      'bg-gradient-to-b from-gold to-brass border-cream text-ink shadow-[0_0_12px_rgba(201,165,109,0.45)]';

  const inactiveClasses =
      'bg-black/40 border-bronze/60 text-gold hover:border-gold hover:text-cream hover:bg-black/55';

  return (
      <div
          className="
        relative shrink-0 border-b border-gold/25 bg-ink/70 backdrop-blur-md shadow-lg
        px-3 py-2 w-full
        landscape:px-4
      "
      >
        <Stripes/>
        <div
            className="
          relative z-10 flex flex-wrap items-center gap-2 w-full
          max-h-34 overflow-y-auto overflow-x-hidden no-scrollbar
          landscape:max-h-none landscape:flex-nowrap landscape:overflow-x-auto landscape:overflow-y-hidden landscape:gap-3
        "
        >
          <button
              onClick={() => setViewedPlayerId(null)}
              className={`
            ${playerButtonBase}
            flex-[1_1_calc(50%-0.5rem)]
            sm:flex-[0_1_auto]
            landscape:flex-none
            ${!isViewingOpponent ? activeClasses : inactiveClasses}
          `}
          >
            <span className="truncate">MOI</span>

            {playerWithClippers === me.id && (
                <div className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5">
                  <Image
                      src={skinned(ASSETS.CLIPPER)}
                      alt="Pince"
                      fill
                      className="object-contain drop-shadow-md"
                  />
                </div>
            )}
          </button>

          <div
              className="
            hidden h-6 w-px shrink-0 rounded-full bg-gold/40
            landscape:block
          "
          />

          {opponents.map((opp) => (
              <button
                  key={opp.id}
                  onClick={() => setViewedPlayerId(opp.id)}
                  className={`
              ${playerButtonBase}
              flex-[1_1_calc(50%-0.5rem)]
              sm:flex-[0_1_auto]
              landscape:flex-none
              ${
                      viewedPlayerId === opp.id
                          ? activeClasses
                          : inactiveClasses
                  }
            `}
              >
                <span className="min-w-0 truncate">{opp.name}</span>

                {playerWithClippers === opp.id && (
                    <div className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5">
                      <Image
                          src={skinned(ASSETS.CLIPPER)}
                          alt="Pince"
                          fill
                          className="object-contain drop-shadow-md"
                      />
                    </div>
                )}
              </button>
          ))}
        </div>
      </div>
  );
}
