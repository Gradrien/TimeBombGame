// client/src/components/GamePlayArea.tsx
import {Player} from '@timebomb/shared';
import {Card} from './Card';
import Image from 'next/image';
import {ASSETS} from '@/utils/assets';
import {useGameStore} from '@/store/useGameStore';

interface Props {
  viewedPlayer: Player;
  isViewingOpponent: boolean;
  iHaveClippers: boolean;
  playerWithClippers: string;
  handleCutCard: (cardId: string) => void;
  players: Player[];
}

export function GamePlayArea({
							   viewedPlayer,
							   isViewingOpponent,
							   iHaveClippers,
							   playerWithClippers,
							   handleCutCard,
							   players
							 }: Props) {
  const {gameState, useLoupe, isScannerActive} = useGameStore();

  const activePlayerName = players.find(p => p.id === playerWithClippers)?.name || "quelqu'un";

  const hiddenCards = viewedPlayer.cards.filter(c => !c.isRevealed && !c.isPublic);
  const hasEnoughHiddenCards = hiddenCards.length > 1;

  const handleCardClick = (cardId: string) => {
	if (isScannerActive && gameState) {
	  useLoupe(gameState.roomId, viewedPlayer.id, cardId);
	} else if (iHaveClippers) {
	  handleCutCard(cardId);
	}
  };

  return (
	  <div className="flex-1 flex flex-col items-center justify-center p-4 relative">

		{/* INDICATEUR DE TOUR */}
		<div className="absolute top-0 left-0 right-0 py-2 flex justify-center z-20">
		  <div className="bg-black/60 border border-amber-900/40 px-6 py-1 rounded-full shadow-lg backdrop-blur-sm">
			<p className="text-xs sm:text-sm font-serif italic text-zinc-100 tracking-widest">
			  {iHaveClippers
				  ? "C'est à TOI de couper !"
				  : `Au tour de ${activePlayerName} de couper...`}
			</p>
		  </div>
		</div>

		{/* MESSAGE D'AIDE SCANNER */}
		{isScannerActive && hasEnoughHiddenCards && isViewingOpponent && (
			<div className="absolute top-16 z-20 bg-blue-900/50 border border-blue-500/50 px-4 py-1 rounded-full backdrop-blur-sm animate-bounce">
			  <p className="text-[10px] sm:text-xs text-blue-200 font-bold uppercase tracking-widest drop-shadow-md">
				Ciblez une carte de {viewedPlayer.name}
			  </p>
			</div>
		)}

		<div className={`flex items-center justify-center gap-4 sm:gap-8 w-full max-w-5xl mt-8 ${isScannerActive ? 'cursor-crosshair' : ''}`}>
		  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
			{viewedPlayer.cards.map((card) => {
			  const isInteractableForCut = iHaveClippers && isViewingOpponent && !card.isRevealed;
			  const isInteractableForScan = isScannerActive && isViewingOpponent && !card.isRevealed && !card.isPublic && hasEnoughHiddenCards;

			  return (
				  <Card
					  key={card.id}
					  card={card}
					  isInteractable={isInteractableForCut || isInteractableForScan}
					  onAction={handleCardClick}
				  />
			  );
			})}
		  </div>

		  {/* Pince du joueur */}
		  {playerWithClippers === viewedPlayer.id && !isScannerActive && (
			  <div className="flex items-center justify-center shrink-0 border-l border-amber-900/30 pl-4 sm:pl-8 ml-2 sm:ml-4">
				<div className="relative w-16 h-24 sm:w-24 sm:h-36 animate-in zoom-in duration-300">
				  <Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain drop-shadow-[0_0_20px_white]" />
				</div>
			  </div>
		  )}
		</div>
	  </div>
  );
}
