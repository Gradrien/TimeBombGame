// client/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { GameBoard } from '@/components/GameBoard';
import { PhaseView } from '@/components/PhaseView';
import { HomeView } from '@/components/HomeView';
import { LobbyView } from '@/components/LobbyView';
import { EndView } from '@/components/EndView'; // NOUVEL IMPORT !

export default function Home() {
  const { initSocket, gameState, isAnimatingCut, playerName, setPlayerName, joinRoom, startGame } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  if (!gameState) {
    return <HomeView playerName={playerName} setPlayerName={setPlayerName} roomIdInput={roomIdInput} setRoomIdInput={setRoomIdInput} onJoin={() => joinRoom(roomIdInput, playerName)} />;
  }

  if (gameState.status === 'LOBBY') {
    return <LobbyView gameState={gameState} playerName={playerName} onStart={() => startGame(gameState.roomId)} />;
  }

  if (gameState.status === 'PLAYING' || gameState.status === 'FINISHED') {

    if (isAnimatingCut) {
      return <GameBoard />;
    }

    if (gameState.status === 'FINISHED') {
      return <EndView />;
    }

    if (gameState.phase === 'ROLE_REVEAL' || gameState.phase === 'CARD_REVEAL') {
      return <PhaseView />;
    }

    return <GameBoard />;
  }

  return null;
}
