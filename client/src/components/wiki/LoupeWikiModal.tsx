import Image from 'next/image';
import {Search} from 'lucide-react';
import {
  BROUILLEUR_JAM_CHANCE,
  getLoupeSuccessChance,
  LOUPE_LAST_USABLE_ROUND,
  MAX_ROUNDS,
} from '@timebomb/shared';
import {WikiModal} from './WikiModal';
import type {WikiModalControlProps} from './types';

/** Success-rate color, from safest to riskiest. */
const RATE_COLORS = ['text-green-400', 'text-yellow-400', 'text-orange-400'];

// Rounds 1..3 with their rate (from the shared config), then the last round
// where the loupe is unusable.
const SUCCESS_ROWS = Array.from({length: LOUPE_LAST_USABLE_ROUND}, (_, i) => ({
  round: i + 1,
  label: `${Math.round(getLoupeSuccessChance(i + 1) * 100)}%`,
  color: RATE_COLORS[Math.min(i, RATE_COLORS.length - 1)],
}));

export function LoupeWikiModal({isOpen, onClose}: WikiModalControlProps) {
  return (
      <WikiModal isOpen={isOpen} onClose={onClose} title="Tutoriel : Mode Loupe" icon={<Search size={18}/>}>
        {/* The Loupe card */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div
              className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-lg mx-auto sm:mx-0">
            <Image src="/assets/card-glasses.png" alt="Carte Loupe" fill className="object-contain"/>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-sherlock drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
              Nouvelle Carte : La Loupe
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              La Loupe est une carte remplaçant une carte vide et permet à l'équipe de révéler secrètement l'une des
              cartes d'un autre joueur. Une fois trouvée la Loupe peut être utilisée n'importe quand (sauf au dernier
              round), par n'importe qui, et ne consomme pas de coupe à son utilisation.
              Cependant, la technologie est instable et son efficacité diminue au fil des manches.
            </p>

            <div className="bg-black/40 border border-bronze/30 rounded-xl p-4 mt-2">
              <h4 className="text-xs uppercase text-bronze font-bold mb-3 tracking-widest">Taux de réussite</h4>
              <ul className="flex flex-col gap-2 text-sm font-bold">
                {SUCCESS_ROWS.map(({round, label, color}) => (
                    <li key={round} className="flex justify-between items-center">
                      <span className="text-white/60">Manche {round}</span> <span className={color}>{label}</span>
                    </li>
                ))}
                <li className="flex justify-between items-center">
                  <span className="text-white/60">Manche {MAX_ROUNDS}</span> <span
                    className="text-red-400">Inutilisable</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-bronze/30 to-transparent"/>

        {/* The Brouilleur role */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div
              className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-lg mx-auto sm:mx-0">
            <Image src="/assets/roles/role-red-brouilleur.png" alt="Rôle Brouilleur" fill className="object-contain"/>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-moriarty drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              Nouveau Rôle : Le Brouilleur
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              Un agent furtif de l'équipe de Moriarty équipé d'une technologie de contre-espionnage.
              Il n'a pas besoin d'agir, son pouvoir est strictement passif et vise à saboter la Loupe.
            </p>

            <div className="bg-moriarty/10 border border-moriarty/30 rounded-xl p-4 mt-2">
              <h4 className="text-xs uppercase text-moriarty font-bold mb-2 tracking-widest">Pouvoir Passif</h4>
              <p className="text-sm text-white/90">
                Si un joueur tente d'utiliser la Loupe sur le Brouilleur (quelle que soit la manche), il y a <span
                  className="font-bold text-moriarty text-base drop-shadow-md">{Math.round(BROUILLEUR_JAM_CHANCE * 100)}% de chances</span> que l'enquête
                échoue et que la Loupe ne révèle aucune carte.
              </p>
            </div>
          </div>
        </div>
      </WikiModal>
  );
}
