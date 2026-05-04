// client/src/components/PhaseOverlay.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { getRoleImage, getCardImage, ASSETS } from '@/utils/assets';

export function PhaseOverlay() {
  const { gameState, socket } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  useEffect(() => {
	setRevealed(false);
	setFlippedIndices([]);
  }, [gameState?.phase, gameState?.currentRound]);

  if (!gameState || !socket || ['PLAYING', 'LOBBY', 'FINISHED'].includes(gameState.phase)) return null;

  const me = gameState.players.find(p => p.id === socket.id);
  const isReady = gameState.readyPlayers.includes(socket.id || '');

  const revealCardsOneByOne = () => {
	if (!me?.secretCards) return;
	setRevealed(true);
	me.secretCards.forEach((_, i) => {
	  setTimeout(() => {
		setFlippedIndices(prev => [...prev, i]);
	  }, i * 200); // Délai de 200ms entre chaque carte
	});
  };

  return (
	  <div className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-hidden">
		<h2 className="text-2xl font-serif italic mb-10 text-zinc-400 uppercase tracking-[0.2em]">
		  {gameState.phase === 'ROLE_REVEAL' ? 'Identification du Matricule' : `Briefing : Manche ${gameState.currentRound}`}
		</h2>

		{/* SECTION RÔLE */}
		{gameState.phase === 'ROLE_REVEAL' && (
			<div className="flex flex-col items-center">
			  <div
				  className="relative w-52 h-72 transition-transform duration-700 cursor-pointer"
				  style={{ transformStyle: 'preserve-3d', transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
				  onClick={() => !revealed && setRevealed(true)}
			  >
				<div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
				  <Image src={ASSETS.ROLE_BACK} alt="Role Back" fill className="object-contain" />
				  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-bold tracking-widest animate-pulse">CLIQUEZ POUR RÉVÉLER</div>
				</div>
				<div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
				  <Image src={getRoleImage(me?.role)} alt="Role" fill className="object-contain" />
				</div>
			  </div>
			</div>
		)}

		{/* SECTION CARTES (JEU) */}
		{gameState.phase === 'CARD_REVEAL' && (
			<div className="flex flex-col items-center w-full max-w-3xl">
			  <div className="flex flex-wrap justify-center gap-4 mb-10">
				{me?.secretCards?.map((type, i) => (
					<div
						key={i}
						className="relative w-32 h-48 transition-transform duration-500"
						style={{ transformStyle: 'preserve-3d', transform: flippedIndices.includes(i) ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
					>
					  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
						<Image src={ASSETS.CARD_BACK} alt="Câble" fill className="object-contain " />
					  </div>
					  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
						<Image src={getCardImage(type)} alt="Reveal" fill className="object-contain" />
					  </div>
					</div>
				))}
			  </div>

			  {!revealed && (
				  <button
					  onClick={revealCardsOneByOne}
					  className="bg-zinc-100 text-black px-8 py-3 rounded-full font-bold text-sm tracking-widest hover:bg-white transition-colors"
				  >
					VÉRIFIER MES CÂBLES
				  </button>
			  )}
			</div>
		)}

		{/* BOUTON DE VALIDATION (N'apparaît que si révélé) */}
		{revealed && (
			<button
				disabled={isReady}
				onClick={() => socket.emit(gameState.phase === 'ROLE_REVEAL' ? 'confirmRole' : 'confirmCards', gameState.roomId)}
				className={`mt-10 px-10 py-3 rounded-full font-bold text-xs tracking-[0.3em] transition-all border
            ${isReady ? 'border-zinc-800 text-zinc-600' : 'border-zinc-400 text-zinc-400 hover:border-white hover:text-white'}`}
			>
			  {isReady ? 'ATTENTE DES AGENTS...' : 'J\'AI COMPRIS'}
			</button>
		)}

		{/* INDICATEURS DE PRÉSENCE */}
		<div className="absolute bottom-10 flex gap-3">
		  {gameState.players.map(p => (
			  <div
				  key={p.id}
				  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${gameState.readyPlayers.includes(p.id) ? 'bg-white scale-125 shadow-[0_0_10px_white]' : 'bg-zinc-800'}`}
			  />
		  ))}
		</div>
	  </div>
  );
}
