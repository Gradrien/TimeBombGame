import {useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';
import {Button, Stripes} from '@/components/ui';
import {MAX_PLAYERS} from '@timebomb/shared';
import type {JoinRoomViewProps} from './types';

export function JoinRoomView({onBack}: JoinRoomViewProps) {
  const {joinRoom, openRooms, fetchOpenRooms} = useGameStore();

  useEffect(() => {
    fetchOpenRooms();
  }, [fetchOpenRooms]);

  return (
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        <div className="flex flex-col gap-3 mb-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {openRooms.length > 0 ? (
              openRooms.map((r) => (
                  <button
                      key={r.roomId}
                      onClick={() => joinRoom(r.roomId)}
                      className="relative overflow-hidden flex justify-between items-center p-4 bg-ink/60 backdrop-blur-sm border border-bronze/50 rounded-xl hover:border-gold transition-all text-left shadow-lg group"
                  >
                    <Stripes className="opacity-10 group-hover:opacity-20"/>
                    <span className="font-serif tracking-wide text-cream font-bold text-xl relative z-10 uppercase">{r.roomId}</span>
                    <span className="text-xs font-serif tracking-wide text-brass uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-bronze-dark relative z-10 shadow-inner">
                {r.playerCount}/{MAX_PLAYERS} Joueurs
              </span>
                  </button>
              ))
          ) : (
              <div className="p-8 border border-dashed border-bronze/50 rounded-xl bg-ink/30 backdrop-blur-sm text-center">
                <p className="text-brass font-serif text-sm tracking-wide uppercase">Aucun lobby détecté</p>
              </div>
          )}
        </div>

        <Button variant="neutral" size="md" onClick={onBack}>
          Retour
        </Button>
      </div>
  );
}
