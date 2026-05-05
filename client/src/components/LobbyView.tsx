// client/src/components/LobbyView.tsx
import { GameState } from '@timebomb/shared';

interface Props {
  gameState: GameState;
  playerName: string;
  onStart: () => void;
}

export function LobbyView({ gameState, playerName, onStart }: Props) {
  const isHost = gameState.players.find((p) => p.name === playerName)?.isHost;
  const canStart = gameState.players.length >= 4 && gameState.players.length <= 8;

  return (
	  <main className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-4">
		<h2 className="text-3xl font-bold mb-2 tracking-widest drop-shadow-md">ROOM {gameState.roomId}</h2>
		<p className="mb-10  font-medium tracking-wide">En attente de joueurs... ({gameState.players.length}/8)</p>

		<ul className="mb-12 w-full max-w-xs space-y-3">
		  {gameState.players.map((p) => (
			  <li key={p.id} className="p-4 bg-zinc-900/80 rounded-lg flex justify-between items-center border border-zinc-700 shadow-md">
				<span className="font-medium">{p.name} {p.name === playerName && <span className="text-zinc-500 text-sm ml-1">(Toi)</span>}</span>
				{p.isHost && <span className="text-xs bg-zinc-200 px-2 py-1 rounded text-black font-bold uppercase tracking-wider shadow-sm">Hôte</span>}
			  </li>
		  ))}
		</ul>

		{isHost ? (
			<button onClick={onStart} disabled={!canStart} className="bg-zinc-100 hover:bg-white text-black p-4 rounded-lg font-bold w-full max-w-xs disabled:opacity-50 shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-sm">
			  {canStart ? 'Lancer la partie' : '4 à 8 joueurs requis'}
			</button>
		) : (
			<p className="text-zinc-0 animate-pulse font-bold tracking-widest uppercase text-sm">En attente de l'hôte...</p>
		)}
	  </main>
  );
}
