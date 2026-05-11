// client/src/components/HomeView.tsx
import {useState, useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import Image from 'next/image';

export function HomeView() {
  const {
	playerName,
	setPlayerName,
	createRoom,
	joinRoom,
	fetchOpenRooms,
	openRooms,
	error,
	clearError
  } = useGameStore();
  const [view, setView] = useState<'MAIN' | 'CREATE' | 'JOIN'>('MAIN');

  // Quand on ouvre la vue JOIN, on demande au serveur les lobbys disponibles
  useEffect(() => {
	if (view === 'JOIN') fetchOpenRooms();
  }, [view, fetchOpenRooms]);

  return (
	  <main className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-4">
		<div className="relative w-full max-w-[280px] sm:max-w-[400px] aspect-[3/1] mb-8">
		  <Image
			  src="/assets/game-title.png"
			  alt="Time Bomb"
			  fill
			  className="object-contain"
			  priority
		  />
		</div>

		<div
			className="flex flex-col gap-4 w-full max-w-sm ">

		  {error && (
			  <div
				  className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm text-center font-bold">
				{error}
			  </div>
		  )}

		  {/* VUE PRINCIPALE */}
		  {view === 'MAIN' && (
			  <>
				<SteampunkButton variant="sherlock" size="lg"
								 onClick={() => {
								   clearError();
								   setView('CREATE');
								 }}
				>
				  Créer une Room
				</SteampunkButton>
				<SteampunkButton variant="neutral" size="lg"
								 onClick={() => {
								   clearError();
								   setView('JOIN');
								 }}
				>
				  Rejoindre une Room
				</SteampunkButton>
			  </>
		  )}

		  {/* VUE CRÉATION */}
		  {view === 'CREATE' && (
			  <>
				<input
					type="text"
					placeholder="Ton pseudo"
					maxLength={12}
					className="p-3 rounded-lg bg-black/50 border border-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
					value={playerName}
					onChange={(e) => setPlayerName(e.target.value)}
				/>
				<SteampunkButton variant="sherlock" size="lg"
								 disabled={!playerName}
								 onClick={() => createRoom(playerName)}
				>
				  Créer le Lobby
				</SteampunkButton>
				<SteampunkButton variant="neutral" size="md"
								 onClick={() => setView('MAIN')}
				>
				  Retour
				</SteampunkButton>
			  </>
		  )}

		  {/* VUE REJOINDRE */}
		  {view === 'JOIN' && (
			  <>
				<input
					type="text"
					placeholder="Ton pseudo"
					maxLength={12}
					className="p-3 rounded-lg bg-black/50 border border-zinc-600 focus:outline-none focus:border-amber-500 transition-colors mb-4"
					value={playerName}
					onChange={(e) => setPlayerName(e.target.value)}
				/>

				{/* Liste des Rooms */}
				{openRooms.length > 0 ? (
					<div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto pr-2 no-scrollbar">
					  {openRooms.map((r) => (

						  <button
							  key={r.roomId}
							  onClick={() => playerName ? joinRoom(r.roomId, playerName) : alert("Entre un pseudo d'abord !")}
							  className="flex justify-between items-center p-3 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-amber-500 hover:bg-zinc-800 transition-colors text-left"
						  >
							<span className="font-mono text-amber-500 font-bold">{r.roomId}</span>
							<span className="text-xs text-zinc-400">{r.playerCount}/8 Joueurs</span>
						  </button>
					  ))}
					</div>
				) : (
					<p className="text-center  text-sm mb-4 italic">Aucune room ouverte en ce moment</p>
				)}
				<SteampunkButton variant="neutral" size="md"
								 onClick={() => setView('MAIN')}
				>
				  Retour
				</SteampunkButton>
			  </>
		  )}

		</div>
	  </main>
  );
}
