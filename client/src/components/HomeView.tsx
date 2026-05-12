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
			  <div className="relative overflow-hidden bg-gradient-to-b from-[#6e1d26] to-[#2a080d] border-2 border-[#b77b4a] text-[#f7d8b5] px-4 py-3 rounded-xl text-sm text-center font-bold shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]">
				<div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />
				<span className="relative z-10 tracking-wider font-serif uppercase">{error}</span>
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
					className="w-full p-4 rounded-xl border-2 border-[#8a6842] bg-[#1a1510] text-[#c9a56d] font-serif tracking-widest uppercase placeholder:text-[#5a4b3c] focus:outline-none focus:border-[#c9a56d] focus:bg-[#221c16] focus:shadow-[0_0_15px_rgba(201,165,109,0.2)] transition-all shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]"
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
					className="w-full p-4 rounded-xl border-2 border-[#8a6842] bg-[#1a1510] text-[#c9a56d] font-serif tracking-widest uppercase placeholder:text-[#5a4b3c] focus:outline-none focus:border-[#c9a56d] focus:bg-[#221c16] focus:shadow-[0_0_15px_rgba(201,165,109,0.2)] transition-all shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]"
					value={playerName}
					onChange={(e) => setPlayerName(e.target.value)}
				/>

				{/* Liste des Rooms (Style Plaques Cuivrées) */}
				<div className="flex flex-col gap-3 mb-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
				  {openRooms.length > 0 ? (
					  openRooms.map((r) => (
						  <button
							  key={r.roomId}
							  onClick={() => playerName ? joinRoom(r.roomId, playerName) : alert("Entre un pseudo d'abord !")}
							  className="relative overflow-hidden flex justify-between items-center p-4 bg-gradient-to-b from-[#3b3127] to-[#221c16] border-2 border-[#8a6842] rounded-xl hover:border-[#c9a56d] hover:brightness-110 active:brightness-90 transition-all group text-left"
						  >
							<div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />
							<span className="font-serif tracking-widest text-[#c9a56d] font-bold text-lg drop-shadow-md relative z-10">{r.roomId}</span>
							<span className="text-xs font-serif tracking-widest text-[#b08a57] uppercase bg-[#1a1510] px-3 py-1.5 rounded-lg border border-[#5a4b3c] shadow-inner relative z-10">
                              {r.playerCount}/8 <span className="hidden sm:inline">Joueurs</span>
                            </span>
						  </button>
					  ))
				  ) : (
					  <div className="p-6 border-2 border-dashed border-[#5a4b3c] rounded-xl bg-[#1a1510]/50 text-center">
						<p className="text-[#b08a57] font-serif italic text-sm tracking-widest uppercase">Aucune room ouverte</p>
					  </div>
				  )}
				</div>

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
