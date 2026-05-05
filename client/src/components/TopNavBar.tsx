// client/src/components/TopNavBar.tsx
import { Player } from '@timebomb/shared';
import Image from 'next/image';
import { ASSETS } from '@/utils/assets';

interface TopNavBarProps {
  me: Player;
  opponents: Player[];
  viewedPlayerId: string | null;
  setViewedPlayerId: (id: string | null) => void;
  playerWithClippers: string;
  iHaveClippers: boolean;
}

export function TopNavBar({ me, opponents, viewedPlayerId, setViewedPlayerId, playerWithClippers, iHaveClippers }: TopNavBarProps) {
  const isViewingOpponent = viewedPlayerId !== null && viewedPlayerId !== me.id;

  return (
	  <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 border-b border-zinc-700 overflow-x-auto no-scrollbar whitespace-nowrap h-16 sm:h-20 shrink-0 shadow-lg">
		<button
			onClick={() => setViewedPlayerId(null)}
			className={`px-5 py-2 rounded-md font-serif tracking-widest transition-all border shadow-sm text-sm sm:text-base flex items-center gap-2
          ${!isViewingOpponent ? 'bg-zinc-100 border-zinc-100 text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-black/40 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'}`}
		>
		  MOI
		  {playerWithClippers === me.id && (
			  <div className="relative w-5 h-5 ml-1">
				<Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain drop-shadow-md" />
			  </div>
		  )}
		</button>

		<div className="w-px h-6 bg-zinc-600 mx-1 rounded-full"></div>

		{opponents.map((opp) => (
			<button
				key={opp.id}
				onClick={() => setViewedPlayerId(opp.id)}
				className={`px-5 py-2 rounded-md font-serif tracking-widest transition-all border flex items-center gap-2 shadow-sm text-sm sm:text-base
            ${viewedPlayerId === opp.id ? 'bg-zinc-300 border-zinc-300 text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-black/40 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'}
            ${iHaveClippers && viewedPlayerId !== opp.id ? 'animate-pulse border-zinc-400 text-zinc-100' : ''} 
          `}
			>
			  {opp.name}
			  {playerWithClippers === opp.id && (
				  <div className="relative w-5 h-5 ml-1">
					<Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain drop-shadow-md" />
				  </div>
			  )}
			</button>
		))}
	  </div>
  );
}
