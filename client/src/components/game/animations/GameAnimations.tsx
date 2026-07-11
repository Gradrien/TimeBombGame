import {useState, useEffect, useRef} from 'react';
import {AnimatePresence} from 'framer-motion';
import {useGameStore} from '@/store/useGameStore';
import {CardCutAnimation} from './CardCutAnimation';
import {LastCutWarningAnimation} from './LastCutWarningAnimation';
import {LoupeResultAnimation} from './LoupeResultAnimation';
import type {CutRevealData} from './types';

/**
 * Orchestrates the fullscreen game overlays. Watches the revealed-card count
 * to detect cuts and schedules the display windows; the overlays themselves
 * are pure presentational components.
 */
export function GameAnimations() {
  const {gameState, socket, loupeAnimation} = useGameStore();

  const [lastCutData, setLastCutData] = useState<CutRevealData | null>(null);
  const [showLastCutWarning, setShowLastCutWarning] = useState(false);

  const prevCount = useRef(gameState?.revealedCards?.length || 0);

  useEffect(() => {
    if (!gameState || !gameState.revealedCards) return;

    const currentCount = gameState.revealedCards.length;

    if (currentCount > prevCount.current) {
      const newCard = gameState.revealedCards[currentCount - 1];
      const isLastCutNext = gameState.cardsRevealedThisRound === gameState.players.length - 1;
      const isFinished = gameState.status === 'FINISHED';
      const isBomb = newCard.type === 'BOMB';

      // The player whose card was just cut is the one now holding the clippers.
      const targetPlayer = gameState.players.find(p => p.id === gameState.playerWithClippers);

      setLastCutData({
        card: newCard,
        ownerName: targetPlayer?.name || 'inconnu'
      });

      // The bomb stays on screen twice as long as a regular card.
      const displayDuration = isBomb ? 5000 : 2500;

      let warningTimer: NodeJS.Timeout;
      const hideTimer = setTimeout(() => {
        setLastCutData(null);

        // Only warn about the last cut if the game is not already over.
        if (!isFinished && isLastCutNext) {
          setShowLastCutWarning(true);
          warningTimer = setTimeout(() => setShowLastCutWarning(false), 2500);
        }
      }, displayDuration);

      prevCount.current = currentCount;

      return () => {
        clearTimeout(hideTimer);
        if (warningTimer) clearTimeout(warningTimer);
      };
    }

    prevCount.current = currentCount;
    // Deliberately depends only on the revealed count: every server update
    // creates new object references that must not restart the timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.revealedCards?.length]);

  if (!gameState || !socket) return null;

  return (
      <AnimatePresence mode="wait">
        {lastCutData && (
            <CardCutAnimation key="card-cut-anim" data={lastCutData}/>
        )}

        {showLastCutWarning && (
            <LastCutWarningAnimation key="last-cut-anim"/>
        )}

        {loupeAnimation && (
            <LoupeResultAnimation
                key="loupe-anim"
                success={loupeAnimation.success}
                targetName={loupeAnimation.targetName}
            />
        )}
      </AnimatePresence>
  );
}
