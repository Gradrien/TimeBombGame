// client/src/components/EndView.tsx
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { getRoleImage } from '@/utils/assets';

export function EndView() {
  const { gameState, socket, playerId } = useGameStore();

  if (!gameState || !socket || gameState.status !== 'FINISHED') return null;

  return (
	  <main className="flex flex-col h-screen w-full items-center justify-center bg-black/40 backdrop-blur-[2px] text-white p-4 overflow-y-auto select-none">

		{/* ROOM CODE */}
		<div className="mb-4">
		  <span className="text-xs font-black text-amber-900 uppercase tracking-widest">Fin de Mission - Room {gameState.roomId}</span>
		</div>

		<div className="relative w-32 h-44 sm:w-48 sm:h-64 landscape:w-24 landscape:h-36 mb-6 landscape:mb-2 overflow-hidden shrink-0">
		  <Image
			  src={getRoleImage(gameState.winner === 'SHERLOCK' ? 'SHERLOCK' : 'MORIARTY')}
			  alt="Winner"
			  fill
			  className="object-contain drop-shadow-2xl"
		  />
		</div>

		<h3 className="text-2xl sm:text-4xl landscape:text-xl font-serif italic text-zinc-100 mb-8 landscape:mb-4 tracking-widest uppercase text-center drop-shadow-md">
		  L'équipe <span className={gameState.winner === 'SHERLOCK' ? 'text-blue-500' : 'text-red-500'}>{gameState.winner}</span> gagne
		</h3>

		{/* RÉCAPITULATIF DES RÔLES */}
		<div className="w-full max-w-2xl mb-8 landscape:mb-4 bg-zinc-950/60 border border-amber-900/30 rounded-xl p-4 shadow-inner">
		  <h4 className="text-center text-[10px] font-bold tracking-widest text-amber-500/80 uppercase mb-4">Rapport d'Identification Final</h4>
		  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
			{gameState.players.map(p => (
				<div key={p.id} className={`flex flex-col items-center p-2 bg-black/40 rounded-lg border ${p.id === playerId ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-zinc-800'}`}>
				  <div className="relative w-12 h-16 sm:w-16 sm:h-24 mb-2">
					<Image src={getRoleImage(p.role)} alt="Role" fill className="object-contain drop-shadow-md" />
				  </div>
				  <span className={`text-[10px] sm:text-xs font-bold truncate w-full text-center ${p.id === playerId ? 'text-amber-500' : 'text-zinc-400'}`}>
                {p.name} {p.id === playerId && '(Toi)'}
              </span>
				</div>
			))}
		  </div>
		</div>

		<div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md z-10 shrink-0 mb-4">
		  {/* REJOUER : Renvoie au lobby pour attendre l'hôte */}
		  <button
			  onClick={() => socket.emit('restartGame', gameState.roomId)}
			  className="flex-1 bg-amber-600 hover:bg-amber-500 text-black px-4 py-3 sm:px-6 sm:py-4 rounded-full font-bold transition-transform active:scale-95 text-xs sm:text-base tracking-widest uppercase shadow-lg"
		  >
			Rejouer
		  </button>
		  <button
			  onClick={() => window.location.reload()}
			  className="flex-1 border-2 border-zinc-600 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-400 hover:bg-zinc-800/50 px-4 py-3 sm:px-6 sm:py-4 rounded-full font-bold transition-colors text-xs sm:text-base tracking-widest uppercase shadow-lg"
		  >
			Sortir
		  </button>
		</div>
	  </main>
  );
}
