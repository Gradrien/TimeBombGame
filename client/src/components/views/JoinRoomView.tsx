// client/src/components/JoinRoomView.tsx
import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import type {JoinRoomViewProps} from "@/types/views";


export function JoinRoomView({ onBack }: JoinRoomViewProps) {
  const { playerName, joinRoom, openRooms, fetchOpenRooms } = useGameStore();

  // Ce useEffect est maintenant isolé ici : il ne se déclenchera que lorsque ce composant est monté !
  useEffect(() => {
	fetchOpenRooms();
  }, [fetchOpenRooms]);

  return (
	  <div className="flex flex-col gap-4">
		<div className="flex flex-col gap-3 mb-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
		  {openRooms.length > 0 ? (
			  openRooms.map((r) => (
				  <button
					  key={r.roomId}
					  onClick={() => joinRoom(r.roomId, playerName)}
					  className="relative overflow-hidden flex justify-between items-center p-4 bg-[#1a1510]/60 backdrop-blur-sm border border-[#8a6842]/50 rounded-xl hover:border-[#c9a56d] transition-all text-left shadow-lg group"
				  >
					<div className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />
					<span className="font-serif tracking-wide text-[#f3e7d3] font-bold text-xl relative z-10 uppercase">{r.roomId}</span>
					<span className="text-xs font-serif tracking-wide text-[#b08a57] uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-[#5a4b3c] relative z-10 shadow-inner">
                {r.playerCount}/8 Joueurs
              </span>
				  </button>
			  ))
		  ) : (
			  <div className="p-8 border border-dashed border-[#8a6842]/50 rounded-xl bg-[#1a1510]/30 backdrop-blur-sm text-center">
				<p className="text-[#b08a57] font-serif text-sm tracking-wide uppercase">Aucun lobby détecté</p>
			  </div>
		  )}
		</div>

		<SteampunkButton variant="neutral" size="md" onClick={onBack}>
		  Retour
		</SteampunkButton>
	  </div>
  );
}
