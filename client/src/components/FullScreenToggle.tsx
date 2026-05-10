// client/src/components/FullScreenToggle.tsx
'use client';
import { useState, useEffect } from 'react';

export function FullScreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
	const handleFullscreenChange = () => {
	  setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
	};
	document.addEventListener('fullscreenchange', handleFullscreenChange);
	document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
	return () => {
	  document.removeEventListener('fullscreenchange', handleFullscreenChange);
	  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
	};
  }, []);

  const toggleFullScreen = () => {
	const docEl = document.documentElement as any;
	const doc = document as any;

	if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
	  if (docEl.requestFullscreen) {
		docEl.requestFullscreen();
	  } else if (docEl.webkitRequestFullscreen) {
		docEl.webkitRequestFullscreen(); // Support Safari/Chrome iOS
	  }
	} else {
	  if (doc.exitFullscreen) {
		doc.exitFullscreen();
	  } else if (doc.webkitExitFullscreen) {
		doc.webkitExitFullscreen();
	  }
	}
  };

  // Sur iPhone, si ce n'est pas supporté, on peut afficher un message d'aide
  // ou simplement cacher le bouton s'il ne fonctionnera pas.
  return (
	  <div className="fixed top-4 right-4 z-[9999]">
		<button
			onClick={toggleFullScreen}
			className="p-2.5 rounded-lg bg-black/40 border border-amber-900/30 text-amber-500/70 hover:text-amber-400 shadow-lg backdrop-blur-md"
		>
		  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			{isFullscreen ? (
				<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
			) : (
				<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
			)}
		  </svg>
		</button>
	  </div>
  );
}
