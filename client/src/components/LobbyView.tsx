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
  const {toggleLoupeMode} = useGameStore();
  const isHost = gameState.players.find((p) => p.name === playerName)?.isHost;
  const canStart = gameState.players.length >= 4 && gameState.players.length <= 8;
  const canUseLoupe = gameState.players.length >= 5;

  return (
	  <main className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-4">
		<h2 className="text-3xl font-bold mb-2 tracking-widest drop-shadow-md">ROOM {gameState.roomId}</h2>
		<p className="mb-10  font-medium tracking-wide">En attente de joueurs... ({gameState.players.length}/8)</p>

		<div
			className="mb-8 w-full max-w-xs bg-zinc-900/80 p-4 rounded-lg border border-zinc-700 shadow-md flex flex-col gap-2">
		  <div className="flex items-center justify-between">
			<span className="font-medium text-sm text-zinc-200">Extension Loupe 🔍</span>
			{isHost ? (
				<label
					className={`relative inline-flex items-center ${canUseLoupe ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
				  <input
					  type="checkbox"
					  className="sr-only peer"
					  checked={!!gameState.isLoupeModeEnabled}
					  disabled={!canUseLoupe}
					  onChange={(e) => toggleLoupeMode(gameState.roomId, e.target.checked)}
				  />
				  <div
					  className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
				</label>
			) : (
				<span
					className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider ${gameState.isLoupeModeEnabled ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'}`}>
                {gameState.isLoupeModeEnabled ? 'Activé' : 'Désactivé'}
              </span>
			)}
		  </div>
		  {!canUseLoupe && isHost &&
              <p className="text-[10px] text-zinc-500 italic text-center mt-1">Nécessite 5 joueurs minimum.</p>}
		</div>

		<ul className="mb-12 w-full max-w-xs space-y-3">
		  {gameState.players.map((p) => (
			  <li key={p.id}
				  className="p-4 bg-zinc-900/80 rounded-lg flex justify-between items-center border border-zinc-700 shadow-md">
				<span className="font-medium">{p.name} {p.name === playerName &&
                    <span className="text-zinc-500 text-sm ml-1">(Toi)</span>}</span>
				{p.isHost && <span
                    className="text-xs bg-zinc-200 px-2 py-1 rounded text-black font-bold uppercase tracking-wider shadow-sm">Hôte</span>}
			  </li>
		  ))}
		</ul>

		{isHost ? (
			<SteampunkButton variant="neutral" size="lg"
							 onClick={onStart} disabled={!canStart}
			>
			  {canStart ? 'Lancer la partie' : '4 à 8 joueurs requis'}
			</SteampunkButton>

		) : (
			<p className="text-zinc-0 animate-pulse font-bold tracking-widest uppercase text-sm">En attente de
			  l'hôte...</p>
		)}
	  </main>
  );
}
