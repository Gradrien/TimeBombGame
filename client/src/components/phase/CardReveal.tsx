import Image from 'next/image';
import {motion, useAnimation} from 'framer-motion';
import {useEffect, useRef} from 'react';
import {getCardImage, ASSETS} from '@/utils/assets';
import {useSkinAsset} from '@/skins';
import type {CardRevealProps} from './types';

export function CardReveal({cards, flippedIndices, isShuffling}: CardRevealProps) {
  const skinned = useSkinAsset();

  const controls = useAnimation();

  const prevCardsLength = useRef(0);
  const hasDealt = useRef(false);

  useEffect(() => {
    // A shrinking hand means a cable was cut mid-round, not a new deal.
    const isCardCut = cards.length > 0 && cards.length < prevCardsLength.current;
    prevCardsLength.current = cards.length;

    const sequenceAnimation = async () => {
      if (!cards || cards.length === 0) return;
      if (isCardCut && !isShuffling) return;

      // Give React a beat to mount the card nodes before animating them.
      await new Promise(resolve => setTimeout(resolve, 50));

      if (isShuffling) {
        // Full round-change sequence.
        hasDealt.current = false; // allow the deal animation to replay

        // 1. Collect: cards fly out to the right.
        await controls.start((i) => ({
          opacity: 0,
          x: 100,
          transition: {duration: 0.2, delay: i * 0.05, ease: 'easeIn'}
        }));

        // 2. Teleport to the left while invisible.
        controls.set({x: -100});

        // 3. "Shuffling" pause on an empty table.
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Poker-style redeal.
        await controls.start((i) => ({
          opacity: 1,
          x: 0,
          transition: {type: 'spring', stiffness: 200, damping: 20, delay: i * 0.05}
        }));

        hasDealt.current = true;

      } else {
        // First deal of the game — play it only once, otherwise every server
        // update would re-trigger it.
        if (!hasDealt.current) {
          controls.set({opacity: 0, x: -100});
          await controls.start((i) => ({
            opacity: 1,
            x: 0,
            transition: {type: 'spring', stiffness: 200, damping: 20, delay: i * 0.05}
          }));
          hasDealt.current = true;
        }
      }
    };

    sequenceAnimation();
    // The animation must only replay when the NUMBER of cards changes: each
    // server update creates a new array reference which must not restart the
    // sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShuffling, cards.length, controls]);

  return (
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 relative w-full max-w-4xl px-4">
        {cards.map((type, i) => {
          const isFlipped = flippedIndices.includes(i);

          return (
              // Layer 1: position and opacity, driven by the sequence above.
              <motion.div
                  key={i}
                  custom={i}
                  initial={{opacity: 0, x: -100}}
                  animate={controls}
                  className="relative w-20 h-32 sm:w-32 sm:h-48 landscape:w-24 landscape:h-36"
                  style={{perspective: 1000}}
              >
                {/* Layer 2: independent 3D flip. */}
                <motion.div
                    className="relative w-full h-full"
                    style={{transformStyle: 'preserve-3d'}}
                    animate={{rotateY: isFlipped ? 180 : 0}}
                    transition={{type: 'spring', stiffness: 220, damping: 18}}
                >
                  <div className="absolute inset-0" style={{backfaceVisibility: 'hidden'}}>
                    <Image src={skinned(ASSETS.CARD_BACK)} alt="Dos de carte" fill className="object-contain drop-shadow-lg"/>
                  </div>
                  <div className="absolute inset-0" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
                    <Image src={skinned(getCardImage(type))} alt="Face de la carte" fill className="object-contain drop-shadow-xl"/>
                  </div>
                </motion.div>
              </motion.div>
          );
        })}
      </div>
  );
}
