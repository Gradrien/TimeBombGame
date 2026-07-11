import {motion} from 'framer-motion';
import type {LoupeResultAnimationProps} from './types';

const glitchVariants = {
  animate: {
    x: [0, -2, 2, -1, 1, 0],
    y: [0, 1, -1, 0],
    filter: ['invert(0%) blur(0px)', 'invert(10%) blur(1px)', 'invert(0%) blur(0px)'],
    transition: {duration: 0.3, repeat: Infinity, repeatType: 'reverse' as const}
  }
};

/** Fullscreen result of a loupe scan: clean reveal, or jammed glitch. */
export function LoupeResultAnimation({success, targetName}: LoupeResultAnimationProps) {
  return (
      <motion.div
          initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
          className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm
              ${success ? 'bg-blue-900/20' : 'bg-red-950/40'}`}
      >
        <motion.div
            initial={{scale: 0.9, y: 20}}
            animate={{scale: 1, y: 0}}
            exit={{scale: 1.1, opacity: 0}}
            transition={{type: 'spring', damping: 20}}
            className={`relative flex flex-col items-center text-center p-8 sm:p-12 rounded-2xl shadow-2xl backdrop-blur-md
                ${success ? 'bg-ink-deep/70' : 'bg-ink-deep/80'}`}
        >
          {success ? (
              [...Array(2)].map((_, i) => (
                  <motion.div key={i}
                              initial={{opacity: 0, scale: 0.8}} animate={{opacity: [0, 0.3, 0], scale: [1, 1.5, 2]}}
                              transition={{delay: i * 0.4, duration: 1.5, repeat: Infinity, ease: 'easeOut'}}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-2xl border border-sherlock/30 pointer-events-none"
                  />
              ))
          ) : (
              <motion.div
                  animate={{y: [-50, 50]}} transition={{repeat: Infinity, duration: 0.15, ease: 'linear'}}
                  className="absolute left-0 right-0 h-1 bg-moriarty/30 blur-sm pointer-events-none"
              />
          )}

          <motion.p
              variants={!success ? glitchVariants : {}}
              animate={!success ? 'animate' : ''}
              className={`text-3xl sm:text-5xl font-serif font-black italic tracking-[0.1em] uppercase mb-4 drop-shadow-lg
               ${success ? 'text-sherlock' : 'text-moriarty'}
               ${!success ? 'before:content-[attr(data-text)] before:absolute before:top-0 before:left-0 before:text-cyan-400 before:opacity-70 before:-translate-x-0.5 before:mix-blend-screen after:content-[attr(data-text)] after:absolute after:top-0 after:left-0 after:text-magenta-500 after:opacity-70 after:translate-x-0.5 after:mix-blend-screen' : ''}`}
              data-text={success ? 'INDICE RÉVÉLÉ !' : 'LOUPE BROUILLÉE'}
          >
            {success ? 'INDICE RÉVÉLÉ !' : 'LOUPE BROUILLÉE'}
          </motion.p>

          <p className="text-lg sm:text-xl text-cream font-serif tracking-widest uppercase">
            Cible détectée : <span className="font-bold text-gold font-sans">{targetName}</span>
          </p>
        </motion.div>
      </motion.div>
  );
}
