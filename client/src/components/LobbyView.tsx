// client/src/components/LobbyView.tsx
import {GameState} from '@timebomb/shared';
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";

interface Props {
  gameState: GameState;
  playerName: string;
  onStart: () => void;
}

export function LobbyView({gameState, playerName, onStart}: Props) {
  const {toggleLoupeMode, leaveRoom} = useGameStore();
  const isHost = gameState.players.find((p) => p.name === playerName)?.isHost;
  const canStart = gameState.players.length >= 4 && gameState.players.length <= 8;
  const canUseLoupe = gameState.players.length >= 5;

  return (
	  <main className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-4">
		<h2 className="text-3xl font-bold mb-2 tracking-widest drop-shadow-md">ROOM {gameState.roomId}</h2>
		<p className="mb-10  font-medium tracking-wide">En attente de joueurs... ({gameState.players.length}/8)</p>

		{/* Encadré Paramètres (Loupe) */}
		<div className="relative mb-8 w-full max-w-sm bg-gradient-to-b from-[#3b3127] to-[#221c16] p-5 rounded-2xl border-[3px] border-[#8a6842] shadow-[0_10px_25px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] flex flex-col gap-3 z-10">
		  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />

		  <div className="flex items-center justify-between relative z-10">
            <span className="font-serif tracking-widest text-sm text-[#e8e2d8] uppercase drop-shadow-md">
              Extension Loupe 🔍
            </span>

			{/* Toggle Steampunk Custom */}
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
				  <div className={`w-14 h-7 rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)] transition-colors duration-500 relative border ${gameState.isLoupeModeEnabled ? 'bg-[#1d4463] border-[#c9a56d]/50' : 'bg-[#1a1510] border-[#5a4b3c]'}`}>

					{/* Bouton (Levier) - Utilisation directe de l'état pour le translate */}
					<div className={`absolute top-[2px] left-[2px] bg-gradient-to-b from-[#f3e7d3] via-[#c9a56d] to-[#b08a57] border border-[#f3e7d3]/40 rounded-full h-5 w-5 transition-transform duration-500 shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.8)] ${gameState.isLoupeModeEnabled ? 'translate-x-8' : 'translate-x-0'}`} />

				  </div>
				</label>
			) : (
				<span className={`font-serif text-xs font-black px-3 py-1.5 rounded-lg border shadow-inner tracking-widest uppercase ${gameState.isLoupeModeEnabled ? 'bg-[#1d4463] border-[#c9a56d]/50 text-[#c9a56d]' : 'bg-[#1a1510] border-[#5a4b3c] text-[#8a6842]'}`}>
                  {gameState.isLoupeModeEnabled ? 'Activé' : 'Désactivé'}
                </span>
			)}
		  </div>

		  {!canUseLoupe && isHost && (
			  <p className="text-xs text-[#b08a57] font-serif italic tracking-widest uppercase text-center mt-1 relative z-10">
				(Nécessite 5 joueurs minimum)
			  </p>
		  )}
		</div>

		{/* Liste des Joueurs */}
		<ul className="mb-12 w-full max-w-sm space-y-3 z-10">
		  {gameState.players.map((p) => (
			  <li key={p.id} className="relative p-4 bg-gradient-to-b from-[#3b3127] to-[#221c16] rounded-xl flex justify-between items-center border-2 border-[#5a4b3c] shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                <span className="font-serif tracking-widest text-[#e8e2d8] uppercase drop-shadow-sm flex items-center">
                  {p.name}
				  {p.name === playerName && <span className="text-[#b08a57] text-xs ml-2 italic tracking-widest">(Toi)</span>}
                </span>

				{p.isHost && (
					<span className="text-xs bg-gradient-to-b from-[#c9a56d] to-[#b08a57] border border-[#f3e7d3]/30 px-3 py-1 rounded text-[#2a080d] font-black uppercase tracking-widest shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      Hôte
                    </span>
				)}
			  </li>
		  ))}
		</ul>

		<div
			className="flex flex-col gap-4 w-full max-w-xs">
		  {isHost && (
			  <SteampunkButton variant="sherlock" size="lg"
							   onClick={onStart} disabled={!canStart}
			  >
				{canStart ? 'Lancer la partie' : '4 à 8 joueurs requis'}
			  </SteampunkButton>

		  )}
		  <SteampunkButton variant="moriarty" size="lg"
						   onClick={() => leaveRoom(gameState.roomId)}
		  >
			Quitter le lobby
		  </SteampunkButton>
		</div>
	  </main>
  )
	  ;
}
