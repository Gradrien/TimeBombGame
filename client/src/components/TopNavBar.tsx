import Image from 'next/image';
import { ASSETS } from '@/utils/assets';
import type { TopNavBarProps } from '@/types/types';

export function TopNavBar({
							me,
							opponents,
							viewedPlayerId,
							setViewedPlayerId,
							playerWithClippers,
						  }: TopNavBarProps) {
  const isViewingOpponent = viewedPlayerId !== null && viewedPlayerId !== me.id;

  const playerButtonBase = `
      min-w-0 rounded-md border font-serif tracking-widest
      transition-all shadow-sm
      flex items-center justify-center gap-2
      px-3 py-2 text-xs
      sm:px-4 sm:text-sm
      landscape:px-5 landscape:text-base
    `;

  const activeClasses =
	  'bg-zinc-100 border-zinc-100 text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]';

  const inactiveClasses =
	  'bg-black/40 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100';

  return (
	  <div
		  className="
        shrink-0 border-b border-zinc-700 bg-zinc-900/80 shadow-lg
        px-3 py-2 w-full
        landscape:px-4
      "
	  >
		<div
			className="
          flex flex-wrap items-center gap-2 w-full
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
					  src={ASSETS.CLIPPER}
					  alt="Pince"
					  fill
					  className="object-contain drop-shadow-md"
				  />
				</div>
			)}
		  </button>

		  <div
			  className="
            hidden h-6 w-px shrink-0 rounded-full bg-zinc-600
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
						  ? 'bg-zinc-300 border-zinc-300 text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]'
						  : inactiveClasses
				  }
            `}
			  >
				<span className="min-w-0 truncate">{opp.name}</span>

				{playerWithClippers === opp.id && (
					<div className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5">
					  <Image
						  src={ASSETS.CLIPPER}
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
