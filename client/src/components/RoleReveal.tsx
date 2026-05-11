// client/src/components/RoleReveal.tsx
import {useState} from 'react';
import Image from 'next/image';
import {getRoleImage, ASSETS} from '@/utils/assets';

interface RoleRevealProps {
  role: string;
  revealed: boolean;
  isReady: boolean;
  isConfirming: boolean;
  onReveal: () => void;
}

export function RoleReveal({role, revealed, isReady, isConfirming, onReveal}: RoleRevealProps) {
  const [skinIndex] = useState(() => {
	if (role === 'SHERLOCK') return Math.floor(Math.random() * 5) + 1;
	if (role === 'MORIARTY') return Math.floor(Math.random() * 3) + 1;
	return 1;
  });

  const getRoleTheme = () => {
	if (role === 'SHERLOCK') return {color: 'text-blue-500', glow: 'bg-blue-600/40', name: 'Sherlock'};
	if (role === 'BROUILLEUR') return {color: 'text-purple-500', glow: 'bg-purple-600/40', name: 'Brouilleur'};
	return {color: 'text-red-500', glow: 'bg-red-600/40', name: 'Moriarty'};
  };

  const theme = getRoleTheme();
  const showClickText = !revealed && !isReady && !isConfirming;

  return (
	  <div className="relative w-full h-full flex flex-col items-center justify-center">

		{/* GLOW DE FOND LUMINEUX */}
		{revealed && (
			<div
				className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[80px] transition-opacity duration-1000 ${theme.glow}`}/>
		)}

		<div className="relative z-10 flex flex-col items-center">
		  {/* TEXTE CINÉMATIQUE (TU ES...) */}
		  <div
			  className={`text-center mb-4 sm:mb-6 landscape:mb-2 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
			<p className="text-white font-bold tracking-[0.4em] uppercase text-[10px] sm:text-xs mb-1">Tu es...</p>
			<h1 className={`text-4xl sm:text-6xl landscape:text-3xl font-black italic tracking-widest uppercase drop-shadow-2xl ${theme.color}`}>
			  {theme.name}
			</h1>
		  </div>

		  {/* CARTE ROLE */}
		  <div
			  className={`relative w-40 h-56 sm:w-60 sm:h-80 landscape:w-28 landscape:h-40 transition-transform duration-500 ${showClickText ? 'cursor-pointer hover:scale-105' : ''}`}
			  style={{transformStyle: 'preserve-3d', transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)'}}
			  onClick={() => showClickText && onReveal()}
		  >
			<div className="absolute inset-0" style={{backfaceVisibility: 'hidden'}}>
			  <Image src={ASSETS.ROLE_BACK} alt="Role Back" fill
					 className="object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.4)]"/>
			  {showClickText && (
				  <div className="absolute inset-0 flex items-center justify-center">
                <span
					className="bg-black/60 px-4 py-2 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase animate-pulse shadow-xl">
                  Cliquez
                </span>
				  </div>
			  )}
			</div>

			<div className="absolute inset-0" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
			  <Image src={getRoleImage(role, skinIndex)} alt="Role" fill className="object-contain drop-shadow-2xl"/>
			</div>
		  </div>
		</div>
	  </div>
  );
}
