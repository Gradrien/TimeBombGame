import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
	  const isBomb = newCard.type === 'BOMB';

	  // Le joueur chez qui on vient de couper est celui qui possède maintenant la pince
	  const targetPlayer = gameState.players.find(p => p.id === gameState.playerWithClippers);

	  setLastCutData({
		card: newCard,
		ownerName: targetPlayer?.name || "inconnu"
	  });

	  // La bombe reste à l'écran beaucoup plus longtemps (5 secondes au lieu de 2.5)
	  const displayDuration = isBomb ? 5000 : 2500;

	  let warningTimer: NodeJS.Timeout;
	  const hideTimer = setTimeout(() => {
		setLastCutData(null);

		// On n'affiche l'alerte "Dernière coupe" que si ce n'est pas fini
		if (!isFinished && isLastCutNext) {
		  setShowLastCutWarning(true);
		  warningTimer = setTimeout(() => setShowLastCutWarning(false), 2500);
		}
	  }, displayDuration);

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

  const getCardConfig = (type: string) => {
	switch (type) {
	  case 'BOMB': return { color: '#ef4444', accent: '#f97316', text: 'EXPLOSION !', isBomb: true };
	  case 'DEFUSE': return { color: '#22c55e', accent: '#a3e635', text: 'CÂBLE COUPÉ !', isBomb: false };
	  case 'LOUPE': return { color: '#3b82f6', accent: '#60a5fa', text: 'LOUPE OBTENUE !', isBomb: false };
	  default: return { color: '#c9a56d', accent: '#f3e7d3', text: 'RIEN...', isBomb: false };
	}
  };

  const glitchVariants = {
	animate: {
	  x: [0, -2, 2, -1, 1, 0],
	  y: [0, 1, -1, 0],
	  filter: ['invert(0%) blur(0px)', 'invert(10%) blur(1px)', 'invert(0%) blur(0px)'],
	  transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" as const }
	}
  };

  return (
	  <AnimatePresence mode="wait">

		{/* 1. ANIMATION CARTE COUPÉE */}
		{lastCutData && (
			<motion.div
				key="card-cut-anim"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, transition: { duration: 0.3 } }}
				className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0a0a0a]/85 backdrop-blur-sm overflow-hidden pointer-events-none"
			>
			  {(() => {
				const config = getCardConfig(lastCutData.card.type);

				const bombVisualEffect = config.isBomb ? (
					<>
					  {/* Juste le flash aveuglant initial */}
					  <motion.div
						  initial={{ opacity: 1 }} animate={{ opacity: 0 }}
						  transition={{ duration: 0.6, ease: "easeOut" }}
						  className="absolute inset-0 bg-white z-50"
					  />
					</>
				) : null;

				const shakeAnimation = config.isBomb ? {
				  x: [0, -20, 20, -15, 15, -10, 10, 0], y: [0, 5, -5, 0],
				  transition: { duration: 0.5, delay: 0.1 }
				} : {};

				return (
					<motion.div
						initial={{ scale: 0, rotateY: 180, z: -500 }}
						animate={{ scale: 1, rotateY: 0, z: 0, ...shakeAnimation }}
						exit={{ scale: 0.8, y: -50, opacity: 0, transition: { duration: 0.3 } }}
						transition={{ type: "spring", damping: 15, stiffness: 120 }}
						className="relative w-56 h-80 sm:w-80 sm:h-[480px] landscape:w-44 landscape:h-64 flex flex-col items-center justify-center perspective-[1000px]"
					>
					  {bombVisualEffect}

					  <motion.div
						  initial={{ opacity: 0, scale: 0.8 }}
						  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
						  transition={{ delay: 0.2, duration: 2, repeat: Infinity, ease: "easeInOut" }}
						  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 rounded-full blur-[80px] z-0"
						  style={{ background: `radial-gradient(circle, ${config.accent} 0%, ${config.color} 70%, transparent 100%)` }}
					  />

					  <motion.div
						  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
						  className="absolute -top-16 sm:-top-24 landscape:-top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
					  >
						<p className="text-4xl sm:text-6xl landscape:text-3xl font-serif font-black italic tracking-widest uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
						   style={{ color: config.color, textShadow: `0 0 15px ${config.accent}` }}>
						  {config.text}
						</p>
					  </motion.div>

					  <motion.div
						  initial={{ scale: 1 }} animate={config.isBomb ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3, delay: 0.1 }}
						  className="relative w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-20"
					  >
						<Image src={getCardImage(lastCutData.card.type)} alt="Résultat" fill className="object-contain" priority />
					  </motion.div>

					  <motion.div
						  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
						  className="absolute -bottom-16 sm:-bottom-24 landscape:-bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
					  >
						<p className="text-2xl sm:text-4xl landscape:text-xl font-serif italic tracking-widest uppercase text-[#f3e7d3] drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
						  Chez <span style={{ color: config.color, textShadow: `0 0 15px ${config.color}` }} className="font-black">{lastCutData.ownerName}</span>
						</p>
					  </motion.div>
					</motion.div>
				);
			  })()}
			</motion.div>
		)}

		{/* 2. ANIMATION DERNIÈRE COUPE */}
		{showLastCutWarning && (
			<motion.div
				key="last-cut-anim"
				initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
				className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0a0a0a]/70 backdrop-blur-sm pointer-events-none"
			>
			  <motion.div
				  initial={{ scale: 0.5, rotate: -15, y: 30 }}
				  animate={{ scale: 1, rotate: 0, y: 0 }}
				  exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.3 } }}
				  transition={{ type: "spring", stiffness: 150, damping: 10 }}
				  className="relative w-56 h-56 sm:w-80 sm:h-80 landscape:w-48 landscape:h-48 flex flex-col items-center justify-center"
			  >
				<motion.div
					animate={{ opacity: [0.2, 0.5, 0.2] }}
					transition={{ repeat: Infinity, duration: 1.5 }}
					className="absolute inset-0 bg-[#f59e0b] blur-[80px] rounded-full z-0 opacity-50"
				/>

				<div className="relative w-full h-full z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
				  <Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain" priority />
				</div>

				<div className="absolute -bottom-10 sm:-bottom-16 landscape:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
				  <p className="text-3xl sm:text-5xl landscape:text-2xl font-black font-serif uppercase tracking-[0.2em] text-[#f59e0b] drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)]">
					DERNIÈRE COUPE !
				  </p>
				</div>
			  </motion.div>
			</motion.div>
		)}

		{/* 3. ANIMATION LOUPE */}
		{loupeAnimation && (
			<motion.div
				key="loupe-anim"
				initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
				className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm
              ${loupeAnimation.success ? 'bg-[#1e3a8a]/20' : 'bg-[#450a0a]/40'}`}
			>
			  <motion.div
				  initial={{ scale: 0.9, y: 20 }}
				  animate={{ scale: 1, y: 0 }}
				  exit={{ scale: 1.1, opacity: 0 }}
				  transition={{ type: "spring", damping: 20 }}
				  className={`relative flex flex-col items-center text-center p-8 sm:p-12 rounded-2xl shadow-2xl backdrop-blur-md
                ${loupeAnimation.success ? 'bg-[#0a0a0a]/70' : 'bg-[#0a0a0a]/80'}`}
			  >
				{loupeAnimation.success ? (
					[...Array(2)].map((_, i) => (
						<motion.div key={i}
									initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 0.3, 0], scale: [1, 1.5, 2] }}
									transition={{ delay: i * 0.4, duration: 1.5, repeat: Infinity, ease: "easeOut" }}
									className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-2xl border border-[#60a5fa]/30 pointer-events-none"
						/>
					))
				) : (
					<motion.div
						animate={{ y: [-50, 50] }} transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
						className="absolute left-0 right-0 h-1 bg-[#ef4444]/30 blur-sm pointer-events-none"
					/>
				)}

				<motion.p
					variants={!loupeAnimation.success ? glitchVariants : {}}
					animate={!loupeAnimation.success ? "animate" : ""}
					className={`text-3xl sm:text-5xl font-serif font-black italic tracking-[0.1em] uppercase mb-4 drop-shadow-lg
               ${loupeAnimation.success ? 'text-[#60a5fa]' : 'text-[#ef4444]'}
               ${!loupeAnimation.success ? 'before:content-[attr(data-text)] before:absolute before:top-0 before:left-0 before:text-cyan-400 before:opacity-70 before:-translate-x-0.5 before:mix-blend-screen after:content-[attr(data-text)] after:absolute after:top-0 after:left-0 after:text-magenta-500 after:opacity-70 after:translate-x-0.5 after:mix-blend-screen' : ''}`}
					data-text={loupeAnimation.success ? 'INDICE RÉVÉLÉ !' : 'LOUPE BROUILLÉE'}
				>
				  {loupeAnimation.success ? 'INDICE RÉVÉLÉ !' : 'LOUPE BROUILLÉE'}
				</motion.p>

				<p className="text-lg sm:text-xl text-[#f3e7d3] font-serif tracking-widest uppercase">
				  Cible détectée : <span className="font-bold text-[#c9a56d] font-sans">{loupeAnimation.targetName}</span>
				</p>
			  </motion.div>
			</motion.div>
		)}
	  </AnimatePresence>
  );
}
