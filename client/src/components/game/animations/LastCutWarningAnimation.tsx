import Image from 'next/image';
import {motion} from 'framer-motion';
import {ASSETS} from '@/utils/assets';

/** Fullscreen warning shown when the next cut is the last one of the round. */
export function LastCutWarningAnimation() {
  return (
      <motion.div
          initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-ink-deep/70 backdrop-blur-sm pointer-events-none"
      >
        <motion.div
            initial={{scale: 0.5, rotate: -15, y: 30}}
            animate={{scale: 1, rotate: 0, y: 0}}
            exit={{scale: 1.5, opacity: 0, transition: {duration: 0.3}}}
            transition={{type: 'spring', stiffness: 150, damping: 10}}
            className="relative w-56 h-56 sm:w-80 sm:h-80 landscape:w-48 landscape:h-48 flex flex-col items-center justify-center"
        >
          <motion.div
              animate={{opacity: [0.2, 0.5, 0.2]}}
              transition={{repeat: Infinity, duration: 1.5}}
              className="absolute inset-0 bg-amber-500 blur-[80px] rounded-full z-0 opacity-50"
          />

          <div className="relative w-full h-full z-10 mb-4 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
            <Image src={ASSETS.CLIPPER} alt="Pince" fill className="object-contain" priority />
          </div>

          <div className="absolute -bottom-10 sm:-bottom-16 landscape:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
            <p className="text-3xl sm:text-5xl landscape:text-2xl font-black font-serif uppercase tracking-[0.2em] text-amber-500 drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)]">
              DERNIÈRE COUPE
            </p>
          </div>
        </motion.div>
      </motion.div>
  );
}
