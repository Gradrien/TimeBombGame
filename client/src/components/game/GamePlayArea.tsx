import Image from 'next/image';
import {ASSETS} from '@/utils/assets';
import {useGameStore} from '@/store/useGameStore';
import {Card} from './Card';
import type {GamePlayAreaProps} from './types';

export function GamePlayArea({
                               viewedPlayer,
                               isViewingOpponent,
                               iHaveClippers,
                               playerWithClippers,
                               handleCutCard,
                               players
                             }: GamePlayAreaProps) {
  const {gameState, activateLoupe, isScannerActive, setReviewingCards, isReviewingCards, playerId} = useGameStore();

  const activePlayerName = players.find(p => p.id === playerWithClippers)?.name || "quelqu'un";
  const me = players.find(p => p.id === playerId) || viewedPlayer;
  const playerToDisplay = isReviewingCards ? me : viewedPlayer;

  // The loupe can only target players with more than one hidden card,
  // otherwise it would reveal their whole hand.
  const hiddenCards = viewedPlayer.cards.filter(c => !c.isRevealed && !c.isPublic);
  const hasEnoughHiddenCards = hiddenCards.length > 1;

  const handleCardClick = (cardId: string) => {
    if (isScannerActive && gameState) {
      activateLoupe(gameState.roomId, playerToDisplay.id, cardId);
    } else if (iHaveClippers && !isReviewingCards) {
      handleCutCard(cardId);
    }
  };

  return (
      <div
          className="flex-1 z-40 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-y-auto no-scrollbar">
        {isReviewingCards && (
            <div
                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm cursor-pointer animate-fade-in flex items-center justify-center"
                onClick={() => setReviewingCards(false)}
                title="Cliquer pour cacher"
            >
              <div
                  className="absolute top-24 w-full text-center text-gold font-serif italic tracking-widest uppercase text-xs sm:text-sm animate-pulse">
                Appuyez n'importe où pour fermer
              </div>
            </div>
        )}

        {/* Turn indicator, or scanner prompt */}
        <div className="flex items-center justify-center w-full shrink-0 my-3">
          {isScannerActive && hasEnoughHiddenCards ? (
              <div
                  className="bg-sherlock-deep/60 border border-sherlock/50 px-4 py-1.5 rounded-full backdrop-blur-sm animate-bounce shadow-[0_0_14px_rgba(96,165,250,0.35)]">
                <p className="text-sm text-[#cfe3ff] font-bold uppercase tracking-widest drop-shadow-md">
                  Ciblez une carte de {viewedPlayer.name}
                </p>
              </div>
          ) : (
              <div
                  className={`px-4 sm:px-6 py-1.5 rounded-full shadow-lg backdrop-blur-sm border ${iHaveClippers ? 'bg-sherlock-deep/50 border-gold/60 shadow-[0_0_14px_rgba(201,165,109,0.3)]' : 'bg-ink/70 border-bronze/50'}`}>
                <p className={`text-sm font-serif italic tracking-widest text-center ${iHaveClippers ? 'text-cream font-bold not-italic uppercase' : 'text-gold'}`}>
                  {iHaveClippers
                      ? "C'est à TOI de couper !"
                      : `Au tour de ${activePlayerName} de couper...`}
                </p>
              </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-5xl z-50 my-auto">
          <div
              className={`flex items-center justify-center gap-3 sm:gap-6 w-full ${isScannerActive ? 'cursor-crosshair' : ''}`}>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {playerToDisplay.cards.map((card) => {
                const isInteractableForCut = iHaveClippers && isViewingOpponent && !card.isRevealed && !isReviewingCards;
                const isInteractableForScan = isScannerActive && !card.isRevealed && !card.isPublic && hasEnoughHiddenCards && !isReviewingCards;

                return (
                    <Card
                        key={card.id}
                        card={card}
                        isInteractable={isInteractableForCut || isInteractableForScan}
                        forceFaceUp={isReviewingCards}
                        onAction={handleCardClick}
                    />
                );
              })}
            </div>

            {/* Clippers next to the active player's hand */}
            {playerWithClippers === viewedPlayer.id && !isScannerActive && !isReviewingCards && (
                <div className="flex items-center justify-center shrink-0 border-l border-amber-900/30 pl-3 sm:pl-6 ml-2 sm:ml-4">
                  <div className="relative w-24 h-36 sm:w-32 sm:h-48 sm:landscape:w-20 sm:landscape:h-28 lg:landscape:w-24 lg:landscape:h-36 animate-zoom-in">
                    <Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain drop-shadow-[0_0_20px_white]"/>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
