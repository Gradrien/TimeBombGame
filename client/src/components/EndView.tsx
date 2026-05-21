import Image from 'next/image';
import {useGameStore} from '@/store/useGameStore';
import {getRoleCard} from '@/utils/assets';
import SteampunkButton from "@/components/Button";

export function EndView() {
  const {gameState, socket, playerId, leaveRoom} = useGameStore();

  if (!gameState || !socket || gameState.status !== 'FINISHED') return null;

  const isSherlock = gameState.winner === 'SHERLOCK';

  const getSkinIndex = (targetId: string, role?: string) => {
	const index = gameState.players.findIndex(p => p.id === targetId);
	if (role === 'SHERLOCK') return (index % 5) + 1;
	if (role === 'MORIARTY') return (index % 3) + 1;
	return 1;
  };

  return (
	  <main
		  className="flex flex-col h-dvh w-full items-center justify-center bg-black/60 backdrop-blur-md text-white p-4 select-none overflow-hidden">

		{/* ENCADRÉ PRINCIPAL */}
		<div
			className="w-full max-w-4xl flex flex-col bg-zinc-950/80 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex-1 mb-2 max-h-[80dvh]">

		  {/* HEADER */}
		  <div className={`flex  items-center justify-center py-4 border-b border-amber-900/30 shrink-0 ${isSherlock ? 'bg-blue-900/20' : 'bg-red-900/20'}`}>
			<h3 className="text-lg sm:text-2xl font-serif italic text-zinc-100 tracking-widest uppercase leading-tight">
			  L&#39;équipe <span className={isSherlock ? 'text-blue-500' : 'text-red-500'}>{gameState.winner}</span> gagne
			</h3>
		  </div>

		  {/* GRILLE DES JOUEURS */}
		  <div className="flex-1 overflow-y-auto px-2 no-scrollbar">
			<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 justify-items-center">
			  {gameState.players.map(p => (
				  <div key={p.id}
					   className={`relative flex flex-col items-center justify-center w-fit`}>

					<div key={p.id}className="relative w-16 h-24 sm:w-24 sm:h-36 mb-2">
					  <Image src={getRoleCard(p.role, getSkinIndex(p.id, p.role))} alt="Role" fill className="object-contain drop-shadow-md"/>
					</div>

					<span
						className={`text-xs sm:text-xs font-bold truncate w-full text-center ${p.id === playerId ? 'text-amber-500' : 'text-zinc-400'}`}>
                  {p.name} {p.id === playerId && '(Toi)'}
                 </span>
				  </div>
			  ))}
			</div>
		  </div>
		</div>

		{/* ACTIONS */}
		<div className="flex flex-row gap-6 w-full justify-center shrink-0 pb-2">
		  <SteampunkButton
		  variant="sherlock"
		  size="lg"
		  onClick={() => socket.emit('restartGame', gameState.roomId)}
		  >
			Rejouer
		  </SteampunkButton>
		  <SteampunkButton
		  variant="moriarty"
		  size="lg"
		  onClick={() => leaveRoom(gameState.roomId)}
		  >
			Sortir
		  </SteampunkButton>
		</div>

	  </main>
  );
}
