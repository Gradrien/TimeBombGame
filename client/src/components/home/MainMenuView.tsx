import {useState} from 'react';
import {useGameStore} from '@/store/useGameStore';
import {Button} from '@/components/ui';
import {RulesWikiModal} from '@/components/wiki/RulesWikiModal';
import type {MainMenuViewProps} from './types';

export function MainMenuView({onNavigate}: MainMenuViewProps) {
  const {createRoom, clearError} = useGameStore();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
      <>
        {/* Portrait: single column. Landscape: two columns. */}
        <div className="flex flex-col landscape:flex-row items-center justify-center gap-4 landscape:gap-8 w-full">

          <div className="flex flex-col gap-4 w-full landscape:flex-1">
            <Button variant="sherlock" size="lg" onClick={createRoom}>
              Créer une partie
            </Button>

            <Button variant="neutral" size="lg" onClick={() => { clearError(); onNavigate('JOIN'); }}>
              Rejoindre une partie
            </Button>
          </div>

          <div className="h-0.5 w-24 bg-linear-to-r from-transparent via-gold to-transparent opacity-50 shrink-0 landscape:w-px landscape:h-32 landscape:bg-linear-to-b" />

          <div className="flex flex-col gap-4 w-full landscape:flex-1">
            <Button variant="neutral" size="lg" onClick={() => onNavigate('PROFILE')}>
              Mon profil
            </Button>

            <Button variant="neutral" size="lg" onClick={() => setIsRulesOpen(true)}>
              Comment jouer ?
            </Button>
          </div>

        </div>

        <RulesWikiModal
            isOpen={isRulesOpen}
            onClose={() => setIsRulesOpen(false)}
        />
      </>
  );
}
