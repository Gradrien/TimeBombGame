import Image from 'next/image';
import {Dices, EyeOff} from 'lucide-react';
import {CHAOS_PROBABILITIES} from '@timebomb/shared';
import {WikiModal} from './WikiModal';
import {ChaosOutcomeRow} from './ChaosOutcomeRow';
import type {ChaosOutcome, WikiModalControlProps} from './types';

// Probabilities come from the shared config: what the wiki shows is exactly
// what the server applies in assignRolesChaos().
const OUTCOMES: ChaosOutcome[] = [
  {
    pct: CHAOS_PROBABILITIES.RANDOM * 100,
    accent: '#c9a56d',
    glow: 'rgba(201,165,109,0.45)',
    title: 'Distribution aléatoire',
    desc: 'Chaque joueur tire son camp indépendamment, à pile ou face.',
    mix: ['blue', 'red'],
  },
  {
    pct: CHAOS_PROBABILITIES.ALL_MORIARTY * 100,
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.45)',
    title: 'Table de complices',
    desc: 'Toute la table travaille secrètement pour Moriarty.',
    mix: ['red'],
  },
  {
    pct: CHAOS_PROBABILITIES.ALL_SHERLOCK * 100,
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.45)',
    title: 'Table de détectives',
    desc: 'Aucun traître : tout le monde est Sherlock.',
    mix: ['blue'],
  },
  {
    pct: CHAOS_PROBABILITIES.LONE_SHERLOCK * 100,
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.45)',
    title: 'Le traître solitaire',
    desc: 'Un unique Sherlock perdu au milieu des Moriarty.',
    mix: ['blue', 'red', 'red'],
  },
];

export function ChaosWikiModal({isOpen, onClose}: WikiModalControlProps) {
  return (
      <WikiModal isOpen={isOpen} onClose={onClose} title="Tutoriel : Mode Chaos" icon={<Dices size={18}/>}>
        {/* The principle */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div
              className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative rounded-xl overflow-hidden shadow-lg mx-auto sm:mx-0 flex items-center justify-center bg-ink-soft border border-bronze/40">
            <Dices size={56} className="text-gold drop-shadow-[0_0_10px_rgba(201,165,109,0.5)]"/>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-gold drop-shadow-[0_0_8px_rgba(201,165,109,0.4)]">
              Une distribution totalement aléatoire
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              En temps normal, le nombre de détectives (Sherlock) et de complices (Moriarty) est fixé selon
              le nombre de joueurs. Le <span className="font-bold text-gold">Mode Chaos</span> change complètement cette règle : <span className="font-bold text-white">chaque joueur possède un rôle aléatoire.</span>
            </p>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              Tout devient possible : une table remplie de Sherlock, une armée de Moriarty, un seul traître
              caché parmi les fidèles... ou l'inverse. Personne ne peut deviner l'équilibre de la partie.
            </p>
          </div>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-bronze/30 to-transparent"/>

        {/* Probabilities */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-black/40 text-gold">
              <Dices size={18}/>
            </span>
            <h3 className="text-xl font-bold uppercase tracking-wide text-gold drop-shadow-[0_0_8px_rgba(201,165,109,0.4)]">
              Probabilités de distribution
            </h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed text-justify">
            À chaque partie, le sort tranche entre quatre scénarios. Les pastilles indiquent les camps
            en présence, la barre la probabilité du scénario.
          </p>

          <div className="flex flex-col gap-2.5">
            {OUTCOMES.map((outcome, i) => (
                <ChaosOutcomeRow key={outcome.title} outcome={outcome} index={i}/>
            ))}
          </div>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-bronze/30 to-transparent"/>

        {/* Hidden distribution */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div
              className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative rounded-xl overflow-hidden shadow-lg mx-auto sm:mx-0 flex items-center justify-center bg-ink-soft border border-bronze/40">
            <EyeOff size={56} className="text-sherlock drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]"/>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-sherlock drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
              La répartition reste secrète
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              Contrairement à une partie classique, vous ne saurez <span className="font-bold text-white">jamais</span> combien
              de Sherlock et de Moriarty sont autour de la table. En haut de l'écran, les compteurs de rôles
              sont masqués derrière des points d'interrogation.
            </p>

            <div className="bg-black/40 border border-bronze/30 rounded-xl p-4 mt-2">
              <h4 className="text-xs uppercase text-bronze font-bold mb-3 tracking-widest">Compteur de rôles</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-sherlock/40 bg-sherlock-deep/40 px-3 py-1.5 shadow-inner">
                  <Image src="/assets/roles/role-blue-1.png" alt="Sherlock" width={22} height={30} className="object-contain"/>
                  <span className="text-lg font-black text-sherlock">?</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-moriarty/40 bg-moriarty-deep/40 px-3 py-1.5 shadow-inner">
                  <Image src="/assets/roles/role-red-1.png" alt="Moriarty" width={22} height={30} className="object-contain"/>
                  <span className="text-lg font-black text-moriarty">?</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </WikiModal>
  );
}
