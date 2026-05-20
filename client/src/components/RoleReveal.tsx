// client/src/components/RoleReveal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import SteampunkButton from './Button';
import { getRoleImage, ASSETS } from '@/utils/assets';
import type { RoleRevealProps } from '@/types/types';

const ROLE_INFO: Record<string, { name: string; team: string; desc: string; color: string }> = {
  SHERLOCK: {
	name: "Sherlock",
	team: "Services Secrets",
	desc: "Désamorcez la bombe avant la fin de la 4ème manche. Trouvez vos alliés et coupez les bons câbles.",
	color: "#60a5fa",
  },
  MORIARTY: {
	name: "Moriarty",
	team: "Syndicat du Crime",
	desc: "Faites exploser la bombe ou empêchez Sherlock de la désamorcer. Mentez et manipulez.",
	color: "#ef4444",
  },
  BROUILLEUR: {
	name: "Brouilleur",
	team: "Syndicat du Crime",
	desc: "Vous travaillez pour Moriarty. Votre présence brouille la Loupe (90% de chance) si on l'utilise sur vous.",
	color: "#a855f7",
  }
};

export function RoleReveal({
							 role,
							 revealed,
							 isConfirming,
							 onReveal,
							 onConfirm,
							 skinIndex = 1
						   }: RoleRevealProps) {
  const config = ROLE_INFO[role] || ROLE_INFO['SHERLOCK'];
  const characterImg = getRoleImage(role, skinIndex);

  return (
	  <motion.div
		  initial={{ opacity: 0 }}
		  animate={{ opacity: 1 }}
		  exit={{ opacity: 0, transition: { duration: 0.2 } }}
		  className="fixed inset-0 z-[100] bg-[#0a0a0a] overflow-hidden flex items-center justify-center"
	  >
		{/* Background : Texture Steampunk sombre */}
		<div className="absolute inset-0 opacity-10 pointer-events-none"
			 style={{ backgroundImage: "url('/assets/textures/metal_plate.png')", backgroundSize: 'cover' }} />

		<AnimatePresence mode="wait">
		  {!revealed ? (
			  /* --- ÉTAT 1 : CARD BACK (MASQUÉ OU EN ATTENTE) --- */
			  <motion.div
				  key="hidden"
				  initial={{ opacity: 0, scale: 0.95 }}
				  animate={{ opacity: 1, scale: 1 }}
				  exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)", transition: { duration: 0.15 } }}
				  className={`relative w-full h-full flex flex-col items-center justify-center ${!isConfirming ? 'cursor-pointer group' : ''}`}
				  onClick={!isConfirming ? onReveal : undefined}
			  >
				<motion.div
					animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
					transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
					className="absolute w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-[80px] bg-green-500"
				/>

				<motion.div
					animate={{ y: [0, -6, 0] }}
					transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
					className="relative w-full h-[45vh] landscape:h-[65vh] flex items-end justify-center z-10"
				>
				  <Image
					  src={ASSETS.ROLE_BACK}
					  alt="Identité secrète"
					  fill
					  priority
					  className="object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
				  />
				</motion.div>

				<motion.p
					animate={{ opacity: [0.4, 1, 0.4] }}
					transition={{ repeat: Infinity, duration: 1.5 }}
					className="mt-8 text-[#f3e7d3] font-serif tracking-[0.2em] uppercase text-xs sm:text-sm z-10 text-center px-4"
				>
				  {isConfirming ? 'En attente des autres joueurs...' : 'Touchez pour révéler votre rôle'}
				</motion.p>
			  </motion.div>
		  ) : (
			  /* --- ÉTAT 2 : UNIQUE CHARACTER REVEAL --- */
			  <motion.div
				  key="revealed"
				  initial={{ opacity: 0 }}
				  animate={{ opacity: 1 }}
				  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
				  className="relative w-full h-full max-w-7xl mx-auto flex flex-col landscape:flex-row"
			  >
				{/* --- PARTIE GAUCHE : LE PERSONNAGE --- */}
				<div className="relative w-full h-[45vh] landscape:h-full landscape:w-1/2 flex items-end justify-center shrink-0">
				  <motion.div
					  initial={{ scale: 0.5, opacity: 0 }}
					  animate={{ scale: 1.2, opacity: 0.35 }}
					  transition={{ duration: 0.6, ease: "easeOut" }}
					  className="absolute bottom-10 landscape:bottom-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-[450px] lg:h-[450px] rounded-full blur-[80px] lg:blur-[120px]"
					  style={{ backgroundColor: config.color }}
				  />

				  <motion.div
					  initial={{ x: -60, opacity: 0 }}
					  animate={{ x: 0, opacity: 1 }}
					  transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
					  className="relative w-full h-full max-h-[45vh] landscape:max-h-[85vh]"
				  >
					<Image
						src={characterImg}
						alt={config.name}
						fill
						priority
						className="object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
					/>
				  </motion.div>
				  <div className="absolute bottom-0 left-0 w-full h-16 sm:h-24 landscape:h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
				</div>

				{/* --- PARTIE DROITE : TEXTE ET ACTION --- */}
				<motion.div
					initial={{ x: 20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.3, delay: 0.1 }}
					className="w-full landscape:w-1/2 h-[55vh] landscape:h-full flex flex-col justify-center gap-3 sm:gap-6 z-10 p-6 sm:p-12 overflow-y-auto custom-scrollbar"
				>
				  <div className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]" style={{ color: config.color }}>
                  {config.team}
                </span>
					<h1 className="text-3xl sm:text-5xl landscape:text-4xl lg:landscape:text-6xl font-serif font-black text-[#f3e7d3] uppercase tracking-tighter">
					  {config.name}
					</h1>
				  </div>

				  <div className="h-[2px] w-12 sm:w-20 shrink-0" style={{ backgroundColor: config.color }} />

				  <p className="text-[#f3e7d3]/80 text-sm sm:text-lg landscape:text-base lg:landscape:text-xl leading-relaxed max-w-md font-serif italic">
					"{config.desc}"
				  </p>

				  <div className="mt-2 sm:mt-4 shrink-0">
					<SteampunkButton
						variant={role === 'SHERLOCK' ? 'sherlock' : 'moriarty'}
						size="md"
						onClick={onConfirm}
					>
					  Compris, Chef !
					</SteampunkButton>
				  </div>
				</motion.div>
			  </motion.div>
		  )}
		</AnimatePresence>

		<div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/textures/noise.png')]" />
	  </motion.div>
  );
}
