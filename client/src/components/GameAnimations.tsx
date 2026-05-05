// client/src/components/GameAnimations.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { Card as CardType } from '@timebomb/shared';
import { getCardImage, ASSETS } from '@/utils/assets';

export function GameAnimations() {
  const { gameState, socket } = useGameStore();
  const [lastCutCard, setLastCutCard] = useState<CardType | null>(null);
  const [showLastCutWarning, setShowLastCutWarning] = useState(false);

  // On garde en mémoire le nombre de cartes révélées.
  // Lors du montage du composant (début du round), on prend la longueur actuelle
  // pour ne pas animer les cartes du round précédent.
  const prevCount = useRef(gameState?.revealedCards?.length || 0);

  useEffect(() => {
	const currentCount = gameState?.revealedCards?.length || 0;

	// Si on est en train de jouer ET qu'une NOUVELLE carte vient d'être coupée
	if (gameState?.phase === 'PLAYING' && currentCount > prevCount.current) {
	  const newCard = gameState.revealedCards[currentCount - 1];
	  const isLastCutNext = gameState.cardsRevealedThisRound === gameState.players.length - 1;
	  const isFinished = gameState.status === 'FINISHED';

	  setLastCutCard(newCard);

	  let warningTimer: NodeJS.Timeout;
	  const hideTimer = setTimeout(() => {
		setLastCutCard(null);

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

	// On synchronise le compteur (utile en cas de relance de partie)
	prevCount.current = currentCount;

	// L'effet ne surveille QUE la taille du cimetière, empêchant les bugs liés aux changements de phases
  }, [gameState?.revealedCards?.length]);

  if (!gameState || !socket) return null;

  return (
	  <>
		{/* ANIMATION CARTE COUPÉE */}
		{lastCutCard && (
			<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
			  <div className="relative w-32 h-48 sm:w-64 sm:h-96 landscape:w-32 landscape:h-48 animate-in zoom-in spin-in-2 duration-500">
				<Image
					src={getCardImage(lastCutCard.type)} alt="Résultat" fill
					className={`object-contain ${lastCutCard.type === 'BOMB' ? 'drop-shadow-[0_0_50px_rgba(239,68,68,0.8)]' : lastCutCard.type === 'DEFUSE' ? 'drop-shadow-[0_0_50px_rgba(34,197,94,0.8)]' : 'drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
				/>
				<div className="absolute -bottom-10 sm:-bottom-16 landscape:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
				  <p className={`text-xl sm:text-4xl landscape:text-lg font-black italic tracking-widest uppercase drop-shadow-md ${lastCutCard.type === 'BOMB' ? 'text-red-500' : lastCutCard.type === 'DEFUSE' ? 'text-green-500' : 'text-zinc-300'}`}>
					{lastCutCard.type === 'BOMB' ? 'Explosion !' : lastCutCard.type === 'DEFUSE' ? 'Désarmé !' : 'Rien...'}
				  </p>
				</div>
			  </div>
			</div>
		)}

		{/* ANIMATION DERNIÈRE COUPE */}
		{showLastCutWarning && (
			<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
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
	  </>
  );
}
