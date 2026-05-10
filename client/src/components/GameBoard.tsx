// client/src/components/GameBoard.tsx
import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { TopNavBar } from './TopNavBar';
import { GameStatsBar } from './GameStatsBar';
import { GamePlayArea } from './GamePlayArea';
import { GameAnimations } from './GameAnimations';

export function GameBoard() {
  const { gameState, socket, cutCard, playerId } = useGameStore();
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);

  if (!gameState || !socket) return null;

  const me = gameState.players.find((p) => p.id === playerId);
  const opponents = gameState.players.filter((p) => p.id !== playerId);
  const iHaveClippers = gameState.playerWithClippers === playerId;

  if (!me) return null;

  const viewedPlayer = viewedPlayerId ? gameState.players.find(p => p.id === viewedPlayerId) || me : me;
  const isViewingOpponent = viewedPlayer.id !== me.id;

  const handleCutCard = (cardId: string) => {
	cutCard(gameState.roomId, viewedPlayer.id, cardId);
	setTimeout(() => setViewedPlayerId(null), 500);
  };

  return (
	  <div className="flex flex-col h-screen w-full text-white overflow-hidden select-none bg-black/40">
		<TopNavBar
			me={me} opponents={opponents}
			viewedPlayerId={viewedPlayerId} setViewedPlayerId={setViewedPlayerId}
			playerWithClippers={gameState.playerWithClippers} iHaveClippers={iHaveClippers}
		/>

		<GameStatsBar
			currentRound={gameState.currentRound}
			totalPlayers={gameState.players.length}
			defusesFound={gameState.totalDefusesFound}
			defusesNeeded={gameState.totalDefusesNeeded}
			revealedCards={gameState.revealedCards}
		/>

		<GamePlayArea
			viewedPlayer={viewedPlayer}
			isViewingOpponent={isViewingOpponent}
			iHaveClippers={iHaveClippers}
			playerWithClippers={gameState.playerWithClippers}
			handleCutCard={handleCutCard}
			players={gameState.players}
		/>

		<GameAnimations />
	  </div>
  );
}
