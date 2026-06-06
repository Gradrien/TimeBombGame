import Image from 'next/image';
import { Card as CardType } from '@timebomb/shared';
import { getCardImage, getRoleImage } from '@/utils/assets';
import { useGameStore } from '@/store/useGameStore';
import SteampunkButton from '@/components/Button';
import { Search } from 'lucide-react';
import { BombTimer } from '@/components/BombTimer';
import type { GameStatsBarProps } from '@/types/types';

export function GameStatsBar({
							   currentRound,
							   totalPlayers,
							   defusesFound,
							   defusesNeeded,
							   revealedCards,
							 }: GameStatsBarProps) {
  const { gameState, isScannerActive, setScannerActive, isReviewingCards, isAnimatingCut, loupeAnimation } = useGameStore();

  const getRoleDistribution = () => {
	switch (totalPlayers) {
	  case 4: return { blue: '2-3', red: '1-2' };
	  case 5: return { blue: '3', red: '2' };
	  case 6: return { blue: '4', red: '2' };
	  case 7: return { blue: '4-5', red: '2-3' };
	  case 8: return { blue: '5', red: '3' };
	  default: return { blue: '?', red: '?' };
	}
  };

  const dist = getRoleDistribution();
  const canUseScanner = gameState?.teamHasLoupe && currentRound < 4;

  const cardsRevealedThisRound = gameState?.cardsRevealedThisRound ?? 0;
  const cutsRemaining = totalPlayers - cardsRevealedThisRound;

  const isGamePaused = isReviewingCards || isAnimatingCut || loupeAnimation !== null;

  return (
	  <div className="shrink-0 border-b border-amber-900/20 bg-linear-to-b from-black/60 to-transparent px-4 py-3 landscape:px-6 landscape:py-2">
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-3 landscape:grid landscape:grid-cols-[1fr_auto_1fr] landscape:items-center">

		  {/* STATS + RÔLES */}
		  <div className="flex items-start justify-between gap-3 landscape:flex-col landscape:items-start landscape:justify-center">
			<div className="flex items-center gap-2">
			  <div className="flex items-center gap-2 rounded border border-blue-500/40 bg-blue-900/40 px-2 py-1 shadow-inner">
				<div className="relative h-9 w-7 landscape:h-10 landscape:w-8">
				  <Image src={getRoleImage('SHERLOCK')} alt="Sherlock" fill className="object-contain" />
				</div>
				<span className="text-base font-black text-blue-400 landscape:text-lg">{dist.blue}</span>
			  </div>

			  <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-900/40 px-2 py-1 shadow-inner">
				<div className="relative h-9 w-7 landscape:h-10 landscape:w-8">
				  <Image src={getRoleImage('MORIARTY')} alt="Moriarty" fill className="object-contain" />
				</div>
				<span className="text-base font-black text-red-400 landscape:text-lg">{dist.red}</span>
			  </div>
			</div>

			<div className="flex flex-col items-end gap-1 landscape:items-start">
			  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-50 landscape:text-xs">Manche {currentRound}</p>
			  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-50 landscape:text-xs">Coupes restantes : {cutsRemaining}</p>
			</div>
		  </div>

		  {/* CENTRE : TIMER + BOUTON LOUPE */}
		  <div className="flex flex-row items-center justify-center gap-4">
			{gameState?.isTimerModeEnabled && !isReviewingCards && (
				<BombTimer
					endTime={gameState.turnEndTime || null}
					isPaused={isGamePaused}
				/>
			)}

			{canUseScanner && (
				<SteampunkButton
					variant={isScannerActive ? 'sherlock' : 'neutral'}
					size="sm"
					onClick={() => setScannerActive(!isScannerActive)}
					icon={<Search className="h-4 w-4" />}
					className="w-full max-w-xs justify-center landscape:w-auto landscape:max-w-none"
				>
              <span className="whitespace-nowrap text-xs landscape:text-sm">
                {isScannerActive ? 'SCAN EN COURS...' : 'UTILISER LA LOUPE'}
              </span>
				</SteampunkButton>
			)}
		  </div>

		  {/* CARTES DÉSARMÉES */}
		  <div className="flex min-w-0 flex-col items-center gap-1 landscape:items-end">
			<p className="text-[11px] font-black uppercase tracking-widest text-green-500 landscape:text-xs">
			  Désarmés : {defusesFound}/{defusesNeeded}
			</p>
			<div className="flex max-w-full items-center overflow-x-auto py-1 pl-3 no-scrollbar landscape:max-w-80 landscape:pl-6">
			  {revealedCards?.map((card: CardType, i: number) => (
				  <div key={i} className="relative h-10 w-7 shrink-0 -ml-2 drop-shadow-xl first:ml-0 landscape:h-12 landscape:w-8 landscape:-ml-3" style={{ zIndex: i }}>
					<Image src={getCardImage(card.type)} alt="card" fill className="object-contain" />
				  </div>
			  ))}
			</div>
		  </div>
		</div>
	  </div>
  );
}
