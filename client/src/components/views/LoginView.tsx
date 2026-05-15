// client/src/components/LoginView.tsx
import { useGameStore } from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import type {LoginViewProps} from "@/types/views";

export function LoginView({ onLoginSuccess, onError }: LoginViewProps) {
  const { playerName, setPlayerName, pinCode, setPinCode, login, clearError } = useGameStore();

  const handleLogin = async () => {
	onError(null);
	clearError();
	if (playerName.length < 3) return onError("Le pseudo doit faire au moins 3 caractères.");
	if (!pinCode || pinCode.length < 4 || pinCode.length > 6) return onError("Le code PIN doit contenir entre 4 et 6 chiffres.");

	const success = await login(playerName, pinCode);
	if (success) onLoginSuccess();
  };

  return (
	  <div className="flex flex-col gap-5">
		<div className="bg-[#1a1510]/30 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-[#c9a56d]/30 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
		  <h2 className="text-center font-serif text-[#f3e7d3] text-sm sm:text-base tracking-wide uppercase mb-1 relative z-10 font-bold drop-shadow-md">
			Identification requise
		  </h2>

		  <input
			  type="text"
			  placeholder="Pseudo"
			  maxLength={12}
			  className="relative z-10 w-full p-4 rounded-xl border border-[#8a6842]/60 bg-black/40 text-[#f3e7d3]  focus:outline-none focus:border-[#c9a56d] focus:bg-black/60 shadow-inner text-md transition-all placeholder:text-[#8a6842]/70"
			  value={playerName}
			  onChange={(e) => setPlayerName(e.target.value)}
		  />

		  <input
			  type="password"
			  pattern="\d*"
			  placeholder="Code secret"
			  maxLength={6}
			  className="relative z-10 w-full p-4 rounded-xl border border-[#8a6842]/60 bg-black/40 text-[#f3e7d3] focus:outline-none focus:border-[#c9a56d] focus:bg-black/60 shadow-inner text-md transition-all placeholder:text-[#8a6842]/70 placeholder:tracking-wide"
			  value={pinCode || ''}
			  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
		  />
		</div>

		<SteampunkButton variant="sherlock" size="lg" disabled={!playerName || !pinCode} onClick={handleLogin}>
		  S'identifier
		</SteampunkButton>
	  </div>
  );
}
