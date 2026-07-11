import Image from 'next/image';
import {motion} from 'framer-motion';
import type {CardType} from '@timebomb/shared';
import {getCardImage} from '@/utils/assets';
import type {CardCutAnimationProps} from './types';

interface CutStyle {
  color: string;
  accent: string;
  text: string;
  isBomb: boolean;
}

const CUT_STYLES: Partial<Record<CardType, CutStyle>> = {
  BOMB: {color: '#ef4444', accent: '#f97316', text: 'EXPLOSION !', isBomb: true},
  DEFUSE: {color: '#22c55e', accent: '#a3e635', text: 'CÂBLE COUPÉ !', isBomb: false},
  LOUPE: {color: '#3b82f6', accent: '#60a5fa', text: 'LOUPE OBTENUE !', isBomb: false},
};

const DEFAULT_STYLE: CutStyle = {color: '#c9a56d', accent: '#f3e7d3', text: 'RIEN...', isBomb: false};

/** Fullscreen reveal of the card that was just cut. */
export function CardCutAnimation({data}: CardCutAnimationProps) {
  const config = CUT_STYLES[data.card.type] ?? DEFAULT_STYLE;

  const shakeAnimation = config.isBomb ? {
    x: [0, -20, 20, -15, 15, -10, 10, 0], y: [0, 5, -5, 0],
    transition: {duration: 0.5, delay: 0.1}
  } : {};

  return (
      <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0, transition: {duration: 0.3}}}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-ink-deep/85 backdrop-blur-sm overflow-hidden pointer-events-none"
      >
        <motion.div
            initial={{scale: 0, rotateY: 180, z: -500}}
            animate={{scale: 1, rotateY: 0, z: 0, ...shakeAnimation}}
            exit={{scale: 0.8, y: -50, opacity: 0, transition: {duration: 0.3}}}
            transition={{type: 'spring', damping: 15, stiffness: 120}}
            className="relative w-56 h-80 sm:w-80 sm:h-[480px] landscape:w-44 landscape:h-64 flex flex-col items-center justify-center perspective-[1000px]"
        >
          {/* Blinding initial flash for the bomb */}
          {config.isBomb && (
              <motion.div
                  initial={{opacity: 1}} animate={{opacity: 0}}
                  transition={{duration: 0.6, ease: 'easeOut'}}
                  className="absolute inset-0 bg-white z-50"
              />
          )}

          <motion.div
              initial={{opacity: 0, scale: 0.8}}
              animate={{opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1]}}
              transition={{delay: 0.2, duration: 2, repeat: Infinity, ease: 'easeInOut'}}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 rounded-full blur-[80px] z-0"
              style={{background: `radial-gradient(circle, ${config.accent} 0%, ${config.color} 70%, transparent 100%)`}}
          />

          <motion.div
              initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}}
              className="absolute -top-16 sm:-top-24 landscape:-top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
          >
            <p className="text-4xl sm:text-6xl landscape:text-3xl font-serif font-black italic tracking-widest uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
               style={{color: config.color, textShadow: `0 0 15px ${config.accent}`}}>
              {config.text}
            </p>
          </motion.div>

          <motion.div
              initial={{scale: 1}} animate={config.isBomb ? {scale: [1, 1.1, 1]} : {}} transition={{duration: 0.3, delay: 0.1}}
              className="relative w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-20"
          >
            <Image src={getCardImage(data.card.type)} alt="Résultat" fill className="object-contain" priority />
          </motion.div>

          <motion.div
              initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}}
              className="absolute -bottom-16 sm:-bottom-24 landscape:-bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
          >
            <p className="text-2xl sm:text-4xl landscape:text-xl font-serif italic tracking-widest uppercase text-cream drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
              Chez <span style={{color: config.color, textShadow: `0 0 15px ${config.color}`}} className="font-black">{data.ownerName}</span>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
  );
}
