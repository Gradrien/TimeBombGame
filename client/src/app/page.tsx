'use client';

import {useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';
import {HomeView} from '@/components/home/HomeView';
import {LobbyView} from '@/components/lobby/LobbyView';
import {PhaseView} from '@/components/phase/PhaseView';
import {GameBoard} from '@/components/game/GameBoard';
import {SettingsMenu} from '@/components/game/SettingsMenu';
import {EndView} from '@/components/end/EndView';

export default function Home() {
  const {initSocket, gameState, isAnimatingCut, playerId, startGame} = useGameStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // "Rejouer" is individual: as soon as a player clicks it they join the lobby
  // (and wait for the others there) while the game stays FINISHED for those
  // still on the end screen.
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
