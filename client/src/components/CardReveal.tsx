import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { getCardImage, ASSETS } from '@/utils/assets';
import type { CardRevealProps } from "@/types/types";

export function CardReveal({ cards, flippedIndices, isShuffling }: CardRevealProps) {
  const controls = useAnimation();

  // Ces références nous permettent de garder de la mémoire entre les rendus
  const prevCardsLength = useRef(0);
  const hasDealt = useRef(false);

  useEffect(() => {
	// On analyse ce qui vient de se passer avec le tableau de cartes
	const isCardCut = cards.length > 0 && cards.length < prevCardsLength.current;
	prevCardsLength.current = cards.length;

	const sequenceAnimation = async () => {
	  // 1. Sécurité : Pas de cartes, pas d'animation
	  if (!cards || cards.length === 0) return;

	  // 2. Sécurité : Si on a juste coupé un câble en cours de manche, on stoppe l'animation ici !
	  if (isCardCut && !isShuffling) return;

	  // 3. Sécurité : Petite pause pour laisser le temps à React de créer les balises dans le DOM
	  await new Promise(resolve => setTimeout(resolve, 50));

	  if (isShuffling) {
		// --- SÉQUENCE COMPLÈTE DE CHANGEMENT DE MANCHE ---
		hasDealt.current = false; // On reset la sécurité pour autoriser la distribution

		// ÉTAPE 1 : Ramassage (elles partent vers la droite)
		await controls.start((i) => ({
		  opacity: 0,
		  x: 100,
		  transition: { duration: 0.2, delay: i * 0.05, ease: "easeIn" }
		}));

		// ÉTAPE 2 : Téléportation instantanée à gauche (invisibles)
		controls.set({ x: -100 });

		// ÉTAPE 3 : Pause "Mélange" (Écran vide)
		await new Promise(resolve => setTimeout(resolve, 2000));

		// ÉTAPE 4 : Redistribution Poker
		await controls.start((i) => ({
		  opacity: 1,
		  x: 0,
		  transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.15 }
		}));

		hasDealt.current = true;

	  } else {
		// --- SÉQUENCE DU TOUT PREMIER LANCEMENT DE PARTIE ---
		// On ne la joue que si elle n'a pas encore été faite (évite les double-animations au changement de round)
		if (!hasDealt.current) {
		  controls.set({ opacity: 0, x: -100 });
		  await controls.start((i) => ({
			opacity: 1,
			x: 0,
			transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.15 }
		  }));
		  hasDealt.current = true;
		}
	  }
	};

	sequenceAnimation();
  }, [isShuffling, cards.length, controls]);

  return (
	  <div className="flex flex-wrap justify-center gap-3 sm:gap-6 relative w-full max-w-4xl px-4">
		{cards.map((type: string, i: number) => {
		  const isFlipped = flippedIndices.includes(i);

		  return (
			  // COUCHE 1 : Déplacements et Opacité (Contrôlés par le script ci-dessus)
			  <motion.div
				  key={i}
				  custom={i}
				  initial={{ opacity: 0, x: -100 }}
				  animate={controls}
				  className="relative w-20 h-32 sm:w-32 sm:h-48 landscape:w-24 landscape:h-36"
				  style={{ perspective: 1000 }}
			  >
				{/* COUCHE 2 : Le retournement 3D (Indépendant) */}
				<motion.div
					className="relative w-full h-full"
					style={{ transformStyle: 'preserve-3d' }}
					animate={{ rotateY: isFlipped ? 180 : 0 }}
					transition={{ type: "spring", stiffness: 220, damping: 18 }}
				>
				  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
					<Image src={ASSETS.CARD_BACK} alt="Dos de carte" fill className="object-contain drop-shadow-lg"/>
				  </div>
				  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
					<Image src={getCardImage(type)} alt="Face de la carte" fill className="object-contain drop-shadow-xl"/>
				  </div>
				</motion.div>
			  </motion.div>
		  );
		})}
	  </div>
  );
}
