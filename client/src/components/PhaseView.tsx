// client/src/components/PhaseView.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { getRoleImage, getCardImage, ASSETS } from '@/utils/assets';

// --- SOUS-COMPOSANT : RÔLE ---
const RoleReveal = ({ role, revealed, isReady, setRevealed }: any) => {
  // 🎲 On génère un skin aléatoire une seule fois au montage du composant
  const [skinIndex] = useState(() => {
	if (role === 'SHERLOCK') return Math.floor(Math.random() * 5) + 1;
	if (role === 'MORIARTY') return Math.floor(Math.random() * 3) + 1;
	return 1;
  });

  return (
	  <div
		  className={`relative w-40 h-56 sm:w-60 sm:h-80 landscape:w-32 landscape:h-48 transition-transform duration-500 ${!revealed && !isReady ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
		  style={{ transformStyle: 'preserve-3d', transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
		  onClick={() => !revealed && !isReady && setRevealed(true)}
	  >
		<div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
		  <Image src={ASSETS.ROLE_BACK} alt="Role Back" fill className="object-contain drop-shadow-xl" />
		  {!isReady && !revealed && (
			  <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold tracking-widest animate-pulse">CLIQUEZ</div>
		  )}
		</div>
		<div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
		  <Image src={getRoleImage(role, skinIndex)} alt="Role" fill className="object-contain drop-shadow-2xl" />
		</div>
	  </div>
  );
};

export function PhaseView() {
  const { gameState, socket, playerId } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [shuffledCards, setShuffledCards] = useState<string[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
	setRevealed(false);
	setFlippedIndices([]);
	setIsShuffling(false);
	setIsConfirming(false);

	if (gameState?.phase === 'CARD_REVEAL') {
	  const me = gameState.players.find(p => p.id === playerId);
	  if (me?.secretCards) {
		setShuffledCards([...me.secretCards].sort(() => Math.random() - 0.5));
	  }
	}
  }, [gameState?.phase, gameState?.currentRound, playerId]);

  if (!gameState || !socket) return null;

  const me = gameState.players.find(p => p.id === playerId);
  const isReady = gameState.readyPlayers.includes(playerId) || isConfirming;
  const isFlipping = gameState.phase === 'CARD_REVEAL' && revealed && flippedIndices.length < shuffledCards.length;

  const revealCardsOneByOne = () => {
	if (!shuffledCards.length || isShuffling || isReady) return;
	setRevealed(true);
	shuffledCards.forEach((_, i) => setTimeout(() => setFlippedIndices(prev => [...prev, i]), i * 150));
  };

  const handleConfirm = () => {
	setIsConfirming(true);
	if (gameState.phase === 'ROLE_REVEAL') {
	  setRevealed(false);
	  setTimeout(() => socket.emit('confirmRole', gameState.roomId), 500);
	} else {
	  setFlippedIndices([]); // 1. Retourne face cachée

	  setTimeout(() => {
		setIsShuffling(true); // 2. Lance la rotation orbitale

		setTimeout(() => {
		  socket.emit('confirmCards', gameState.roomId); // 3. Valide côté serveur
		}, 800);
	  }, 400);
	}
  };

  return (
	  <div className="flex flex-col h-screen w-full bg-black/40 text-white overflow-hidden select-none">

		{/* HEADER AVEC ROOM CODE */}
		<div className="h-20 sm:h-28 landscape:h-16 flex flex-col items-center justify-center shrink-0 w-full px-4">
		  <span className="text-[10px] text-amber-900 font-bold tracking-[0.3em] uppercase mb-1">Room: {gameState.roomId}</span>
		  <h2 className="text-base sm:text-2xl font-serif italic text-amber-500 uppercase tracking-[0.2em] text-center drop-shadow-md">
			{gameState.phase === 'ROLE_REVEAL' ? 'Identification' : `Briefing : Manche ${gameState.currentRound}`}
		  </h2>
		</div>

		{/* CONTENU CENTRAL EXTENSIBLE */}
		<div className="flex-1 w-full flex items-center justify-center">
		  {gameState.phase === 'ROLE_REVEAL' ? (
			  <RoleReveal role={me?.role} revealed={revealed} isReady={isReady} setRevealed={setRevealed} />
		  ) : (
			  <div className={`flex flex-wrap justify-center gap-3 sm:gap-6 relative w-full max-w-4xl px-4 transition-all duration-700 ease-in-out ${isShuffling ? 'rotate-180' : 'rotate-0'}`}>
				{shuffledCards.map((type: string, i: number) => (
					<div key={i} className="relative w-20 h-32 sm:w-32 sm:h-48 landscape:w-32 landscape:h-48 transition-all duration-700 ease-in-out"
						 style={{
						   transformStyle: 'preserve-3d',
						   transform: `${isShuffling ? 'rotateZ(-180deg)' : 'rotateZ(0deg)'} ${flippedIndices.includes(i) ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
						 }}
					>
					  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
						<Image src={ASSETS.CARD_BACK} alt="Câble" fill className="object-contain drop-shadow-lg" />
					  </div>
					  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
						<Image src={getCardImage(type)} alt="Reveal" fill className="object-contain drop-shadow-xl" />
					  </div>
					</div>
				))}
			  </div>
		  )}
		</div>

		{/* FOOTER FIXE */}
		<div className="h-32 landscape:h-24 shrink-0 flex flex-col items-center justify-center gap-4 sm:gap-6 w-full">
		  {!revealed && gameState.phase === 'CARD_REVEAL' && !isReady ? (
			  <button onClick={revealCardsOneByOne} className="bg-amber-600 text-black px-8 py-3 sm:px-12 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-widest hover:bg-amber-400 transition-colors shadow-lg uppercase">
				VÉRIFIER MES CÂBLES
			  </button>
		  ) : revealed ? (
			  <button
				  disabled={isReady || isConfirming || isFlipping}
				  onClick={handleConfirm}
				  className={`px-8 py-3 sm:px-12 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all border-2 z-20  uppercase
              ${isReady || isConfirming ? 'border-none text-amber-400' : 'border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black shadow-xl'}`}
			  >
				{isConfirming ? 'EN ATTENTE DES AUTRES JOUEURS...' : isFlipping ? 'RÉVÉLATION...' : "J'AI COMPRIS"}
			  </button>
		  ) : (
			  <div className="h-10 sm:h-14 landscape:h-8" />
		  )}

		  <div className="flex gap-2 sm:gap-3 z-10">
			{gameState.players.map(p => (
				<div key={p.id} className={`w-2 h-2 rounded-full transition-all duration-500 ${gameState.readyPlayers.includes(p.id) ? 'bg-amber-500 scale-125 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-900/30'}`} />
			))}
		  </div>
		</div>

	  </div>
  );
}
