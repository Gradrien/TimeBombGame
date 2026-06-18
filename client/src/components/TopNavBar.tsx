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
      min-w-0 rounded-lg border font-serif uppercase tracking-widest font-bold
      transition-all shadow-sm
      flex items-center justify-center gap-2
      px-3 py-2 text-xs
      sm:px-4 sm:text-sm
      landscape:px-5 landscape:text-base
    `;

  const activeClasses =
	  'bg-gradient-to-b from-[#c9a56d] to-[#b08a57] border-[#f3e7d3] text-[#1a1510] shadow-[0_0_12px_rgba(201,165,109,0.45)]';

  const inactiveClasses =
	  'bg-black/40 border-[#8a6842]/60 text-[#c9a56d] hover:border-[#c9a56d] hover:text-[#f3e7d3] hover:bg-black/55';

  return (
	  <div
		  className="
        relative shrink-0 border-b border-[#c9a56d]/25 bg-[#1a1510]/70 backdrop-blur-md shadow-lg
        px-3 py-2 w-full
        landscape:px-4
      "
	  >
		<div className="pointer-events-none absolute inset-0 opacity-[0.06]"
			 style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)"}}/>
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
            hidden h-6 w-px shrink-0 rounded-full bg-[#c9a56d]/40
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
