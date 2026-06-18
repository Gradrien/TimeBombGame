// client/src/components/WikiModal.tsx
import {X} from 'lucide-react';
import {useEffect, ReactNode} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

export interface WikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function WikiModal({isOpen, onClose, title, icon, children}: WikiModalProps) {
  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
	if (isOpen) document.body.style.overflow = 'hidden';
	else document.body.style.overflow = 'unset';
	return () => {
	  document.body.style.overflow = 'unset';
	};
  }, [isOpen]);

  // Fermeture clavier (Échap) — confort sur desktop, inoffensif sur mobile.
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
			  {/* Overlay sombre cliquable pour fermer */}
			  <motion.div
				  initial={{opacity: 0}}
				  animate={{opacity: 1}}
				  exit={{opacity: 0}}
				  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				  onClick={onClose}
			  />

			  {/* Conteneur principal de la modale */}
			  <motion.div
				  initial={{opacity: 0, scale: 0.95, y: 16}}
				  animate={{opacity: 1, scale: 1, y: 0}}
				  exit={{opacity: 0, scale: 0.97, y: 8}}
				  transition={{duration: 0.25, ease: 'easeOut'}}
				  className="relative w-full max-w-2xl max-h-[90dvh] landscape:max-h-[94dvh] flex flex-col overflow-hidden rounded-3xl border border-[#c9a56d]/40 bg-[#1a1510]/95 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.6)]"
			  >
				{/* Liseré doré supérieur */}
				<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a56d] to-transparent"/>

				{/* En-tête */}
				<div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-6 border-b border-[#8a6842]/30">
				  <div className="flex items-center gap-3 min-w-0">
					{icon && (
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c9a56d]/40 bg-black/40 text-[#c9a56d]">
						  {icon}
						</span>
					)}
					<h2 className="truncate font-serif text-lg sm:text-2xl font-bold uppercase tracking-[0.18em] text-[#c9a56d] drop-shadow-md">
					  {title}
					</h2>
				  </div>
				  <button
					  onClick={onClose}
					  aria-label="Fermer"
					  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8a6842]/50 bg-black/30 text-[#b08a57] hover:text-[#f3e7d3] hover:border-[#c9a56d] hover:bg-black/50 transition-all active:scale-95"
				  >
					<X size={18}/>
				  </button>
				</div>

				{/* Contenu scrollable */}
				<div className="relative z-10 flex flex-col gap-8 overflow-y-auto custom-scrollbar p-5 sm:p-7 text-[#f3e7d3]">
				  {children}
				</div>
			  </motion.div>
			</div>
		)}
	  </AnimatePresence>
  );
}
