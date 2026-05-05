// client/src/components/HomeView.tsx
interface Props {
  playerName: string;
  setPlayerName: (name: string) => void;
  roomIdInput: string;
  setRoomIdInput: (id: string) => void;
  onJoin: () => void;
}

export function HomeView({ playerName, setPlayerName, roomIdInput, setRoomIdInput, onJoin }: Props) {
  return (
	  <main className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-4">
		<h1 className="text-5xl font-black mb-12 text-zinc-100 tracking-widest drop-shadow-lg uppercase">Time Bomb</h1>
		<div className="flex flex-col gap-6 w-full max-w-xs">
		  <input
			  type="text"
			  placeholder="Ton pseudo"
			  className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-600 focus:outline-none focus:border-zinc-300 transition-colors"
			  value={playerName}
			  onChange={(e) => setPlayerName(e.target.value)}
		  />
		  <input
			  type="text"
			  placeholder="Code de la room"
			  className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-600 focus:outline-none focus:border-zinc-300 transition-colors uppercase"
			  value={roomIdInput}
			  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
		  />
		  <button
			  onClick={onJoin}
			  disabled={!playerName || !roomIdInput}
			  className="bg-zinc-100 hover:bg-white text-black p-3 rounded-lg font-bold disabled:opacity-50 shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-sm mt-2"
		  >
			Rejoindre / Créer
		  </button>
		</div>
	  </main>
  );
}
