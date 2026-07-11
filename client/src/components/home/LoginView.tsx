import {useGameStore} from '@/store/useGameStore';
import {Button} from '@/components/ui';
import type {LoginViewProps} from './types';

export function LoginView({onLoginSuccess, onError}: LoginViewProps) {
  const {playerName, setPlayerName, pinCode, setPinCode, login, clearError} = useGameStore();

  const handleLogin = async () => {
    onError(null);
    clearError();
    if (playerName.length < 3) return onError('Le pseudo doit faire au moins 3 caractères.');
    if (!pinCode || pinCode.length < 4 || pinCode.length > 6) return onError('Le code PIN doit contenir entre 4 et 6 chiffres.');

    const success = await login(playerName, pinCode);
    if (success) onLoginSuccess();
  };

  return (
      <div className="flex flex-col gap-5">
        <div className="bg-ink/30 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-gold/30 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
          <h2 className="text-center font-serif text-cream text-sm sm:text-base tracking-wide uppercase mb-1 relative z-10 font-bold drop-shadow-md">
            Identification requise
          </h2>

          <input
              type="text"
              placeholder="Pseudo"
              maxLength={12}
              className="relative z-10 w-full p-4 rounded-xl border border-bronze/60 bg-black/40 text-cream focus:outline-none focus:border-gold focus:bg-black/60 shadow-inner text-md transition-all placeholder:text-bronze/70"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
          />

          <input
              type="password"
              pattern="\d*"
              placeholder="Code secret"
              maxLength={6}
              className="relative z-10 w-full p-4 rounded-xl border border-bronze/60 bg-black/40 text-cream focus:outline-none focus:border-gold focus:bg-black/60 shadow-inner text-md transition-all placeholder:text-bronze/70 placeholder:tracking-wide"
              value={pinCode || ''}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <Button variant="sherlock" size="lg" disabled={!playerName || !pinCode} onClick={handleLogin}>
          S'identifier
        </Button>
      </div>
  );
}
