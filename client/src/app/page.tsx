// client/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { GameBoard } from '@/components/GameBoard';
import { PhaseView } from '@/components/PhaseView';
import { HomeView } from '@/components/HomeView';
import { LobbyView } from '@/components/LobbyView';
import { EndView } from '@/components/EndView';
import { FullScreenToggle } from '@/components/FullScreenToggle';

export default function Home() {
  const { initSocket, gameState, isAnimatingCut, playerName, setPlayerName, joinRoom, startGame } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
      <>
        <FullScreenToggle />

        {!gameState && (
            <HomeView
                playerName={playerName}
                setPlayerName={setPlayerName}
                roomIdInput={roomIdInput}
                setRoomIdInput={setRoomIdInput}
                onJoin={() => joinRoom(roomIdInput, playerName)}
            />
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
