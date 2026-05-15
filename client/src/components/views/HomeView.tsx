// client/src/components/HomeView.tsx
import {useState, useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';
import Image from 'next/image';
import {ProfileView} from "@/components/views/ProfileView";
import {LoginView} from "@/components/views/LoginView";
import {MainMenuView} from "@/components/views/MainMenuView";
import {JoinRoomView} from "@/components/views/JoinRoomView";
import type {ViewState} from "@/types/views";


export function HomeView() {
  const {playerId, error} = useGameStore();

  const [view, setView] = useState<ViewState>('LOGIN');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
	if (playerId) setView('MAIN');
	else setView('LOGIN');
  }, [playerId]);

  const displayError = localError || error;

  return (
	  <main
		  className="flex min-h-screen flex-col items-center justify-center bg-black/40 text-white p-6 relative overflow-hidden">

		{/* 1. LOGO TIME BOMB */}
		{view !== 'PROFILE' && (
			<div className="relative w-full max-w-70 sm:max-w-105 aspect-3/1 z-10 mb-8 sm:mb-12">
			  <Image src="/assets/game-title.png" alt="Time Bomb" fill className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]" priority />
			</div>
		)}

		{/* 2. CONTENEUR CENTRAL DES ACTIONS */}
		<div className={`flex flex-col gap-5 w-full z-10 ${view === 'PROFILE' ? 'max-w-7xl' : 'max-w-sm'}`}>

		  {/* Affichage des Erreurs */}
		  {displayError && (
			  <div
				  className="relative overflow-hidden bg-gradient-to-b from-[#6e1d26] to-[#2a080d] border-2 border-[#b77b4a] text-[#f7d8b5] px-4 py-3 rounded-xl text-sm text-center font-bold shadow-2xl">
				<div className="absolute inset-0 opacity-20 pointer-events-none"
					 style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)"}}/>
				<span
					className="relative z-10 tracking-wide font-serif uppercase text-xs sm:text-sm">{displayError}</span>
			  </div>
		  )}

		  {/* AIGUILLAGE DES VUES */}
		  {view === 'LOGIN' && (
			  <LoginView
				  onLoginSuccess={() => setView('MAIN')}
				  onError={setLocalError}
			  />
		  )}

		  {view === 'MAIN' && (
			  <MainMenuView
				  onNavigate={setView}
			  />
		  )}

		  {view === 'JOIN' && (
			  <JoinRoomView
				  onBack={() => setView('MAIN')}
			  />
		  )}

		  {view === 'PROFILE' && (
			  <ProfileView
				  onBack={() => setView('MAIN')}
			  />
		  )}

		</div>
	  </main>
  );
}
