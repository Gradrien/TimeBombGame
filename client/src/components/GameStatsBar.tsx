// client/src/components/GameStatsBar.tsx
import Image from 'next/image';
import { Card as CardType } from '@timebomb/shared';
import { getCardImage } from '@/utils/assets';

interface Props {
  currentRound: number;
  cardsRevealed: number;
  totalPlayers: number;
  defusesFound: number;
  defusesNeeded: number;
  revealedCards: CardType[];
}

export function GameStatsBar({ currentRound, cardsRevealed, totalPlayers, defusesFound, defusesNeeded, revealedCards }: Props) {
  return (
	  <div className="flex items-center justify-between px-6 py-2 bg-gradient-to-b from-black/40 to-transparent border-b border-amber-900/20 shrink-0 h-24">

		{/* HUD Stats */}
		<div className="flex flex-col gap-1">
		  <p className="text-[10px] sm:text-xs text-amber-600 uppercase tracking-widest font-black drop-shadow-md">
			MANCHE {currentRound} <span className="text-amber-900/50 mx-1">|</span> COUPES: {cardsRevealed}/{totalPlayers}
		  </p>
		  <p className="text-sm sm:text-base font-black text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] tracking-widest">
			DÉSARMÉS: {defusesFound}/{defusesNeeded}
		  </p>
		</div>

		{/* Défausse (Cartes superposées) */}
		<div className="flex overflow-x-auto pl-2 pr-4 max-w-[50%] py-2 items-center no-scrollbar">
		  {revealedCards.map((card, i) => (
			  <div
				  key={i}
				  className="relative w-12 h-16 shrink-0 animate-in fade-in slide-in-from-right-2 drop-shadow-xl -ml-6 first:ml-0 hover:-translate-y-2 transition-transform cursor-default"
				  style={{ zIndex: i }}
			  >
				<Image src={getCardImage(card.type)} alt={card.type} fill className="object-contain" />
			  </div>
		  ))}
		</div>
	  </div>
  );
}
