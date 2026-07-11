import {useState, useEffect} from 'react';
import {AnimatePresence} from 'framer-motion';
import {useGameStore} from '@/store/useGameStore';
import {getPlayerSkinIndex} from '@/utils/assets';
import {RoleReveal} from '@/components/phase/RoleReveal';
import {TopNavBar} from './TopNavBar';
import {GameStatsBar} from './GameStatsBar';
import {GamePlayArea} from './GamePlayArea';
import {GameAnimations} from './animations/GameAnimations';

export function GameBoard() {
  const {gameState, socket, cutCard, playerId, isReviewingRole, setReviewingRole} = useGameStore();
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);

  // Local state recreating the "card back → character" flip during role review.
  const [reviewRevealed, setReviewRevealed] = useState(false);

  // Put the card face down again once the review overlay is closed.
  useEffect(() => {
    if (!isReviewingRole) {
      setTimeout(() => setReviewRevealed(false), 300);
    }
  }, [isReviewingRole]);

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

  const mySkinIndex = getPlayerSkinIndex(gameState.players, playerId);

  return (
      <div className="flex flex-col h-screen w-full text-white overflow-hidden select-none bg-black/40">
        <TopNavBar
            me={me} opponents={opponents}
            viewedPlayerId={viewedPlayerId} setViewedPlayerId={setViewedPlayerId}
            playerWithClippers={gameState.playerWithClippers}
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

        {/* Role review overlay ("Revoir mon rôle" in the settings menu) */}
        <AnimatePresence>
          {isReviewingRole && (
              <RoleReveal
                  role={me.role || 'SHERLOCK'}
                  revealed={reviewRevealed}
                  isConfirming={false}
                  skinIndex={mySkinIndex}
                  onReveal={() => setReviewRevealed(true)}
                  onConfirm={() => setReviewingRole(false)}
              />
          )}
        </AnimatePresence>
      </div>
  );
}
