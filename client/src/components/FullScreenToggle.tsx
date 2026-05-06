// client/src/components/FullScreenToggle.tsx
'use client';

export function FullScreenToggle() {
  const toggleFullScreen = () => {
	if (!document.fullscreenElement) {
	  document.documentElement.requestFullscreen().catch((err) => {
		console.warn(`Erreur plein écran: ${err.message}`);
	  });
	} else {
	  document.exitFullscreen();
	}
  };

  return (
	  <div className="fixed top-4 right-4 z-[300]">
		<button
			onClick={toggleFullScreen}
			className="p-2.5 rounded-lg bg-black/40 border border-amber-900/30 text-zinc-400 hover:text-zinc-100 hover:border-amber-700/50 transition-all shadow-lg group backdrop-blur-sm"
			title="Mode Plein Écran"
		>
		  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-active:scale-90 transition-transform">
			<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
		  </svg>
		</button>
	  </div>
  );
}
