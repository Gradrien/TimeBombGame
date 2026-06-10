// client/src/components/LoupeWikiModal.tsx
import Image from 'next/image';
import {WikiModal} from '@/components/WikiModal';
import {WikiModalProps} from "@/types/types";

export function LoupeWikiModal({isOpen, onClose}: WikiModalProps) {
  return (
	  <WikiModal isOpen={isOpen} onClose={onClose} title="Tutoriel : Mode Loupe">
		{/* SECTION : LA LOUPE */}
		<div className="flex flex-col sm:flex-row gap-6 items-start">
		  <div
			  className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-lg mx-auto sm:mx-0">
			<Image src="/assets/card-glasses.png" alt="Carte Loupe" fill className="object-contain"/>
		  </div>

		  <div className="flex-1 flex flex-col gap-3">
			<h3 className="text-xl font-bold uppercase tracking-wide text-[#60a5fa] drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
			  Nouvelle Carte : La Loupe
			</h3>
			<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
			  La Loupe est une carte remplaçant une carte vide et permet à l'équipe de révéler secrètement l'une des
			  cartes d'un autre joueur. Une fois trouvée la Loupe peut être utilisée n'importe quand (sauf au dernier
			  round), par n'importe qui, et ne consomme pas de coupe à son utilisation.
			  Cependant, la technologie est instable et son efficacité diminue au fil des manches.
			</p>

			<div className="bg-black/40 border border-[#8a6842]/30 rounded-xl p-4 mt-2">
			  <h4 className="text-xs uppercase text-[#8a6842] font-bold mb-3 tracking-widest">Taux de réussite</h4>
			  <ul className="flex flex-col gap-2 text-sm font-bold">
				<li className="flex justify-between items-center"><span className="text-white/60">Manche 1</span> <span
					className="text-green-400">100%</span></li>
				<li className="flex justify-between items-center"><span className="text-white/60">Manche 2</span> <span
					className="text-yellow-400">90%</span></li>
				<li className="flex justify-between items-center"><span className="text-white/60">Manche 3</span> <span
					className="text-orange-400">80%</span></li>
				<li className="flex justify-between items-center"><span className="text-white/60">Manche 4</span> <span
					className="text-red-400">Inutilisable</span></li>
			  </ul>
			</div>
		  </div>
		</div>

		<div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#8a6842]/30 to-transparent"/>

		{/* SECTION : LE BROUILLEUR */}
		<div className="flex flex-col sm:flex-row gap-6 items-start">
		  <div
			  className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-lg mx-auto sm:mx-0">
			<Image src="/assets/roles/role-red-brouilleur.png" alt="Rôle Brouilleur" fill className="object-contain"/>
		  </div>

		  <div className="flex-1 flex flex-col gap-3">
			<h3 className="text-xl font-bold uppercase tracking-wide text-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
			  Nouveau Rôle : Le Brouilleur
			</h3>
			<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
			  Un agent furtif de l'équipe de Moriarty équipé d'une technologie de contre-espionnage.
			  Il n'a pas besoin d'agir, son pouvoir est strictement passif et vise à saboter la Loupe.
			</p>

			<div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mt-2">
			  <h4 className="text-xs uppercase text-[#ef4444] font-bold mb-2 tracking-widest">Pouvoir Passif</h4>
			  <p className="text-sm text-white/90">
				Si un joueur tente d'utiliser la Loupe sur le Brouilleur (quelle que soit la manche), il y a <span
				  className="font-bold text-[#ef4444] text-base drop-shadow-md">90% de chances</span> que l'enquête
				échoue et que la Loupe ne révèle aucune carte.
			  </p>
			</div>
		  </div>
		</div>
	  </WikiModal>
  );
}
