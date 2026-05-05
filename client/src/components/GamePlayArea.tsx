// client/src/components/GamePlayArea.tsx
import { Player } from '@timebomb/shared';
import { Card } from './Card';
import Image from 'next/image';
import { ASSETS } from '@/utils/assets';

interface Props {
  viewedPlayer: Player;
  isViewingOpponent: boolean;
  iHaveClippers: boolean;
  playerWithClippers: string;
  handleCutCard: (cardId: string) => void;
}

export function GamePlayArea({ viewedPlayer, isViewingOpponent, iHaveClippers, playerWithClippers, handleCutCard }: Props) {
  return (
	  <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
		<div className="flex items-center justify-center gap-4 sm:gap-8 w-full max-w-5xl">

		  {/* Cartes du joueur */}
		  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
			{viewedPlayer.cards.map((card) => (
				<Card key={card.id} card={card} isInteractable={iHaveClippers && isViewingOpponent} onCut={handleCutCard} />
			))}
			{viewedPlayer.cards.length === 0 && (
				<div className="w-16 h-24 sm:w-24 sm:h-36 border border-amber-900/30 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-amber-900/50 font-medium">Vide</div>
			)}
		  </div>

		  {/* Pince du joueur (si possédée) */}
		  {playerWithClippers === viewedPlayer.id && (
			  <div className="flex items-center justify-center shrink-0 border-l border-amber-900/30 pl-4 sm:pl-8 ml-2 sm:ml-4">
				<div className="relative w-16 h-24 sm:w-24 sm:h-36 animate-in zoom-in duration-300">
				  <Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
				</div>
			  </div>
		  )}
		</div>
	  </div>
  );
}
