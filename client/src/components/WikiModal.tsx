// client/src/components/WikiModal.tsx
import { X } from 'lucide-react';
import { useEffect, ReactNode } from 'react';

export interface WikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function WikiModal({ isOpen, onClose, title, children }: WikiModalProps) {
  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
	if (isOpen) document.body.style.overflow = 'hidden';
	else document.body.style.overflow = 'unset';
	return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
	  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
		{/* Overlay sombre cliquable pour fermer */}
		<div
			className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
			onClick={onClose}
		/>

		{/* Conteneur principal de la modale */}
		<div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1510] border-2 border-[#c9a56d]/50 rounded-2xl shadow-[0_0_40px_rgba(201,165,109,0.15)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

		  {/* Pattern de fond steampunk */}
		  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />

		  {/* En-tête dynamique */}
		  <div className="flex items-center justify-between p-5 border-b border-[#8a6842]/30 relative z-10 bg-gradient-to-r from-transparent via-[#8a6842]/10 to-transparent">
			<h2 className="text-xl sm:text-2xl font-serif font-bold text-[#c9a56d] uppercase tracking-widest drop-shadow-md">
			  {title}
			</h2>
			<button
				onClick={onClose}
				className="p-2 text-[#8a6842] hover:text-[#f3e7d3] hover:bg-white/5 rounded-lg transition-colors"
			>
			  <X size={24} />
			</button>
		  </div>

		  {/* Contenu scrollable (children) */}
		  <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar relative z-10 flex flex-col gap-10 text-[#f3e7d3]">
			{children}
		  </div>
		</div>
	  </div>
  );
}
