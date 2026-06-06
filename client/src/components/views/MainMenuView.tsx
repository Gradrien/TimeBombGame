import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import { RulesWikiModal } from '@/components/RulesWikiModal';
import type { MainMenuViewProps } from "@/types/views";

export function MainMenuView({ onNavigate }: MainMenuViewProps) {
  const { playerName, createRoom, clearError } = useGameStore();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
	  <>
		{/* En portrait: flex-col (1 colonne). En paysage: flex-row (2 colonnes) */}
		<div className="flex flex-col landscape:flex-row items-center justify-center gap-4 landscape:gap-8 w-full">

		  {/* COLONNE 1 : Jouer */}
		  <div className="flex flex-col gap-4 w-full landscape:flex-1">
			<SteampunkButton variant="sherlock" size="lg" onClick={() => createRoom(playerName)}>
			  Créer une partie
			</SteampunkButton>

			<SteampunkButton variant="neutral" size="lg" onClick={() => { clearError(); onNavigate('JOIN'); }}>
			  Rejoindre une partie
			</SteampunkButton>
		  </div>

		  {/* SÉPARATEUR : Horizontal en portrait, Vertical en paysage */}
		  <div className="h-0.5 w-24 bg-linear-to-r from-transparent via-[#c9a56d] to-transparent opacity-50 shrink-0 landscape:w-px landscape:h-32 landscape:bg-linear-to-b" />

		  {/* COLONNE 2 : Outils / Info */}
		  <div className="flex flex-col gap-4 w-full landscape:flex-1">
			<SteampunkButton variant="neutral" size="lg" onClick={() => onNavigate('PROFILE')}>
			  Mon profil
			</SteampunkButton>

			<SteampunkButton variant="neutral" size="lg" onClick={() => setIsRulesOpen(true)}>
			  Comment jouer ?
			</SteampunkButton>
		  </div>

		</div>

		<RulesWikiModal
			isOpen={isRulesOpen}
			onClose={() => setIsRulesOpen(false)}
		/>
	  </>
  );
}
