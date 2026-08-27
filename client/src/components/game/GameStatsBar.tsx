import Image from 'next/image';
import {Search} from 'lucide-react';
import {
  Card as CardModel,
  getRoleDistributionRange,
  isValidPlayerCount,
  LOUPE_LAST_USABLE_ROUND,
  RoleRange,
} from '@timebomb/shared';
import {getCardImage, getRoleImage} from '@/utils/assets';
import {useSkinAsset} from '@/skins';
import {useGameStore} from '@/store/useGameStore';
import {Button} from '@/components/ui';
import {BombTimer} from './BombTimer';
import type {GameStatsBarProps} from './types';

export function GameStatsBar({
                               currentRound,
                               totalPlayers,
                               defusesFound,
                               defusesNeeded,
                               revealedCards,
                             }: GameStatsBarProps) {
  const {gameState, isScannerActive, setScannerActive, isReviewingCards, isAnimatingCut, loupeAnimation} = useGameStore();
  const skinned = useSkinAsset();

  // Range derived from GAME_CONFIG: cannot drift from the actual rules.
  const formatRange = ({min, max}: RoleRange) => (min === max ? `${min}` : `${min}-${max}`);
  const getRoleDistribution = () => {
    // Chaos mode: the distribution is secret, masked behind question marks.
    if (gameState?.isChaosModeEnabled || !isValidPlayerCount(totalPlayers)) return {blue: '?', red: '?'};
    const {sherlock, moriarty} = getRoleDistributionRange(totalPlayers);
    return {blue: formatRange(sherlock), red: formatRange(moriarty)};
  };

  const dist = getRoleDistribution();
  const canUseScanner = gameState?.teamHasLoupe && currentRound <= LOUPE_LAST_USABLE_ROUND;

  const cardsRevealedThisRound = gameState?.cardsRevealedThisRound ?? 0;
  const cutsRemaining = totalPlayers - cardsRevealedThisRound;

  const recentCards = revealedCards?.slice(-5) || [];
  const hiddenCardsCount = (revealedCards?.length || 0) - recentCards.length;

  const isGamePaused = isReviewingCards || isAnimatingCut || loupeAnimation !== null;

  return (
      <div className="relative shrink-0 border-b border-gold/20 bg-gradient-to-b from-ink/80 to-transparent px-4 py-3 landscape:px-6 landscape:py-2 z-40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 landscape:grid landscape:grid-cols-[1fr_auto_1fr] landscape:items-center">

          {/* Role counters + round stats */}
          <div className="flex items-start justify-between gap-3 landscape:flex-col landscape:items-start landscape:justify-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-sherlock/40 bg-sherlock-deep/40 px-2 py-1 shadow-inner">
                <div className="relative h-9 w-7 landscape:h-10 landscape:w-8">
                  <Image src={skinned(getRoleImage('SHERLOCK'))} alt="Sherlock" fill className="object-contain" />
                </div>
                <span className="text-base font-black text-sherlock landscape:text-lg">{dist.blue}</span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-moriarty/40 bg-moriarty-deep/40 px-2 py-1 shadow-inner">
                <div className="relative h-9 w-7 landscape:h-10 landscape:w-8">
                  <Image src={skinned(getRoleImage('MORIARTY'))} alt="Moriarty" fill className="object-contain" />
                </div>
                <span className="text-base font-black text-moriarty landscape:text-lg">{dist.red}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 landscape:items-start">
              <p className="text-[11px] font-serif font-bold uppercase tracking-[0.18em] text-cream landscape:text-xs">Manche {currentRound}</p>
              <p className="text-[11px] font-serif font-bold uppercase tracking-[0.18em] text-cream landscape:text-xs">Coupes restantes : {cutsRemaining}</p>
            </div>
          </div>

          {/* Center: timer + loupe button */}
          <div className="flex flex-row items-center justify-center gap-4 shrink-0">
            {gameState?.isTimerModeEnabled && !isReviewingCards && (
                <BombTimer
                    endTime={gameState.turnEndTime || null}
                    isPaused={isGamePaused}
                />
            )}

            {canUseScanner && (
                <Button
                    variant={isScannerActive ? 'sherlock' : 'neutral'}
                    size="sm"
                    onClick={() => setScannerActive(!isScannerActive)}
                    icon={<Search className="h-4 w-4" />}
                    className="w-full max-w-xs justify-center landscape:w-auto landscape:max-w-none"
                >
              <span className="whitespace-nowrap text-xs landscape:text-sm">
                {isScannerActive ? 'SCAN EN COURS...' : 'UTILISER LA LOUPE'}
              </span>
                </Button>
            )}
          </div>

          {/* Defused cards */}
          <div className="flex min-w-0 flex-col items-center gap-1.5 landscape:items-end shrink-0">
            <p className="text-[11px] font-serif font-bold uppercase tracking-widest text-green-400 landscape:text-xs drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]">
              Désarmés : {defusesFound}/{defusesNeeded}
            </p>

            <div className="flex items-center py-2">
              {/* Overflow count for cards not shown in the stack */}
              {hiddenCardsCount > 0 && (
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-gold mr-3 landscape:mr-4">
                +{hiddenCardsCount}
              </span>
              )}

              <div className="flex">
                {recentCards.map((card: CardModel, i: number) => (
                    <div key={i} className="relative h-10 w-7 shrink-0 -ml-2 drop-shadow-xl first:ml-0 landscape:h-12 landscape:w-8 landscape:-ml-3" style={{zIndex: i}}>
                      <Image src={skinned(getCardImage(card.type))} alt="card" fill className="object-contain" />
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
