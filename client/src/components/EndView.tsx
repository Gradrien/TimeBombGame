// client/src/components/EndView.tsx
import Image from 'next/image';
import {useGameStore} from '@/store/useGameStore';
import {getRoleImage} from '@/utils/assets';

export function EndView() {
  const {gameState, socket, playerId} = useGameStore();

  if (!gameState || !socket || gameState.status !== 'FINISHED') return null;

  const isSherlock = gameState.winner === 'SHERLOCK';

  return (
	  <main
		  className="flex flex-col h-dvh w-full items-center justify-center bg-black/60 backdrop-blur-md text-white p-4 select-none overflow-hidden">

		{/* ENCADRÉ PRINCIPAL */}
		<div
			className="w-full max-w-4xl flex flex-col bg-zinc-950/80 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex-1 mb-2 max-h-[80dvh]">

		  {/* HEADER */}
		  <div className={`flex  items-center justify-center py-4  border-b border-amber-900/30 shrink-0 ${isSherlock ? 'bg-blue-900/20' : 'bg-red-900/20'}`}>
			<h3 className="text-lg sm:text-2xl font-serif italic text-zinc-100 tracking-widest uppercase leading-tight">
			  L&#39;équipe <span className={isSherlock ? 'text-blue-500' : 'text-red-500'}>{gameState.winner}</span> gagne
			</h3>
		  </div>

		  {/* GRILLE DES JOUEURS : Zone de scroll principale */}
		  <div className="flex-1 overflow-y-auto px-4 no-scrollbar">
			<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 justify-items-center">
			  {gameState.players.map(p => (
				  <div key={p.id}
					   className={`relative flex flex-col items-center justify-center w-fit p-3 bg-black/50 rounded-xl border ${p.id === playerId ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-zinc-800'}`}>

					<div className="relative w-16 h-24 sm:w-24 sm:h-36 mb-2">
					  <Image src={getRoleImage(p.role)} alt="Role" fill className="object-contain drop-shadow-md"/>
					</div>

					<span
						className={`text-[10px] sm:text-xs font-bold truncate w-full text-center ${p.id === playerId ? 'text-amber-500' : 'text-zinc-400'}`}>
                  {p.name} {p.id === playerId && '(Toi)'}
                 </span>
				  </div>
			  ))}
			</div>
		  </div>
		</div>

		{/* ACTIONS (Fixes en bas) */}
		<div className="flex flex-row gap-3 w-full max-w-md shrink-0 pb-2">
		  <button
			  onClick={() => socket.emit('restartGame', gameState.roomId)}
			  className="flex-1 bg-amber-600 hover:bg-amber-500 text-black py-4 rounded-full font-black transition-transform active:scale-95 text-[10px] sm:text-xs tracking-[0.2em] uppercase shadow-lg"
		  >
			Rejouer
		  </button>
		  <button
			  onClick={() => window.location.reload()}
			  className="flex-1 border-2 border-zinc-600 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-zinc-400 hover:bg-zinc-800 py-4 rounded-full font-bold transition-colors text-[10px] sm:text-xs tracking-[0.2em] uppercase"
		  >
			Sortir
		  </button>
		</div>

	  </main>
  );
}
