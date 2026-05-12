// client/src/components/SettingsMenu.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { gameState, setReviewingCards } = useGameStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
	const handleClickOutside = (e: MouseEvent) => {
	  if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
	};
	document.addEventListener('mousedown', handleClickOutside);
	return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullScreen = () => {
	const docEl = document.documentElement as any;
	const doc = document as any;

	if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
	  if (docEl.requestFullscreen) docEl.requestFullscreen();
	  else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
	} else {
	  if (doc.exitFullscreen) doc.exitFullscreen();
	  else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
	}
	setIsOpen(false);
  };

  return (
	  <div className="fixed top-4 right-4 z-[9999]" ref={menuRef}>
		{/* BOUTON ROUE CRANTÉE */}
		<button
			onClick={() => setIsOpen(!isOpen)}
			className="p-2.5 rounded-lg bg-black/60 border border-amber-900/40 text-amber-500/70 hover:text-amber-400 shadow-lg backdrop-blur-md transition-colors"
		>
		  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isOpen ? 'rotate-90' : ''} transition-transform duration-300`}>
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>
		  </svg>
		</button>

		{/* MENU DÉROULANT */}
		{isOpen && (
			<div className="absolute right-0 mt-2 w-48 bg-zinc-950/95 backdrop-blur-md border border-amber-900/50 rounded-xl shadow-2xl overflow-hidden flex flex-col font-serif uppercase tracking-widest text-[10px] sm:text-xs animate-in slide-in-from-top-2 fade-in duration-200">
			  <button onClick={toggleFullScreen} className="px-4 py-4 text-left text-zinc-300 hover:bg-amber-900/40 hover:text-amber-400 transition-colors border-b border-white/5">
				Plein écran
			  </button>
			  {gameState?.status === 'PLAYING' && (
				  <button onClick={() => { setReviewingCards(true); setIsOpen(false); }} className="px-4 py-4 text-left text-zinc-300 hover:bg-amber-900/40 hover:text-amber-400 transition-colors">
					Revoir mes cartes
				  </button>
			  )}
			</div>
		)}
	  </div>
  );
}
