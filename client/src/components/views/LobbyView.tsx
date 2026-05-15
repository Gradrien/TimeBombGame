// client/src/components/LobbyView.tsx
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import type {LobbyViewProps} from "@/types/views";

export function LobbyView({gameState, playerName, onStart}: LobbyViewProps) {
  const {toggleLoupeMode, leaveRoom} = useGameStore();
  const isHost = gameState.players.find((p) => p.name === playerName)?.isHost;
  const canStart = gameState.players.length >= 4 && gameState.players.length <= 8;
  const canUseLoupe = gameState.players.length >= 5;

  return (
	  <main className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-4 relative overflow-hidden">
		<h2 className="text-3xl font-bold mb-2 tracking-wide drop-shadow-md font-serif text-[#f3e7d3]">ROOM {gameState.roomId}</h2>
		<p className="mb-10 font-serif tracking-wide text-[#f3e7d3]">En attente de joueurs... ({gameState.players.length}/8)</p>

		{/* Encadré Paramètres (Loupe) - Mode "Clear Glass" */}
		<div className="relative mb-8 w-full max-w-sm bg-[#1a1510]/40 backdrop-blur-md p-6 rounded-2xl border border-[#c9a56d]/30 shadow-2xl flex flex-col gap-4 z-10 overflow-hidden">
		  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />

		  <div className="flex items-center justify-between relative z-10">
            <span className="font-serif tracking-wide text-sm text-[#f3e7d3] uppercase drop-shadow-md font-bold">
              Extension Loupe
            </span>

			{/* Toggle Steampunk allégé */}
			{isHost ? (
				<label className={`relative inline-flex items-center ${canUseLoupe ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 saturate-0'}`}>
				  <input
					  type="checkbox"
					  className="sr-only"
					  checked={!!gameState.isLoupeModeEnabled}
					  disabled={!canUseLoupe}
					  onChange={(e) => toggleLoupeMode(gameState.roomId, e.target.checked)}
				  />
				  {/* Piste (Fond) */}
				  <div className={`w-14 h-7 rounded-full shadow-inner transition-colors duration-500 relative border ${gameState.isLoupeModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50' : 'bg-black/60 border-[#8a6842]/60'}`}>
					{/* Bouton (Levier) */}
					<div className={`absolute top-0.5 left-0.5 bg-linear-to-b from-[#f3e7d3] via-[#c9a56d] to-[#b08a57] border border-[#f3e7d3]/40 rounded-full h-5 w-5 transition-transform duration-500 shadow-md ${gameState.isLoupeModeEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
				  </div>
				</label>
			) : (
				<span className={`font-serif text-xs sm:text-xs font-bold px-3 py-1.5 rounded-lg border shadow-inner tracking-wide uppercase ${gameState.isLoupeModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50 text-[#60a5fa]' : 'bg-black/40 border-[#8a6842]/60 text-[#b08a57]'}`}>
                  {gameState.isLoupeModeEnabled ? 'Activé' : 'Désactivé'}
                </span>
			)}
		  </div>

		  {!canUseLoupe && isHost && (
			  <p className="text-sm text-[#b08a57] font-serif italic tracking-wide uppercase text-center relative z-10">
				(Nécessite 5 joueurs minimum)
			  </p>
		  )}
		</div>

		{/* Liste des Joueurs - Mode "Clear Glass" */}
		<ul className="mb-12 w-full max-w-sm space-y-3 z-10">
		  {gameState.players.map((p) => (
			  <li key={p.id} className="relative p-4 bg-[#1a1510]/60 backdrop-blur-sm rounded-xl flex justify-between items-center border border-[#8a6842]/50 shadow-lg group overflow-hidden">
				<div className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />
				<span className="font-serif tracking-wide text-[#f3e7d3] font-bold drop-shadow-sm flex items-center relative z-10">
                  {p.name}
				  {p.name === playerName && <span className="text-[#c9a56d] text-sm ml-2 italic tracking-wide">(Toi)</span>}
                </span>

				{p.isHost && (
					<span className="text-xs bg-black/40 border border-[#c9a56d]/50 px-3 py-1.5 rounded-lg text-[#c9a56d] font-bold uppercase tracking-wide shadow-inner relative z-10">
                      Hôte
                    </span>
				)}
			  </li>
		  ))}
		</ul>

		<div className="flex flex-col gap-4 w-full max-w-xs z-10">
		  {isHost && (
			  <SteampunkButton variant="sherlock" size="lg" onClick={onStart} disabled={!canStart}>
				{canStart ? 'Lancer la partie' : '4 à 8 joueurs requis'}
			  </SteampunkButton>
		  )}
		  <SteampunkButton variant="moriarty" size="lg" onClick={() => leaveRoom(gameState.roomId)}>
			Quitter le lobby
		  </SteampunkButton>
		</div>
	  </main>
  );
}
