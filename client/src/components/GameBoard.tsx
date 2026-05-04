// client/src/components/GameBoard.tsx
import { useGameStore } from '@/store/useGameStore';
import Image from 'next/image';
import { PlayerHand } from './PlayerHand';
import { PhaseOverlay } from './PhaseOverlay';

export function GameBoard() {
  const { gameState, socket, cutCard } = useGameStore();

  if (!gameState || !socket) return null;

  const me = gameState.players.find((p) => p.id === socket.id);
  const opponents = gameState.players.filter((p) => p.id !== socket.id);
  const iHaveClippers = gameState.playerWithClippers === socket.id;

  if (!me) return null;

  // Utilitaire pour le centre de la table
  const getCardImage = (type: string) => {
	if (type === 'BOMB') return '/assets/card-bomb.png';
	if (type === 'DEFUSE') return '/assets/card-defuse.png';
	return '/assets/card-safe.png';
  };

  return (
	  <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden landscape:flex-row">

		{/* BARRE LATÉRALE / INFOS */}
		<div className="flex flex-row landscape:flex-col justify-between items-center bg-zinc-900 p-4 border-b landscape:border-b-0 landscape:border-r border-zinc-800 z-10">
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

		  {/* 1. ADVERSAIRES */}
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

		  {/* 2. CENTRE DE LA TABLE (Cartes révélées avec de vraies images) */}
		  <div className="h-32 bg-zinc-900/30 border-y border-zinc-800 flex flex-col items-center justify-center shadow-inner">
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

		  {/* 3. MA ZONE */}
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

		<PhaseOverlay />

		{/* ÉCRAN DE VICTOIRE */}
		{gameState.status === 'FINISHED' && (
			<div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-200 backdrop-blur-md animate-in fade-in duration-700">
			  <div className="relative w-48 h-72 mb-8 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
				<Image
					src={gameState.winner === 'SHERLOCK' ? '/assets/role-sherlock.png' : '/assets/role-moriarty.png'}
					alt={`Victoire ${gameState.winner}`}
					fill
					className="object-cover"
				/>
			  </div>
			  <h2 className="text-sm uppercase tracking-[0.3em] mb-2 opacity-70">La partie est terminée</h2>
			  <h3 className={`text-5xl font-black mb-8 ${gameState.winner === 'SHERLOCK' ? 'text-blue-500' : 'text-red-500'}`}>
				L'ÉQUIPE {gameState.winner} GAGNE !
			  </h3>
			  <button
				  onClick={() => window.location.reload()}
				  className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-colors"
			  >
				RETOURNER AU LOBBY
			  </button>
			</div>
		)}
	  </div>
  );
}
