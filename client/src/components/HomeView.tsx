// client/src/components/HomeView.tsx
import {useState, useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';

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
		<h1 className="text-5xl font-black mb-12 text-zinc-100 tracking-widest drop-shadow-lg uppercase text-center">
		  Time Bomb
		</h1>

		<div
			className="flex flex-col gap-4 w-full max-w-sm bg-zinc-950/60 p-6 rounded-2xl border border-amber-900/30 shadow-2xl backdrop-blur-sm">

		  {error && (
			  <div
				  className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm text-center font-bold">
				{error}
			  </div>
		  )}

		  {/* VUE PRINCIPALE */}
		  {view === 'MAIN' && (
			  <>
				<button onClick={() => {
				  clearError();
				  setView('CREATE');
				}}
						className="bg-amber-600 hover:bg-amber-500 text-black p-4 rounded-xl font-bold transition-transform active:scale-95 uppercase tracking-widest text-sm shadow-lg">
				  Créer une Room
				</button>
				<button onClick={() => {
				  clearError();
				  setView('JOIN');
				}}
						className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 p-4 rounded-xl font-bold transition-transform active:scale-95 uppercase tracking-widest text-sm shadow-lg mt-2">
				  Rejoindre une Room
				</button>
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
				<button
					onClick={() => createRoom(playerName)}
					disabled={!playerName}
					className="bg-amber-600 hover:bg-amber-500 text-black p-3 rounded-lg font-bold disabled:opacity-50 shadow-lg mt-4 uppercase"
				>
				  Créer le Lobby
				</button>
				<button onClick={() => setView('MAIN')} className="text-zinc-400 text-sm hover:text-white mt-2">Retour
				</button>
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
					<p className="text-center text-zinc-500 text-sm mb-4 italic">Aucune room ouverte en ce moment</p>
				)}
				<button onClick={() => setView('MAIN')} className="text-zinc-400 text-sm hover:text-white mt-4">Retour
				</button>
			  </>
		  )}

		</div>
	  </main>
  );
}
