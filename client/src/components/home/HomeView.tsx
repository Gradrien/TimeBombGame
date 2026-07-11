import {useState} from 'react';
import Image from 'next/image';
import {useGameStore} from '@/store/useGameStore';
import {ProfileView} from '@/components/profile/ProfileView';
import {LoginView} from './LoginView';
import {MainMenuView} from './MainMenuView';
import {JoinRoomView} from './JoinRoomView';
import {Stripes} from '@/components/ui';
import type {HomeViewState} from './types';

export function HomeView() {
  const {playerId, error} = useGameStore();

  const [view, setView] = useState<HomeViewState>(playerId ? 'MAIN' : 'LOGIN');
  const [localError, setLocalError] = useState<string | null>(null);

  // Login/logout elsewhere (e.g. session restore) must move this screen too:
  // adjust state during render instead of syncing through an effect.
  const [prevPlayerId, setPrevPlayerId] = useState(playerId);
  if (playerId !== prevPlayerId) {
    setPrevPlayerId(playerId);
    setView(playerId ? 'MAIN' : 'LOGIN');
  }

  const displayError = localError || error;

  const getContainerWidth = () => {
    if (view === 'PROFILE') return 'max-w-7xl';
    if (view === 'MAIN') return 'max-w-sm landscape:max-w-3xl';
    return 'max-w-sm'; // LOGIN and JOIN stay narrow
  };

  return (
      <main className="flex min-h-screen flex-col items-center justify-center text-white p-6 relative overflow-hidden">
        <div className="fixed inset-0 bg-black/40 -z-10 pointer-events-none" />

        {view !== 'PROFILE' && (
            <div className="relative w-full max-w-70 sm:max-w-105 aspect-3/1 z-10 mb-8 sm:mb-12">
              <Image src="/assets/game-title.png" alt="Time Bomb" fill className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]" priority />
            </div>
        )}

        <div className={`flex flex-col gap-5 w-full z-10 ${getContainerWidth()}`}>

          {displayError && (
              <div
                  className="relative overflow-hidden bg-gradient-to-b from-rust to-rust-deep border-2 border-copper text-parchment px-4 py-3 rounded-xl text-sm text-center font-bold shadow-2xl">
                <Stripes className="opacity-20"/>
                <span
                    className="relative z-10 tracking-wide font-serif uppercase text-xs sm:text-sm">{displayError}</span>
              </div>
          )}

          {view === 'LOGIN' && <LoginView onLoginSuccess={() => setView('MAIN')} onError={setLocalError} />}
          {view === 'MAIN' && <MainMenuView onNavigate={setView} />}
          {view === 'JOIN' && <JoinRoomView onBack={() => setView('MAIN')} />}
          {view === 'PROFILE' && <ProfileView onBack={() => setView('MAIN')} />}

        </div>
      </main>
  );
}
