// client/src/components/PhaseOverlay.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';

export function PhaseOverlay() {
  const { gameState, socket } = useGameStore();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
	setShowContent(false);
  }, [gameState?.phase, gameState?.currentRound]);

  if (!gameState || !socket) return null;

  const me = gameState.players.find(p => p.id === socket.id);
  const isReady = gameState.readyPlayers.includes(socket.id);

  if (gameState.phase === 'PLAYING' || gameState.status === 'LOBBY' || gameState.status === 'FINISHED') {
	return null;
  }

  // Fonctions utilitaires sécurisées pour les chemins d'images
  const getRoleImage = (role?: string) => {
	if (role === 'MORIARTY') return '/assets/role-moriarty.png';
	if (role === 'SHERLOCK') return '/assets/role-sherlock.png';
	return ''; // Fallback vide pour éviter TS2345
  };

  const getCardImage = (type?: string) => {
	if (type === 'BOMB') return '/assets/card-bomb.png';
	if (type === 'DEFUSE') return '/assets/card-defuse.png';
	return '/assets/card-safe.png';
  };

  return (
	  <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
		<h2 className="text-3xl font-bold mb-8 text-amber-500">
		  {gameState.phase === 'ROLE_REVEAL' ? 'Rôle Assigné' : `Manche ${gameState.currentRound} : Tes Câbles`}
		</h2>

		{!showContent ? (
			<button
				onClick={() => setShowContent(true)}
				className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-2xl font-black text-2xl shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-transform active:scale-95"
			>
			  MAINTENIR POUR RÉVÉLER
			</button>
		) : (
			<div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">

			  {gameState.phase === 'ROLE_REVEAL' ? (
				  <div className={`p-6 rounded-3xl border-4 shadow-2xl flex flex-col items-center ${me?.role === 'MORIARTY' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'}`}>
					<p className={`text-sm uppercase tracking-widest mb-4 font-bold ${me?.role === 'MORIARTY' ? 'text-red-500' : 'text-blue-500'}`}>
					  Équipe {me?.role}
					</p>
					{me?.role && (
						<div className="relative w-48 h-72 rounded-xl overflow-hidden border-2 border-zinc-800 shadow-inner">
						  <Image
							  src={getRoleImage(me.role)}
							  alt={`Rôle ${me.role}`}
							  fill
							  className="object-cover"
							  priority
						  />
						</div>
					)}
				  </div>
			  ) : (
				  <div className="flex flex-wrap justify-center gap-4 mb-4">
					{me?.secretCards?.map((type, index) => (
						<div key={index} className="relative w-20 h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-700">
						  <Image
							  src={getCardImage(type)}
							  alt={`Carte ${type}`}
							  fill
							  className="object-cover"
						  />
						</div>
					))}
				  </div>
			  )}

			  <button
				  disabled={isReady}
				  onClick={() => {
					const action = gameState.phase === 'ROLE_REVEAL' ? 'confirmRole' : 'confirmCards';
					socket.emit(action, gameState.roomId);
				  }}
				  className={`mt-12 px-10 py-4 rounded-xl font-bold text-xl transition-all ${isReady ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
			  >
				{isReady ? 'Attente des autres...' : 'J\'AI COMPRIS'}
			  </button>
			</div>
		)}

		{/* Indicateurs de joueurs prêts */}
		<div className="absolute bottom-10 flex gap-2">
		  {gameState.players.map(p => (
			  <div
				  key={p.id}
				  className={`w-3 h-3 rounded-full ${gameState.readyPlayers.includes(p.id) ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'}`}
				  title={p.name}
			  />
		  ))}
		</div>
	  </div>
  );
}
