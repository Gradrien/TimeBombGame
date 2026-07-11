import Image from 'next/image';
import {BookOpen} from 'lucide-react';
import {WikiModal} from './WikiModal';
import type {WikiModalControlProps} from './types';

export function RulesWikiModal({isOpen, onClose}: WikiModalControlProps) {
  return (
      <WikiModal isOpen={isOpen} onClose={onClose} title="Comment Jouer ?" icon={<BookOpen size={18}/>}>

        {/* 1. The teams */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex gap-2 mx-auto sm:mx-0 shrink-0">
            <div className="w-16 h-24 relative rounded shadow-lg">
              <Image src="/assets/roles/role-blue-1.png" alt="Sherlock" fill className="object-contain" />
            </div>
            <div className="w-16 h-24 relative rounded shadow-lg">
              <Image src="/assets/roles/role-red-1.png" alt="Moriarty" fill className="object-contain" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-gold">
              1. Deux équipes secrètes
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              Vous incarnez secrètement un agent de <span className="text-sherlock font-bold">Sherlock</span> ou de <span className="text-moriarty font-bold">Moriarty</span>.
              L'équipe de Sherlock doit désamorcer la bombe avant la fin de la 4ème manche. L'équipe de Moriarty gagne si la bombe explose ou si tous les câbles ne sont pas coupés à temps.
            </p>
          </div>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-bronze/30 to-transparent" />

        {/* 2. The cards */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex gap-2 mx-auto sm:mx-0 shrink-0">
            <div className="w-12 h-16 relative">
              <Image src="/assets/card-safe.png" alt="Safe" fill className="object-contain" />
            </div>
            <div className="w-12 h-16 relative">
              <Image src="/assets/card-defuse.png" alt="Defuse" fill className="object-contain" />
            </div>
            <div className="w-12 h-16 relative">
              <Image src="/assets/card-bomb.png" alt="Bomb" fill className="object-contain" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-gold">
              2. Les Câbles (Cartes)
            </h3>
            <ul className="text-sm sm:text-base text-white/80 leading-relaxed space-y-2">
              <li><strong className="text-bronze">Câble Sécurisé :</strong> Ne fait rien.</li>
              <li><strong className="text-green-400">Désamorçage :</strong> Trouvez-les tous pour faire gagner l'équipe Sherlock !</li>
              <li><strong className="text-red-500">Bombe :</strong> Si elle est coupée, l'équipe Moriarty gagne instantanément.</li>
            </ul>
          </div>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-bronze/30 to-transparent" />

        {/* 3. The announcement phase */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-gold">
              3. La Phase d'Annonce
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              En début de manche, prenez secrètement connaissance de vos cartes avant de les mélanger.
              Avant de couper le moindre câble, place à la discussion ! <strong>En commençant par le joueur à la gauche de celui qui possède la pince</strong>, chaque joueur doit annoncer le contenu de sa main.
              Les agents de Moriarty devront mentir pour brouiller les pistes et cacher la bombe !
            </p>
          </div>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-bronze/30 to-transparent" />

        {/* 4. Cutting */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 shrink-0 relative mx-auto sm:mx-0">
            <Image src="/assets/clipper.png" alt="Pince" fill className="object-contain drop-shadow-[0_0_15px_white]" />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-gold">
              4. Couper les câbles
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed text-justify">
              Une fois le tour de table effectué, le joueur qui possède la <strong>Pince</strong> choisit un autre joueur et clique sur l'une de ses cartes pour la couper.
              Ce nouveau joueur récupère alors la Pince et joue le prochain tour. Débattez et mentez pour guider (ou piéger) le porteur de la pince !
            </p>
          </div>
        </div>

      </WikiModal>
  );
}
