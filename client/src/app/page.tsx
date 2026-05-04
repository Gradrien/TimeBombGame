// client/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { GameBoard } from '@/components/GameBoard';
export default function Home() {
  const { initSocket, gameState, playerName, setPlayerName, joinRoom, startGame } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');

  // Initialise la connexion Socket au montage du composant
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // VUE 1 : ACCUEIL (Rejoindre / Créer)
  if (!gameState) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white p-4">
          <h1 className="text-4xl font-bold mb-8 text-amber-500">TIME BOMB</h1>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <input
                type="text"
                placeholder="Ton pseudo"
                className="p-2 rounded bg-zinc-800 border border-zinc-700"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Code de la room"
                className="p-2 rounded bg-zinc-800 border border-zinc-700 uppercase"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            />
            <button
                onClick={() => joinRoom(roomIdInput, playerName)}
                disabled={!playerName || !roomIdInput}
                className="bg-amber-600 hover:bg-amber-500 p-2 rounded font-bold disabled:opacity-50"
            >
              Rejoindre / Créer la Room
            </button>
          </div>
        </main>
    );
  }

  // VUE 2 : LE LOBBY (Salle d'attente)
  if (gameState.status === 'LOBBY') {
    const isHost = gameState.players.find((p) => p.name === playerName)?.isHost;
    const canStart = gameState.players.length >= 4 && gameState.players.length <= 8;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white p-4">
          <h2 className="text-2xl font-bold mb-2">Room: {gameState.roomId}</h2>
          <p className="mb-8 text-zinc-400">En attente de joueurs... ({gameState.players.length}/8)</p>

          <ul className="mb-8 w-full max-w-xs space-y-2">
            {gameState.players.map((p) => (
                <li key={p.id} className="p-3 bg-zinc-800 rounded flex justify-between items-center border border-zinc-700">
                  <span>{p.name} {p.name === playerName && '(Toi)'}</span>
                  {p.isHost && <span className="text-xs bg-amber-600 px-2 py-1 rounded">Hôte</span>}
                </li>
            ))}
          </ul>

          {isHost ? (
              <button
                  onClick={() => startGame(gameState.roomId)}
                  disabled={!canStart}
                  className="bg-green-600 hover:bg-green-500 p-3 rounded font-bold w-full max-w-xs disabled:opacity-50"
              >
                {canStart ? 'Lancer la partie !' : 'Il faut entre 4 et 8 joueurs'}
              </button>
          ) : (
              <p className="text-amber-500 animate-pulse">En attente de l'hôte pour lancer...</p>
          )}
        </main>
    );
  }

  // VUE 3 : LE JEU (Placeholder pour le moment)
  if (gameState.status === 'PLAYING' || gameState.status === 'FINISHED') {
    return <GameBoard />;
  }

  return null;
}
