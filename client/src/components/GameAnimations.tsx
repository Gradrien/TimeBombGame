import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import type { Card as CardType } from '@timebomb/shared';
import { getCardImage, ASSETS } from '@/utils/assets';

export function GameAnimations() {
  const { gameState, socket, loupeAnimation } = useGameStore();

  const [lastCutData, setLastCutData] = useState<{card: CardType, ownerName: string} | null>(null);
  const [showLastCutWarning, setShowLastCutWarning] = useState(false);

  const prevCount = useRef(gameState?.revealedCards?.length || 0);

  useEffect(() => {
	if (!gameState || !gameState.revealedCards) return;

	const currentCount = gameState.revealedCards.length;

	if (currentCount > prevCount.current) {
	  const newCard = gameState.revealedCards[currentCount - 1];
	  const isLastCutNext = gameState.cardsRevealedThisRound === gameState.players.length - 1;
	  const isFinished = gameState.status === 'FINISHED';

	  // Le joueur chez qui on vient de couper est celui qui possède maintenant la pince
	  const targetPlayer = gameState.players.find(p => p.id === gameState.playerWithClippers);

	  setLastCutData({
		card: newCard,
		ownerName: targetPlayer?.name || "inconnu"
	  });

	  let warningTimer: NodeJS.Timeout;
	  const hideTimer = setTimeout(() => {
		setLastCutData(null);

		// On affiche l'alerte "Dernière coupe" que s'il reste une coupe à faire et que la partie n'est pas finie
		if (!isFinished && isLastCutNext) {
		  setShowLastCutWarning(true);
		  warningTimer = setTimeout(() => setShowLastCutWarning(false), 2500);
		}
	  }, 2500);

	  prevCount.current = currentCount;

	  return () => {
		clearTimeout(hideTimer);
		if (warningTimer) clearTimeout(warningTimer);
	  };
	}

	prevCount.current = currentCount;
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.revealedCards?.length]);

  if (!gameState || !socket) return null;

  return (
	  <>
		{/* ANIMATION CARTE COUPÉE */}
		{lastCutData && (
			<div
				className="fixed inset-0 z-150 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">

			  <div
				  className="relative w-32 h-48 sm:w-64 sm:h-96 landscape:w-32 landscape:h-48 flex flex-col items-center">

				{/* TEXTE EN HAUT : Type de carte */}
				<div
					className="absolute -top-10 sm:-top-16 landscape:-top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
				  <p className={`text-2xl sm:text-4xl landscape:text-xl font-black italic tracking-widest uppercase drop-shadow-lg 
                 ${lastCutData.card.type === 'BOMB' ? 'text-red-500' :
					  lastCutData.card.type === 'DEFUSE' ? 'text-green-500' :
						  lastCutData.card.type === 'LOUPE' ? 'text-blue-400' : 'text-zinc-300'}`}>
					{lastCutData.card.type === 'BOMB' ? 'Explosion !' :
						lastCutData.card.type === 'DEFUSE' ? 'Désarmé !' :
							lastCutData.card.type === 'LOUPE' ? 'Loupe Obtenue !' : 'Rien...'}
				  </p>
				</div>

				{/* IMAGE DE LA CARTE */}
				<div className="relative w-full h-full animate-in zoom-in spin-in-2 duration-500">
				  <Image
					  src={getCardImage(lastCutData.card.type)} alt="Résultat" fill
					  className={`object-contain 
                    ${lastCutData.card.type === 'BOMB' ? 'drop-shadow-[0_0_50px_rgba(239,68,68,0.8)]' :
						  lastCutData.card.type === 'DEFUSE' ? 'drop-shadow-[0_0_50px_rgba(34,197,94,0.8)]' :
							  lastCutData.card.type === 'LOUPE' ? 'drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]' : 'drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
				  />
				</div>

				{/* TEXTE EN BAS : Chez qui */}
				<div
					className="absolute -bottom-10 sm:-bottom-16 landscape:-bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
				  <p className="text-xl sm:text-4xl landscape:text-lg font-black italic tracking-widest uppercase drop-shadow-md text-zinc-100">
					Chez <span className="text-amber-500">{lastCutData.ownerName}</span>
				  </p>
				</div>
			  </div>
			</div>
		)}

		{/* ANIMATION DERNIÈRE COUPE */}
		{showLastCutWarning && (
			<div className="fixed inset-0 z-150 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
			  <div className="relative w-32 h-48 sm:w-64 sm:h-96 landscape:w-32 landscape:h-48 animate-in zoom-in spin-in-2 duration-500">
				<Image src={ASSETS.CLIPPER} alt="Pince coupante" fill className="object-contain drop-shadow-[0_0_50px_rgba(245,158,11,0.8)]" />
				<div className="absolute -bottom-10 sm:-bottom-16 landscape:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
				  <p className="text-xl sm:text-4xl landscape:text-lg font-black italic tracking-widest text-zinc-100 drop-shadow-md uppercase">
					Dernière coupe !
				  </p>
				</div>
			  </div>
			</div>
		)}

		{/* ANIMATION LOUPE (Succès/Échec) */}
		{loupeAnimation && (
			<div className={`fixed inset-0 z-200 flex items-center justify-center ${loupeAnimation.success ? 'bg-blue-900/20' : 'bg-black/30'}  backdrop-blur-md animate-in fade-in`}>
			  <div className="flex flex-col items-center animate-in zoom-in duration-500">
				<p className={`text-3xl sm:text-6xl font-black italic tracking-[0.2em] uppercase mb-4 ${loupeAnimation.success ? 'text-blue-700' : 'text-zinc-800'}`}>
				  {loupeAnimation.success ? 'INDICE RÉVÉLÉ !' : 'LOUPE BRISÉE...'}
				</p>
				<p className="text-xl text-zinc-100 font-serif italic tracking-widest">
				  Cible : {loupeAnimation.targetName}
				</p>
			  </div>
			</div>
		)}
	  </>
  );
}
