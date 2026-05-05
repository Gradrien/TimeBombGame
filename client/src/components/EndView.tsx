// client/src/components/EndView.tsx
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { getRoleImage } from '@/utils/assets';

export function EndView() {
  const { gameState, socket } = useGameStore();

  if (!gameState || !socket || gameState.status !== 'FINISHED') return null;

  return (
	  <main className="flex flex-col h-screen w-full items-center justify-center bg-black/40 text-white p-4 overflow-hidden select-none">

		<div className="relative w-40 h-56 sm:w-60 sm:h-80 landscape:w-32 landscape:h-48 mb-8 landscape:mb-4 overflow-hidden">
		  <Image
			  src={getRoleImage(gameState.winner === 'SHERLOCK' ? 'SHERLOCK' : 'MORIARTY')}
			  alt="Winner"
			  fill
			  className="object-contain"
		  />
		</div>

		<h3 className="text-3xl sm:text-5xl landscape:text-2xl font-serif italic text-zinc-100 mb-12 landscape:mb-6 tracking-widest uppercase text-center drop-shadow-md">
		  L'équipe <span className={gameState.winner === 'SHERLOCK' ? 'text-blue-500' : 'text-red-500'}>{gameState.winner}</span> gagne
		</h3>

		<div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md z-10">
		  <button
			  onClick={() => socket.emit('restartGame', gameState.roomId)}
			  className="flex-1 bg-zinc-100 hover:bg-white text-black px-6 py-4 rounded-full font-bold transition-transform active:scale-95 text-sm sm:text-base tracking-widest uppercase shadow-lg"
		  >
			Rejouer
		  </button>
		  <button
			  onClick={() => window.location.reload()}
			  className="flex-1 border-2 border-zinc-600 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-400 hover:bg-zinc-800/50 px-6 py-4 rounded-full font-bold transition-colors text-sm sm:text-base tracking-widest uppercase shadow-lg"
		  >
			Lobby
		  </button>
		</div>

	  </main>
  );
}
