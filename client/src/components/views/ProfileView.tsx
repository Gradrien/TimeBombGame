import {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
  ArrowLeft, Pencil, LogOut, Check, X,
  Lock,
} from 'lucide-react';
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import {getBadgeImage, ASSETS} from '@/utils/assets';
import {COLORS} from '@/components/ui/tokens';
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
  winsSherlock?: number;
  winsMoriarty?: number;
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
  const moriartyGames = userData.gamesAsMoriarty || 0;
  const totalRoles = sherlockGames + moriartyGames;
  const sherlockShare = totalRoles > 0 ? Math.round((sherlockGames / totalRoles) * 100) : 50;
  const moriartyShare = totalRoles > 0 ? 100 - sherlockShare : 50;

  // Taux de victoire par camp
  const sherlockWins = userData.winsSherlock || 0;
  const moriartyWins = userData.winsMoriarty || 0;
  const sherlockWinRate = sherlockGames > 0 ? Math.round((sherlockWins / sherlockGames) * 100) : 0;
  const moriartyWinRate = moriartyGames > 0 ? Math.round((moriartyWins / moriartyGames) * 100) : 0;

  const achievements: Achievement[] = userData.formattedAchievements ?? [];
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completion = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
	  <div className="w-full text-white">
		<div className="mx-auto w-full max-w-6xl px-2 py-3 sm:px-4 sm:py-4 flex flex-col gap-4">

		  {/* ----- RETOUR ----- */}
		  <button
			  onClick={onBack}
			  className="group flex items-center gap-2 self-start text-[#c9a56d] hover:text-[#f3e7d3] transition-colors font-serif uppercase tracking-widest text-xs"
		  >
			<span
				className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c9a56d]/40 bg-black/30 group-hover:border-[#c9a56d] group-hover:bg-black/50 transition-all">
			  <ArrowLeft size={15}/>
			</span>
			Retour
		  </button>

		  {/* ===================================================================
		      EN-TÊTE : identité + performance globale + par camp (une seule surface)
		  =================================================================== */}
		  <Panel
			  as="section"
			  motionProps={{initial: {opacity: 0, y: 12}, animate: {opacity: 1, y: 0}, transition: {duration: 0.4}}}
		  >
			{/* Ligne identité + performance globale (alignement inchangé) */}
			<div
				className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:gap-8 md:text-left">

			  {/* Identité */}
			  <div className="flex min-w-0 flex-1 flex-col items-center gap-3 md:items-start">
				{isEditingName ? (
					<div className="flex w-full max-w-sm flex-col gap-3">
					  <input
						  type="text"
						  value={newName}
						  autoFocus
						  onChange={(e) => setNewName(e.target.value)}
						  onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
						  disabled={isSaving}
						  className="w-full rounded-xl border border-[#8a6842]/60 bg-black/50 px-4 py-3 text-center font-bold tracking-wide text-white transition-all focus:border-[#c9a56d] focus:outline-none md:text-left"
					  />
					  <div className="flex justify-center gap-3 md:justify-start">
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
					  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c9a56d]/70">Dossier
						d&apos;enquêteur</p>
					  <h1 className="max-w-full break-words font-serif text-3xl font-bold leading-tight tracking-wide drop-shadow-md sm:text-4xl">
						{playerName}
					  </h1>
					  <div className="flex justify-center gap-2.5 md:justify-start">
						<IconAction icon={<Pencil size={15}/>} label="Renommer"
									onClick={() => {
									  setIsEditingName(true);
									  setNewName(playerName);
									}}/>
						<IconAction icon={<LogOut size={15}/>} label="Déconnexion" danger onClick={logout}/>
					  </div>
					</>
				)}
			  </div>

			  {/* Performance globale */}
			  {!isEditingName && (
				  <div className="flex items-center gap-5 sm:gap-6">
					<Radial value={winRate} color={COLORS.gold}/>
					<div className="flex items-stretch gap-4 sm:gap-6">
					  <StatFigure value={gamesPlayed} label="Parties" accent={COLORS.cream}/>
					  <div className="w-px self-stretch bg-[#c9a56d]/15"/>
					  <StatFigure value={gamesWon} label="Victoires" accent={COLORS.goldBright}/>
					</div>
				  </div>
			  )}
			</div>

			<Divider/>

			{/* Par camp — pleine largeur, deux colonnes sur écran large */}
			<div className="grid gap-x-10 gap-y-6 md:grid-cols-2">

			  {/* Répartition des rôles joués */}
			  <div className="flex flex-col">
				<p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Répartition des rôles</p>
				<div className="mb-1.5 flex items-center justify-between text-xs font-bold">
				  <span className="text-[#60a5fa]">Sherlock</span>
				  <span className="text-[#ef4444]">Moriarty</span>
				</div>
				<div className="relative flex h-6 w-full overflow-hidden rounded-full border border-black/40 shadow-inner">
				  <motion.div
					  initial={{width: 0}}
					  animate={{width: `${sherlockShare}%`}}
					  transition={{duration: 0.8, ease: "easeOut"}}
					  className="h-full bg-gradient-to-r from-[#1d4463] to-[#3b82f6]"
				  />
				  <div className="h-full flex-1 bg-gradient-to-r from-[#7f1d1d] to-[#ef4444]"/>
				</div>
				<div className="mt-1.5 flex justify-between text-[11px] font-bold text-white/45">
				  <span>{sherlockShare}% · {sherlockGames} parties</span>
				  <span>{moriartyGames} parties · {moriartyShare}%</span>
				</div>
			  </div>

			  {/* Taux de victoire par camp */}
			  <div className="flex flex-col">
				<p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Taux de victoire par
				  camp</p>
				<div className="flex flex-1 flex-col justify-center gap-4">
				  <CampRow label="Sherlock" rate={sherlockWinRate} wins={sherlockWins} games={sherlockGames}
						   color={COLORS.sherlock}/>
				  <CampRow label="Moriarty" rate={moriartyWinRate} wins={moriartyWins} games={moriartyGames}
						   color={COLORS.moriarty}/>
				</div>
			  </div>
			</div>
		  </Panel>

		  {/* ===================================================================
		      HAUTS FAITS
		  =================================================================== */}
		  <Panel
			  as="section"
			  motionProps={{
				initial: {opacity: 0, y: 12}, animate: {opacity: 1, y: 0},
				transition: {duration: 0.4, delay: 0.12},
			  }}
		  >
			<div className="mb-2 flex items-center justify-between gap-3">
			  <SectionTitle noMargin>Hauts faits</SectionTitle>
			  <span
				  className="whitespace-nowrap rounded-full border border-[#c9a56d]/40 bg-black/40 px-3 py-1 text-xs font-bold text-[#c9a56d]">
				{unlockedCount} / {totalCount}
			  </span>
			</div>
			<div className="mb-5 h-1.5 w-full overflow-hidden rounded-full border border-[#8a6842]/30 bg-black/50">
			  <motion.div
				  initial={{width: 0}}
				  animate={{width: `${completion}%`}}
				  transition={{duration: 1, ease: "easeOut"}}
				  className="h-full bg-gradient-to-r from-[#8a6842] to-[#ffd479]"
			  />
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
			  {achievements.map((ach) => (
				  <AchievementCard key={ach.id} ach={ach}/>
			  ))}
			</div>
		  </Panel>
		</div>
	  </div>
  );
}

/* ================================================================== */
/*  SOUS-COMPOSANTS                                                     */
/* ================================================================== */

/* Surface de base — une seule couche visuelle, jamais imbriquée */
function Panel({children, className = "", as = "div", motionProps}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
  motionProps?: React.ComponentProps<typeof motion.div>;
}) {
  const Comp = as === "section" ? motion.section : motion.div;
  return (
	  <Comp
		  {...motionProps}
		  className={`relative overflow-hidden rounded-2xl border border-[#c9a56d]/25 bg-[#1a1510]/55 p-5 shadow-2xl backdrop-blur-md sm:p-6 ${className}`}
	  >
		<div className="pointer-events-none absolute inset-0 opacity-[0.06]"
			 style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)"}}/>
		<div className="relative z-10">{children}</div>
	  </Comp>
  );
}

function Divider({className = ""}: { className?: string }) {
  return <div className={`my-4 h-px w-full bg-[#c9a56d]/15 ${className}`}/>;
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
			  : 'border-[#b08a57]/50 bg-black/30 text-[#f3e7d3] hover:border-[#c9a56d] hover:bg-black/50'}`}
	  >
		{icon}
		<span className="hidden sm:inline">{label}</span>
	  </button>
  );
}

/* Chiffre simple (pas de bordure) pour l'en-tête */
function StatFigure({value, label, accent}: {
  value: string | number;
  label: string;
  accent: string;
}) {
  return (
	  <div className="flex min-w-14 flex-col items-center justify-center gap-1">
		<span className="text-2xl font-bold leading-none drop-shadow sm:text-3xl" style={{color: accent}}>{value}</span>
		<span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/45">
		  {label}
		</span>
	  </div>
  );
}

/* Ligne de taux de victoire d'un camp (barre pleine largeur, pas de boîte) */
function CampRow({label, rate, wins, games, color}: {
  label: string;
  rate: number;
  wins: number;
  games: number;
  color: string;
}) {
  return (
	  <div className="flex flex-col gap-2">
		<div className="flex items-center justify-between">
		  <span className="flex items-center gap-2 text-sm font-bold" style={{color}}>
			<span className="h-2.5 w-2.5 rounded-full"
				  style={{backgroundColor: color, boxShadow: `0 0 8px ${color}`}}/>
			{label}
		  </span>
		  <span className="flex items-baseline gap-1.5">
			<span className="text-xl font-bold leading-none" style={{color}}>{rate}%</span>
			<span className="text-[10px] font-bold text-white/40">{wins}/{games}</span>
		  </span>
		</div>
		<div className="h-2 w-full overflow-hidden rounded-full border border-black/40 bg-black/40">
		  <motion.div
			  initial={{width: 0}}
			  animate={{width: `${rate}%`}}
			  transition={{duration: 0.8, ease: "easeOut"}}
			  className="h-full rounded-full"
			  style={{backgroundColor: color, boxShadow: `0 0 10px ${color}66`}}
		  />
		</div>
	  </div>
  );
}

/* Anneau de progression SVG (taux de victoire global) */
function Radial({value, color}: { value: number; color: string }) {
  const size = 100;
  const stroke = 9;
  const pad = 8; // marge intérieure pour que la lueur ne soit pas rognée par le bord du SVG
  const r = (size - stroke) / 2 - pad;
  const c = 2 * Math.PI * r;

  return (
	  <div className="relative shrink-0" style={{width: size, height: size}}>
		<svg width={size} height={size} className="-rotate-90 overflow-visible">
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
		  className={`group relative flex flex-col items-center rounded-xl p-3 text-center transition-all duration-300
		  ${ach.isUnlocked
			  ? 'border border-transparent bg-black/25 hover:-translate-y-0.5'
			  : 'bg-black/15'}`}
		  style={ach.isUnlocked ? {borderColor: `${t.ring}55`} : undefined}
	  >
		{/* lueur de rareté pour les débloqués */}
		{ach.isUnlocked && (
			<div
				className="pointer-events-none absolute inset-0 rounded-xl opacity-40 transition-opacity group-hover:opacity-70"
				style={{background: `radial-gradient(circle at 50% 0%, ${t.glow}, transparent 70%)`}}/>
		)}

		<div className="relative z-10 mb-2 flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
		  <Image
			  fill
			  src={getBadgeImage(ach.id)}
			  alt={ach.name}
			  onError={(e) => {
				(e.currentTarget as HTMLImageElement).src = ASSETS.BADGE_PLACEHOLDER;
			  }}
			  className={`object-contain transition-all duration-500
			  ${colored ? 'group-hover:scale-110' : 'grayscale opacity-40 brightness-50'}`}
			  style={ach.isUnlocked ? {filter: `drop-shadow(0 0 10px ${t.glow})`} : undefined}
		  />
		  {!ach.isUnlocked && (
			  <span
				  className="absolute -bottom-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/80">
				<Lock size={11} className="text-white/40"/>
			  </span>
		  )}
		</div>

		<h3 className={`relative z-10 mb-1 text-[11px] font-bold uppercase leading-tight tracking-wide sm:text-xs ${ach.isUnlocked ? 'text-[#f3e7d3]' : 'text-white/40'}`}>
		  {ach.name}
		</h3>
		<p className="relative z-10 mb-2 text-[10px] italic leading-snug text-white/45 line-clamp-2">
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
