// client/src/components/ChaosWikiModal.tsx
import Image from 'next/image';
import {WikiModal} from '@/components/WikiModal';
import {WikiModalProps} from "@/types/types";
import {HelpCircle, Dices} from 'lucide-react';

export function ChaosWikiModal({isOpen, onClose}: WikiModalProps) {
  return (
	  <WikiModal isOpen={isOpen} onClose={onClose} title="Tutoriel : Mode Chaos">
		{/* SECTION : LE PRINCIPE */}
		<div className="flex flex-col sm:flex-row gap-6 items-start">
		  <div
			  className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative rounded-xl overflow-hidden shadow-lg mx-auto sm:mx-0 flex items-center justify-center bg-[#2a1d12] border border-[#8a6842]/40">
			<Dices size={56} className="text-[#c9a56d] drop-shadow-[0_0_10px_rgba(201,165,109,0.5)]"/>
		  </div>

		  <div className="flex-1 flex flex-col gap-3">
			<h3 className="text-xl font-bold uppercase tracking-wide text-[#c9a56d] drop-shadow-[0_0_8px_rgba(201,165,109,0.4)]">
			  Une distribution totalement aléatoire
			</h3>
			<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
			  En temps normal, le nombre de détectives (Sherlock) et de complices (Moriarty) est fixé selon
			  le nombre de joueurs. Le <span className="font-bold text-[#c9a56d]">Mode Chaos</span> change complètement cette règle: <span className="font-bold text-white">chaque joueur possède un rôle aléatoire.</span>.
			</p>
			<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
			  Tout devient possible : une table remplie de Sherlock, une armée de Moriarty, un seul traître
			  caché parmi les fidèles... ou l'inverse. Personne ne peut deviner l'équilibre de la partie.
			</p>
		  </div>
		</div>

		<div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#8a6842]/30 to-transparent"/>

		{/* SECTION : LA DISTRIBUTION CACHÉE */}
		<div className="flex flex-col sm:flex-row gap-6 items-start">
		  <div
			  className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative rounded-xl overflow-hidden shadow-lg mx-auto sm:mx-0 flex items-center justify-center bg-[#2a1d12] border border-[#8a6842]/40">
			<HelpCircle size={56} className="text-[#60a5fa] drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]"/>
		  </div>

		  <div className="flex-1 flex flex-col gap-3">
			<h3 className="text-xl font-bold uppercase tracking-wide text-[#60a5fa] drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
			  La répartition reste secrète
			</h3>
			<p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
			  Contrairement à une partie classique, vous ne saurez <span className="font-bold text-white">jamais</span> combien
			  de Sherlock et de Moriarty sont autour de la table. En haut de l'écran, les compteurs de rôles
			  sont masqués derrière des points d'interrogation.
			</p>

			<div className="bg-black/40 border border-[#8a6842]/30 rounded-xl p-4 mt-2">
			  <h4 className="text-xs uppercase text-[#8a6842] font-bold mb-3 tracking-widest">Compteur de rôles</h4>
			  <div className="flex items-center gap-3">
				<div className="flex items-center gap-2 rounded border border-blue-500/40 bg-blue-900/40 px-3 py-1.5 shadow-inner">
				  <Image src="/assets/roles/role-blue-1.png" alt="Sherlock" width={22} height={30} className="object-contain"/>
				  <span className="text-lg font-black text-blue-400">?</span>
				</div>
				<div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-900/40 px-3 py-1.5 shadow-inner">
				  <Image src="/assets/roles/role-red-1.png" alt="Moriarty" width={22} height={30} className="object-contain"/>
				  <span className="text-lg font-black text-red-400">?</span>
				</div>
			  </div>
			</div>
		  </div>
		</div>

	  </WikiModal>
  );
}
