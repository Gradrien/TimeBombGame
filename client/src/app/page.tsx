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
  const { initSocket, gameState, isAnimatingCut, playerName, playerId, startGame } = useGameStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // "Rejouer" est individuel : dès qu'un joueur a cliqué, il rejoint le lobby
  // (et y attend les autres) pendant que la partie reste FINISHED pour ceux qui
  // sont toujours sur l'écran de fin.
  const iReturnedToLobby =
      gameState?.status === 'FINISHED' && (gameState.restartReady ?? []).includes(playerId);
  const showLobby = gameState?.status === 'LOBBY' || iReturnedToLobby;

  return (
      <>
        <SettingsMenu />

        {!gameState && (
            <HomeView />
        )}

        {gameState && showLobby && (
            <LobbyView
                gameState={gameState}
                playerName={playerName}
                onStart={() => startGame(gameState.roomId)}
            />
        )}

        {(gameState?.status === 'PLAYING' || gameState?.status === 'FINISHED') && !showLobby && (
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
