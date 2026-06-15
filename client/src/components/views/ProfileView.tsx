import {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
  ArrowLeft, Pencil, LogOut, Check, X,
  Trophy, Gamepad2, Crown, Lock,
} from 'lucide-react';
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import {getBadgeImage, ASSETS} from '@/utils/assets';
import Image from 'next/image';

interface Achievement {
  id: string;
  name: string;
  description: string;
  target?: number;
  tier?: number;
  isUnlocked: boolean;
  progress: number;
  percent: number;
  isOneShot: boolean;
}

interface UserProfile {
  gamesPlayed?: number;
  gamesWon?: number;
  gamesAsSherlock?: number;
  gamesAsMoriarty?: number;
  formattedAchievements?: Achievement[];
}

/* Couleur de rareté d'un haut fait selon son palier */
function tierStyle(tier?: number) {
  if (tier === 3) return {ring: "#ffd479", glow: "rgba(255,212,121,0.55)", label: "Or"};
  if (tier === 2) return {ring: "#d8d8e0", glow: "rgba(216,216,224,0.45)", label: "Argent"};
  return {ring: "#c9854a", glow: "rgba(201,133,74,0.45)", label: "Bronze"};
}

export function ProfileView({onBack}: { onBack: () => void }) {
  const {playerName, playerId, logout, socket, setPlayerName} = useGameStore();
  const [userData, setUserData] = useState<UserProfile | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
	if (socket && playerId) {
	  socket.emit('getUserProfile', playerId, (data: UserProfile) => setUserData(data));
	}
  }, [socket, playerId]);

  const handleUpdateName = () => {
	const trimmed = newName.trim();
	if (!trimmed || trimmed === playerName) {
	  setIsEditingName(false);
	  return;
	}

	setIsSaving(true);
	socket?.emit('updateUsername', {playerId, newName: trimmed}, (response: { success: boolean }) => {
	  setIsSaving(false);
	  if (response.success) {
		setPlayerName(trimmed);
		const saved = sessionStorage.getItem('timebomb_session');
		if (saved) {
		  const parsed = JSON.parse(saved);
		  parsed.username = trimmed;
		  sessionStorage.setItem('timebomb_session', JSON.stringify(parsed));
		}
		setIsEditingName(false);
	  }
	});
  };

  if (!userData) return (
	  <div
		  className="flex h-screen items-center justify-center text-[#c9a56d] animate-pulse uppercase tracking-wide text-xs">
		Ouverture du dossier...
	  </div>
  );

  const gamesPlayed = userData.gamesPlayed || 0;
  const gamesWon = userData.gamesWon || 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const sherlockGames = userData.gamesAsSherlock || 0;
  const totalRoles = sherlockGames + (userData.gamesAsMoriarty || 0);
  const sherlockRate = totalRoles > 0 ? Math.round((sherlockGames / totalRoles) * 100) : 50;
  const moriartyRate = totalRoles > 0 ? 100 - sherlockRate : 50;

  const achievements: Achievement[] = userData.formattedAchievements ?? [];
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completion = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;


  return (
	  <div className="w-full text-white">
		<div className="mx-auto w-full max-w-6xl px-1 py-2 sm:px-4 sm:py-4 flex flex-col gap-5 sm:gap-6">

		  {/* ----- BARRE DE NAVIGATION ----- */}
		  <button
			  onClick={onBack}
			  className="group flex items-center gap-2 self-start text-[#c9a56d] hover:text-[#f3e7d3] transition-colors font-serif uppercase tracking-widest text-xs"
		  >
			<span
				className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a56d]/40 bg-black/30 group-hover:border-[#c9a56d] group-hover:bg-black/50 transition-all">
			  <ArrowLeft size={16}/>
			</span>
			Retour
		  </button>

		  {/* ===================== HERO / BANNIÈRE ===================== */}
		  <motion.section
			  initial={{opacity: 0, y: 12}}
			  animate={{opacity: 1, y: 0}}
			  transition={{duration: 0.4}}
			  className="relative overflow-hidden rounded-3xl border border-[#c9a56d]/30 bg-[#1a1510]/55 backdrop-blur-md shadow-2xl"
		  >
			{/* halo coloré selon le rang */}
			<div
				className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full blur-3xl opacity-25"
			/>
			<div className="pointer-events-none absolute inset-0 opacity-10"
				 style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)"}}/>

			<div
				className="relative z-10 flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-8">


			  {/* NOM + RANG + ACTIONS */}
			  <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
				{isEditingName ? (
					<div className="w-full max-w-sm flex flex-col gap-3">
					  <input
						  type="text"
						  value={newName}
						  autoFocus
						  onChange={(e) => setNewName(e.target.value)}
						  onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
						  disabled={isSaving}
						  className="w-full rounded-xl border border-[#8a6842]/60 bg-black/50 px-4 py-3 text-center sm:text-left font-bold tracking-wide text-white focus:border-[#c9a56d] focus:outline-none transition-all"
					  />
					  <div className="flex gap-3 justify-center sm:justify-start">
						<SteampunkButton variant="sherlock" size="sm" icon={<Check/>} onClick={handleUpdateName}>
						  {isSaving ? '...' : 'Valider'}
						</SteampunkButton>
						<SteampunkButton variant="moriarty" size="sm" icon={<X/>}
										 onClick={() => setIsEditingName(false)}>
						  Annuler
						</SteampunkButton>
					  </div>
					</div>
				) : (
					<>
					  <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide break-words leading-tight drop-shadow-md max-w-full">
						{playerName}
					  </h1>
					  <div className="mt-1 flex gap-2.5 justify-center sm:justify-start">
						<IconAction icon={<Pencil size={15}/>} label="Renommer"
									onClick={() => {
									  setIsEditingName(true);
									  setNewName(playerName);
									}}/>
						<IconAction icon={<LogOut size={15}/>} label="Déconnexion" danger
									onClick={logout}/>
					  </div>
					</>
				)}
			  </div>
			</div>
		  </motion.section>

		  {/* ===================== CORPS : STATS + HAUTS FAITS ===================== */}
		  <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-stretch">

			{/* --------- COLONNE STATS --------- */}
			<motion.section
				initial={{opacity: 0, y: 12}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.4, delay: 0.08}}
				className="w-full lg:w-95 shrink-0 flex flex-col gap-5"
			>
			  {/* Taux de victoire — focal radial */}
			  <Panel>
				<SectionTitle>Performance</SectionTitle>
				<div className="flex items-center gap-5">
				  <Radial value={winRate} color="#c9a56d"/>
				  <div className="flex-1 grid grid-cols-1 gap-3">
					<MiniStat icon={<Gamepad2 size={16}/>} label="Parties jouées" value={gamesPlayed} accent="#f3e7d3"/>
					<MiniStat icon={<Trophy size={16}/>} label="Victoires" value={gamesWon} accent="#ffd479"/>
				  </div>
				</div>
			  </Panel>

			  {/* Allégeance Sherlock / Moriarty */}
			  <Panel>
				<SectionTitle>Allégeance</SectionTitle>
				<div className="flex justify-between text-sm font-bold mb-2">
				  <span className="text-[#60a5fa]">Sherlock</span>
				  <span className="text-[#ef4444]">Moriarty</span>
				</div>
				<div
					className="relative flex h-7 w-full overflow-hidden rounded-full border border-black/40 shadow-inner">
				  <motion.div
					  initial={{width: 0}}
					  animate={{width: `${sherlockRate}%`}}
					  transition={{duration: 0.8, ease: "easeOut"}}
					  className="h-full bg-gradient-to-r from-[#1d4463] to-[#3b82f6]"
				  />
				  <div className="h-full flex-1 bg-gradient-to-r from-[#7f1d1d] to-[#ef4444]"/>
				</div>
				<div className="mt-2 flex justify-between text-xs font-bold tracking-wide">
				  <span className="text-[#60a5fa]">{sherlockRate}%</span>
				  <span className="text-[#ef4444]">{moriartyRate}%</span>
				</div>
			  </Panel>
			</motion.section>

			{/* --------- COLONNE HAUTS FAITS --------- */}
			<motion.section
				initial={{opacity: 0, y: 12}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.4, delay: 0.16}}
				className="flex-1 min-w-0"
			>
			  <Panel className="h-full">
				<div className="flex items-center justify-between gap-3 mb-1">
				  <SectionTitle noMargin>Hauts faits</SectionTitle>
				  <span
					  className="rounded-full border border-[#c9a56d]/40 bg-black/40 px-3 py-1 text-xs font-bold text-[#c9a56d] whitespace-nowrap">
					{unlockedCount} / {totalCount}
				  </span>
				</div>
				{/* progression globale */}
				<div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-black/50 border border-[#8a6842]/30">
				  <motion.div
					  initial={{width: 0}}
					  animate={{width: `${completion}%`}}
					  transition={{duration: 1, ease: "easeOut"}}
					  className="h-full bg-gradient-to-r from-[#8a6842] to-[#ffd479]"
				  />
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
				  {achievements.map((ach) => (
					  <AchievementCard key={ach.id} ach={ach}/>
				  ))}
				</div>
			  </Panel>
			</motion.section>
		  </div>
		</div>
	  </div>
  );
}

/* ================================================================== */
/*  SOUS-COMPOSANTS                                                     */

/* ================================================================== */

function Panel({children, className = ""}: { children: React.ReactNode; className?: string }) {
  return (
	  <div
		  className={`relative overflow-hidden rounded-2xl border border-[#c9a56d]/25 bg-[#1a1510]/50 backdrop-blur-md p-5 sm:p-6 shadow-2xl ${className}`}>
		<div className="pointer-events-none absolute inset-0 opacity-[0.07]"
			 style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)"}}/>
		<div className="relative z-10">{children}</div>
	  </div>
  );
}

function SectionTitle({children, noMargin = false}: { children: React.ReactNode; noMargin?: boolean }) {
  return (
	  <h2 className={`font-serif text-sm font-bold uppercase tracking-[0.2em] text-[#c9a56d] ${noMargin ? '' : 'mb-4'}`}>
		{children}
	  </h2>
  );
}

function IconAction({icon, label, onClick, danger = false}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean
}) {
  return (
	  <button
		  onClick={onClick}
		  title={label}
		  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95
		  ${danger
			  ? 'border-[#b77b4a]/50 bg-[#6e1d26]/30 text-[#f7d8b5] hover:bg-[#6e1d26]/60'
			  : 'border-[#b08a57]/50 bg-black/30 text-[#f3e7d3] hover:bg-black/50 hover:border-[#c9a56d]'}`}
	  >
		{icon}
		<span className="hidden sm:inline">{label}</span>
	  </button>
  );
}

function MiniStat({icon, label, value, accent}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string
}) {
  return (
	  <div className="flex items-center gap-3 rounded-xl border border-[#8a6842]/30 bg-black/25 px-3 py-2">
		<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40" style={{color: accent}}>
		  {icon}
		</span>
		<div className="min-w-0">
		  <div className="text-xl font-bold leading-none drop-shadow" style={{color: accent}}>{value}</div>
		  <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45 font-bold truncate">{label}</div>
		</div>
	  </div>
  );
}

/* Anneau de progression SVG (taux de victoire) */
function Radial({value, color}: { value: number; color: string }) {
  const size = 104;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
	  <div className="relative shrink-0" style={{width: size, height: size}}>
		<svg width={size} height={size} className="-rotate-90">
		  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={stroke}/>
		  <motion.circle
			  cx={size / 2} cy={size / 2} r={r} fill="none"
			  stroke={color} strokeWidth={stroke} strokeLinecap="round"
			  strokeDasharray={c}
			  initial={{strokeDashoffset: c}}
			  animate={{strokeDashoffset: c * (1 - value / 100)}}
			  transition={{duration: 1, ease: "easeOut"}}
			  style={{filter: `drop-shadow(0 0 6px ${color}88)`}}
		  />
		</svg>
		<div className="absolute inset-0 flex flex-col items-center justify-center">
		  <span className="text-2xl font-bold leading-none drop-shadow" style={{color}}>{value}%</span>
		  <span className="mt-1 text-[9px] uppercase tracking-widest text-white/45 font-bold">Victoire</span>
		</div>
	  </div>
  );
}

function AchievementCard({ach}: { ach: Achievement }) {
  const t = tierStyle(ach.tier);
  const colored = ach.isUnlocked || (ach.tier && ach.tier > 1);

  return (
	  <div
		  className={`group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all duration-300
		  ${ach.isUnlocked
			  ? 'bg-black/30 hover:-translate-y-0.5'
			  : 'border-white/5 bg-black/20'}`}
		  style={ach.isUnlocked ? {borderColor: `${t.ring}66`} : undefined}
	  >
		{/* lueur de rareté pour les débloqués */}
		{ach.isUnlocked && (
			<div
				className="pointer-events-none absolute inset-0 rounded-xl opacity-40 transition-opacity group-hover:opacity-70"
				style={{background: `radial-gradient(circle at 50% 0%, ${t.glow}, transparent 70%)`}}/>
		)}

		<div className="relative z-10 mb-2 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center">
		  <Image
			  fill
			  src={getBadgeImage(ach.id)}
			  alt={ach.name}
			  onError={(e) => {
				(e.currentTarget as HTMLImageElement).src = ASSETS.BADGE_PLACEHOLDER;
			  }}
			  className={`object-contain transition-all duration-500
			  ${colored
				  ? 'group-hover:scale-110'
				  : 'grayscale opacity-40 brightness-50'}`}
			  style={ach.isUnlocked ? {filter: `drop-shadow(0 0 10px ${t.glow})`} : undefined}
		  />
		  {!ach.isUnlocked && (
			  <span
				  className="absolute -bottom-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/80">
				<Lock size={11} className="text-white/40"/>
			  </span>
		  )}
		</div>

		<h3 className={`relative z-10 text-[11px] sm:text-xs font-bold uppercase leading-tight tracking-wide mb-1 ${ach.isUnlocked ? 'text-[#f3e7d3]' : 'text-white/40'}`}>
		  {ach.name}
		</h3>
		<p className="relative z-10 hidden sm:block text-[10px] italic leading-snug text-white/40 mb-2 line-clamp-2">
		  {ach.description}
		</p>

		<div className="relative z-10 mt-auto w-full pt-1">
		  {ach.isOneShot ? (
			  <span
				  className={`text-[10px] font-bold uppercase tracking-wide ${ach.isUnlocked ? 'text-[#ffd479]' : 'text-white/30'}`}>
				{ach.isUnlocked ? '✦ Accompli' : 'Verrouillé'}
			  </span>
		  ) : (
			  <div className="flex flex-col gap-1.5">
				<div className="h-1.5 w-full overflow-hidden rounded-full border border-black/40 bg-black/50">
				  <div
					  className="h-full rounded-full transition-all duration-1000 ease-out"
					  style={{
						width: `${ach.isUnlocked ? 100 : ach.percent}%`,
						background: ach.isUnlocked ? t.ring : 'linear-gradient(to right, #5a4b3c, #8a6842)',
					  }}
				  />
				</div>
				<span
					className={`text-[10px] font-bold uppercase tracking-wide ${ach.isUnlocked ? 'text-[#ffd479]' : 'text-white/40'}`}>
				  {ach.isUnlocked ? '✦ Accompli' : `${ach.progress} / ${ach.target}`}
				</span>
			  </div>
		  )}
		</div>
	  </div>
  );
}
