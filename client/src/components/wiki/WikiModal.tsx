import {X} from 'lucide-react';
import {useEffect} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import type {WikiModalProps} from './types';

export function WikiModal({isOpen, onClose, title, icon, children}: WikiModalProps) {
  // Prevent the body from scrolling behind the open modal.
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
      <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 landscape:p-3">
              {/* Click-to-close backdrop */}
              <motion.div
                  initial={{opacity: 0}}
                  animate={{opacity: 1}}
                  exit={{opacity: 0}}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={onClose}
              />

              <motion.div
                  initial={{opacity: 0, scale: 0.95, y: 16}}
                  animate={{opacity: 1, scale: 1, y: 0}}
                  exit={{opacity: 0, scale: 0.97, y: 8}}
                  transition={{duration: 0.25, ease: 'easeOut'}}
                  className="relative w-full max-w-2xl max-h-[90dvh] landscape:max-h-[94dvh] flex flex-col overflow-hidden rounded-3xl border border-gold/40 bg-ink/95 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.6)]"
              >
                {/* Top golden edge */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"/>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-6 border-b border-bronze/30">
                  <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-black/40 text-gold">
                          {icon}
                        </span>
                    )}
                    <h2 className="truncate font-serif text-lg sm:text-2xl font-bold uppercase tracking-[0.18em] text-gold drop-shadow-md">
                      {title}
                    </h2>
                  </div>
                  <button
                      onClick={onClose}
                      aria-label="Fermer"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bronze/50 bg-black/30 text-brass hover:text-cream hover:border-gold hover:bg-black/50 transition-all active:scale-95"
                  >
                    <X size={18}/>
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="relative z-10 flex flex-col gap-8 overflow-y-auto custom-scrollbar p-5 sm:p-7 text-cream">
                  {children}
                </div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>
  );
}
