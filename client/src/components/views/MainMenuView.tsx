// client/src/components/MainMenuView.tsx
import { useGameStore } from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import type {MainMenuViewProps} from "@/types/views";

export function MainMenuView({ onNavigate }: MainMenuViewProps) {
  const { playerName, createRoom, clearError } = useGameStore();

  return (
	  <div className="flex flex-col gap-4">
		<SteampunkButton variant="sherlock" size="lg" onClick={() => createRoom(playerName)}>
		  Créer une partie
		</SteampunkButton>

		<SteampunkButton variant="neutral" size="lg" onClick={() => { clearError(); onNavigate('JOIN'); }}>
		  Rejoindre une partie
		</SteampunkButton>

		<div className="h-0.5 w-24 bg-linear-to-r from-transparent via-[#c9a56d] to-transparent mx-auto mt-2 mb-2 opacity-50" />

		<SteampunkButton variant="neutral" size="lg" onClick={() => onNavigate('PROFILE')}>
		  Mon profil
		</SteampunkButton>
	  </div>
  );
}
