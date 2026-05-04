// client/src/components/GameBoard.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { PlayerHand } from './PlayerHand';
import { PhaseOverlay } from './PhaseOverlay';
import { Card as CardType } from '@timebomb/shared';
import { getCardImage, getRoleImage } from '@/utils/assets';

export function GameBoard() {
  const { gameState, socket, cutCard } = useGameStore();
  const [lastCutCard, setLastCutCard] = useState<CardType | null>(null);

// 1. DÉTECTION DE COUPE : Affiche la carte coupée en grand
  useEffect(() => {
	// CORRECTION : Si la partie est relancée et le tableau vidé, on force la disparition
	if (!gameState?.revealedCards || gameState.revealedCards.length === 0) {
	  setLastCutCard(null);
	  return;
	}

	const newCard = gameState.revealedCards[gameState.revealedCards.length - 1];
	let hideTimer: NodeJS.Timeout;

	const showTimer = setTimeout(() => {
	  setLastCutCard(newCard);
	  // On programme la disparition après 2.5s
	  hideTimer = setTimeout(() => setLastCutCard(null), 2500);
	}, 0);

	return () => {
	  clearTimeout(showTimer);
	  if (hideTimer) clearTimeout(hideTimer);
	};
  }, [gameState?.revealedCards?.length]);

  if (!gameState || !socket) return null;

  const me = gameState.players.find((p) => p.id === socket.id);
  const opponents = gameState.players.filter((p) => p.id !== socket.id);
  const iHaveClippers = gameState.playerWithClippers === socket.id;

  if (!me) return null;

  return (
	  <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden landscape:flex-row">

		{/* HUD : BARRE LATÉRALE / INFOS */}
		<div className="flex flex-row landscape:flex-col justify-between items-center bg-zinc-900 p-4 border-b landscape:border-b-0 landscape:border-r border-zinc-800 z-10 shadow-lg">
		  <div className="text-center landscape:mb-8">
			<p className="text-zinc-500 text-[10px] uppercase tracking-tighter">Manche</p>
			<p className="text-2xl font-black text-amber-500">{gameState.currentRound}<span className="text-zinc-600 text-lg">/4</span></p>
		  </div>

		  <div className="text-center">
			<p className="text-zinc-500 text-[10px] uppercase tracking-tighter">Désamorçages</p>
			<p className="text-3xl font-black text-green-500">
			  {gameState.totalDefusesFound}<span className="text-zinc-600 text-xl">/{gameState.totalDefusesNeeded}</span>
			</p>
		  </div>

		  <div className="text-center landscape:mt-8">
			<p className="text-zinc-500 text-[10px] uppercase tracking-tighter">Coupes restantes</p>
			<p className="text-2xl font-black">
			  {gameState.players.length - gameState.cardsRevealedThisRound}
			</p>
		  </div>
		</div>

		{/* ZONE DE JEU PRINCIPALE */}
		<div className="flex-1 flex flex-col relative overflow-hidden">

		  {/* HAUT : ADVERSAIRES */}
		  <div className="flex-1 overflow-y-auto p-4 flex flex-wrap justify-center content-start gap-4">
			{opponents.map((opponent) => (
				<PlayerHand
					key={opponent.id}
					player={opponent}
					isMe={false}
					hasClippers={gameState.playerWithClippers === opponent.id}
					iHaveClippers={iHaveClippers}
					onCutCard={(targetId, cardId) => cutCard(gameState.roomId, targetId, cardId)}
				/>
			))}
		  </div>

		  {/* MILIEU : CENTRE DE LA TABLE (Cimetière) */}
		  <div className="h-32 bg-zinc-900/40 border-y border-zinc-800 flex flex-col items-center justify-center shadow-inner">
			<p className="text-[10px] text-zinc-600 uppercase mb-2 tracking-widest">Câbles coupés</p>
			<div className="flex gap-2 px-4 overflow-x-auto w-full justify-center">
			  {gameState.revealedCards.length === 0 && (
				  <div className="h-20 w-14 border-2 border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-zinc-700">
					∅
				  </div>
			  )}
			  {gameState.revealedCards.map((card, i) => (
				  <div
					  key={i}
					  className={`relative w-14 h-20 rounded-md overflow-hidden shadow-lg border-2 ${card.type === 'BOMB' ? 'border-red-500' : card.type === 'DEFUSE' ? 'border-green-500' : 'border-zinc-500'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
				  >
					<Image
						src={getCardImage(card.type)}
						alt={card.type}
						fill
						className="object-cover"
					/>
				  </div>
			  ))}
			</div>
		  </div>

		  {/* BAS : MA ZONE */}
		  <div className="bg-zinc-900/80 p-4 backdrop-blur-md">
			<PlayerHand
				player={me}
				isMe={true}
				hasClippers={iHaveClippers}
				iHaveClippers={iHaveClippers}
				onCutCard={() => {}}
			/>
		  </div>
		</div>

		{/* --- LES MODALES ET OVERLAYS (QUI SE SUPERPOSENT) --- */}

		{/* 1. OVERLAY DE BLOCAGE (Révélation des rôles et cartes) */}
		<PhaseOverlay />

		{/* 2. ANIMATION "GRANDE RÉVÉLATION" QUAND ON COUPE */}
		{lastCutCard && (
			<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
			  <div className="relative w-64 h-96 animate-in zoom-in spin-in-2 duration-500">
				<Image
					src={getCardImage(lastCutCard.type)}
					alt="Résultat de la coupe"
					fill
					className={`object-contain ${lastCutCard.type === 'BOMB' ? 'drop-shadow-[0_0_50px_rgba(239,68,68,0.8)]' : lastCutCard.type === 'DEFUSE' ? 'drop-shadow-[0_0_50px_rgba(34,197,94,0.8)]' : 'drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
				/>
				<div className="absolute -bottom-16 left-0 right-0 text-center">
				  <p className={`text-4xl font-black italic tracking-widest ${lastCutCard.type === 'BOMB' ? 'text-red-500' : lastCutCard.type === 'DEFUSE' ? 'text-green-500' : 'text-zinc-400'}`}>
					{lastCutCard.type === 'BOMB' ? 'EXPLOSION !' : lastCutCard.type === 'DEFUSE' ? 'DÉSARMÉ !' : 'RIEN...'}
				  </p>
				</div>
			  </div>
			</div>
		)}

		{/* 3. ÉCRAN DE FIN DE PARTIE */}
		{gameState.status === 'FINISHED' && (
			<div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center backdrop-blur-2xl animate-in fade-in duration-1000">
			  <div className="relative w-48 h-72 mb-10 overflow-hidden">
				<Image
					src={getRoleImage(gameState.winner === 'SHERLOCK' ? 'SHERLOCK' : 'MORIARTY')}
					alt="Winner"
					fill
					className="object-contain"
				/>
			  </div>

			  <h3 className="text-4xl font-serif italic text-white mb-12 tracking-widest uppercase">
				L'ÉQUIPE {gameState.winner} GAGNE
			  </h3>

			  <div className="flex gap-6">
				<button
					onClick={() => socket.emit('restartGame', gameState.roomId)}
					className="px-10 py-4 bg-zinc-100 text-black font-black rounded-full hover:bg-white transition-transform active:scale-95"
				>
				  REJOUER
				</button>
				<button
					onClick={() => window.location.reload()}
					className="px-10 py-4 border border-zinc-700 text-zinc-400 font-bold rounded-full hover:text-white hover:border-white transition-colors"
				>
				  LOBBY
				</button>
			  </div>
			</div>
		)}

	  </div>
  );
}
