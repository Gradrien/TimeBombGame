// client/src/components/LoupeWikiModal.tsx
import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

interface LoupeWikiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoupeWikiModal({ isOpen, onClose }: LoupeWikiModalProps) {
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

		  {/* En-tête */}
		  <div className="flex items-center justify-between p-5 border-b border-[#8a6842]/30 relative z-10 bg-gradient-to-r from-transparent via-[#8a6842]/10 to-transparent">
			<h2 className="text-xl sm:text-2xl font-serif font-bold text-[#c9a56d] uppercase tracking-widest drop-shadow-md">
			  Dossier Confidentiel : Extension
			</h2>
			<button
				onClick={onClose}
				className="p-2 text-[#8a6842] hover:text-[#f3e7d3] hover:bg-white/5 rounded-lg transition-colors"
			>
			  <X size={24} />
			</button>
		  </div>

		  {/* Contenu scrollable */}
		  <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar relative z-10 flex flex-col gap-10 text-[#f3e7d3]">

			{/* SECTION : LA LOUPE */}
			<div className="flex flex-col sm:flex-row gap-6 items-start">
			  <div className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-lg mx-auto sm:mx-0">
				{/* Remplace le src par le vrai chemin de ton image Loupe */}
				<Image src="/assets/card-glasses.png" alt="Carte Loupe" fill className="object-contain" />
			  </div>

			  <div className="flex-1 flex flex-col gap-3">
				<h3 className="text-xl font-bold uppercase tracking-wide text-[#60a5fa] drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
				  L'Objet : La Loupe
				</h3>
				<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
				  La loupe permet à l'équipe de révéler secrètement l'une des cartes d'un autre joueur.
				  Cependant, la technologie est instable et son efficacité diminue au fil des manches.
				</p>

				<div className="bg-black/40 border border-[#8a6842]/30 rounded-xl p-4 mt-2">
				  <h4 className="text-xs uppercase text-[#8a6842] font-bold mb-3 tracking-widest">Taux de réussite</h4>
				  <ul className="flex flex-col gap-2 text-sm font-bold">
					<li className="flex justify-between items-center"><span className="text-white/60">Manche 1</span> <span className="text-green-400">100%</span></li>
					<li className="flex justify-between items-center"><span className="text-white/60">Manche 2</span> <span className="text-yellow-400">90%</span></li>
					<li className="flex justify-between items-center"><span className="text-white/60">Manche 3</span> <span className="text-orange-400">80%</span></li>
					<li className="flex justify-between items-center"><span className="text-white/60">Manche 4</span> <span className="text-red-500 line-through opacity-50">Inutilisable</span></li>
				  </ul>
				</div>
			  </div>
			</div>

			<div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#8a6842]/30 to-transparent" />

			{/* SECTION : LE BROUILLEUR */}
			<div className="flex flex-col sm:flex-row gap-6 items-start">
			  <div className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-lg mx-auto sm:mx-0">
				<Image src="/assets/roles/role-red-brouilleur.png" alt="Rôle Brouilleur" fill className="object-contain" />
			  </div>

			  <div className="flex-1 flex flex-col gap-3">
				<h3 className="text-xl font-bold uppercase tracking-wide text-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
				  Le Rôle : Brouilleur
				</h3>
				<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
				  Un agent furtif de l'équipe de Moriarty équipé d'une technologie de contre-espionnage.
				  Il n'a pas besoin d'agir, son pouvoir est strictement passif et vise à saboter la Loupe.
				</p>

				<div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mt-2">
				  <h4 className="text-xs uppercase text-[#ef4444] font-bold mb-2 tracking-widest">Pouvoir Passif</h4>
				  <p className="text-sm text-white/90">
					Si un joueur tente d'utiliser la Loupe sur le Brouilleur (quelle que soit la manche), il y a <span className="font-bold text-[#ef4444] text-base drop-shadow-md">90% de chances</span> que la machine soit brouillée et que la lecture échoue.
				  </p>
				</div>
			  </div>
			</div>

		  </div>
		</div>
	  </div>
  );
}
