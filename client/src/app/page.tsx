// client/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { GameBoard } from '@/components/GameBoard';
import { PhaseView } from '@/components/PhaseView';
import { HomeView } from '@/components/HomeView';
import { LobbyView } from '@/components/LobbyView';
import { EndView } from '@/components/EndView';
import { FullScreenToggle } from '@/components/FullScreenToggle';
import {SettingsMenu} from "@/components/SettingsMenu";

export default function Home() {
  const { initSocket, gameState, isAnimatingCut, playerName, startGame } = useGameStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
      <>
        <SettingsMenu />

        {!gameState && (
            <HomeView />
        )}

        {gameState?.status === 'LOBBY' && (
            <LobbyView
                gameState={gameState}
                playerName={playerName}
                onStart={() => startGame(gameState.roomId)}
            />
        )}

        {(gameState?.status === 'PLAYING' || gameState?.status === 'FINISHED') && (
            <>
              {isAnimatingCut ? (
                  <GameBoard />
              ) : gameState.status === 'FINISHED' ? (
                  <EndView />
              ) : (gameState.phase === 'ROLE_REVEAL' || gameState.phase === 'CARD_REVEAL') ? (
                  <PhaseView />
              ) : (
                  <GameBoard />
              )}
            </>
        )}
      </>
  );
}
