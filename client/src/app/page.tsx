'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { GameBoard } from '@/components/GameBoard';
import { PhaseView } from '@/components/views/PhaseView';
import { HomeView } from '@/components/views/HomeView';
import { LobbyView } from '@/components/views/LobbyView';
import { EndView } from '@/components/EndView';
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
