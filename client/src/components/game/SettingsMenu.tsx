'use client';

import {useState, useEffect, useRef} from 'react';
import {useGameStore} from '@/store/useGameStore';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const {gameState, playerId, voteSurrender, setReviewingCards, setReviewingRole} = useGameStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullScreen = () => {
    // WebKit-prefixed variants (Safari iOS) are missing from the standard DOM types.
    const docEl = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    const doc = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (docEl.requestFullscreen) docEl.requestFullscreen();
      else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    }
    setIsOpen(false);
  };

  const handleSurrenderVote = () => {
    if (gameState) voteSurrender(gameState.roomId);
  };

  const hasVoted = gameState?.surrenderVotes?.includes(playerId);
  const currentVotes = gameState?.surrenderVotes?.length || 0;
  const requiredVotes = gameState ? Math.floor(gameState.players.length / 2) + 1 : 0;

  return (
      <div className="fixed top-4 right-4 z-50" ref={menuRef}>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-xl bg-ink/40 backdrop-blur-md border border-gold/30 text-gold hover:text-cream hover:bg-ink/60 shadow-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isOpen ? 'rotate-90' : ''} transition-transform duration-300`}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>

        {isOpen && (
            <div className="absolute z-[9999] right-0 mt-3 w-64 bg-ink/95 backdrop-blur-md border border-bronze/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-serif uppercase tracking-wide text-sm animate-menu-in">
              <button onClick={toggleFullScreen} className="px-5 py-4 text-left text-cream hover:bg-bronze/30 hover:text-gold transition-colors border-b border-bronze/20">
                Plein écran
              </button>

              {gameState?.status === 'PLAYING' && (
                  <>
                    <button onClick={() => { setReviewingRole(true); setIsOpen(false); }} className="px-5 py-4 text-left text-cream hover:bg-bronze/30 hover:text-gold transition-colors border-b border-bronze/20">
                      Revoir mon rôle
                    </button>
                    <button onClick={() => { setReviewingCards(true); setIsOpen(false); }} className="px-5 py-4 text-left text-cream hover:bg-bronze/30 hover:text-gold transition-colors border-b border-bronze/20">
                      Revoir mes câbles
                    </button>

                    {/* Surrender vote */}
                    <div className="px-5 py-4 flex flex-col gap-2">
                      <button
                          onClick={handleSurrenderVote}
                          disabled={hasVoted}
                          className={`py-2 px-3 text-center rounded-lg border transition-colors ${hasVoted ? 'bg-red-900/50 border-red-900/50 text-red-200 cursor-not-allowed' : 'bg-red-900/20 border-red-700/50 text-red-400 hover:bg-red-900/40 hover:text-red-300'}`}
                      >
                        {hasVoted ? 'VOTE ENREGISTRÉ' : "VOTER L'ANNULATION"}
                      </button>
                      {currentVotes > 0 && (
                          <p className="text-xs text-red-400 text-center font-bold">
                            Votes pour annuler : {currentVotes} / {requiredVotes}
                          </p>
                      )}
                    </div>
                  </>
              )}
            </div>
        )}
      </div>
  );
}
