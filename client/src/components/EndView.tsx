import Image from 'next/image';
import {motion} from 'framer-motion';
import type {Player} from '@timebomb/shared';
import {useGameStore} from '@/store/useGameStore';
import {getRoleCard} from '@/utils/assets';
import SteampunkButton from '@/components/Button';
import {TEAM, cn} from '@/components/ui';

export function EndView() {
  const {gameState, socket, playerId, leaveRoom, restartGame} = useGameStore();

  if (!gameState || !socket || gameState.status !== 'FINISHED') return null;

  const winner = gameState.winner ?? 'SHERLOCK';
  const theme = TEAM[winner];
  const me = gameState.players.find(p => p.id === playerId);
  const iWon = me?.role === winner;

  const restartReady = gameState.restartReady ?? [];
  const iAmReady = restartReady.includes(playerId);

  const winners = gameState.players.filter(p => p.role === winner);
  const losers = gameState.players.filter(p => p.role !== winner);

  const getSkinIndex = (targetId: string, role?: string) => {
	const index = gameState.players.findIndex(p => p.id === targetId);
	if (role === 'SHERLOCK') return (index % 5) + 1;
	if (role === 'MORIARTY') return (index % 3) + 1;
	return 1;
  };

  return (
	  <main className="relative flex h-dvh w-full flex-col items-center bg-black/65 backdrop-blur-md text-white select-none overflow-hidden">

		{/* Halo diffus de l'équipe gagnante — pas de cadre, juste de la lumière */}
		<div
			className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[42rem] rounded-full blur-[120px] opacity-40"
			style={{background: `radial-gradient(circle, ${theme.glow}, transparent 70%)`}}
		/>

		{/* ===================== TITRE (sans conteneur) ===================== */}
		<motion.div
			initial={{opacity: 0, y: -16}}
			animate={{opacity: 1, y: 0}}
			transition={{duration: 0.45, ease: 'easeOut'}}
			className="relative z-10 shrink-0 flex flex-col items-center gap-2 px-4 pt-7 pb-3 landscape:pt-4 landscape:pb-2 text-center"
		>
		  <h1 className="font-serif text-2xl sm:text-4xl landscape:text-2xl font-bold uppercase leading-none tracking-[0.16em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
			<span style={{color: theme.accent, textShadow: `0 0 24px ${theme.glow}`}}>{theme.label}</span>
			<span className="text-[#f3e7d3]"> l&#39;emporte</span>
		  </h1>

		  {me && (
			  <p
				  className="font-serif text-xs sm:text-sm uppercase tracking-[0.3em]"
				  style={{color: iWon ? theme.accent : '#b08a57'}}
			  >
				{iWon ? '✦ Vous avez gagné' : 'Vous avez perdu'}
			  </p>
		  )}
		</motion.div>

		{/* ===================== TABLEAU DES ÉQUIPES ===================== */}
		<div className="relative z-10 flex-1 w-full overflow-y-auto no-scrollbar px-3 sm:px-6">
		  <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-7 landscape:gap-4 py-3">

			<TeamRow
				label="Vainqueurs"
				accent={theme.accent}
				glow={theme.glow}
				players={winners}
				isWinning
				playerId={playerId}
				restartReady={restartReady}
				getSkinIndex={getSkinIndex}
			/>

			{/* Séparateur lumineux entre vainqueurs et vaincus */}
			{winners.length > 0 && losers.length > 0 && (
				<div className="relative flex items-center justify-center">
				  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c9a56d]/40 to-transparent"/>
				  <span className="absolute px-3 text-[10px] font-bold uppercase tracking-[0.4em] text-[#8a6842]">
					✦
				  </span>
				</div>
			)}

			<TeamRow
				label="Vaincus"
				accent="#8a6842"
				glow="rgba(138,104,66,0.25)"
				players={losers}
				isWinning={false}
				playerId={playerId}
				restartReady={restartReady}
				getSkinIndex={getSkinIndex}
			/>
		  </div>
		</div>

		{/* ===================== ACTIONS ===================== */}
		<div className="relative z-10 shrink-0 flex flex-col items-center gap-2 w-full px-4 pb-6 pt-3 landscape:pb-3">
		  <div className="flex flex-row gap-3 sm:gap-5 justify-center">
			<SteampunkButton
				variant="sherlock"
				size="lg"
				disabled={iAmReady}
				onClick={() => restartGame(gameState.roomId)}
			>
			  {iAmReady ? 'En attente…' : 'Rejouer'}
			</SteampunkButton>
			<SteampunkButton
				variant="moriarty"
				size="lg"
				onClick={() => leaveRoom(gameState.roomId)}
			>
			  Sortir
			</SteampunkButton>
		  </div>
		</div>
	  </main>
  );
}

/* ================================================================== */
/*  SOUS-COMPOSANTS                                                     */
/* ================================================================== */

function TeamRow({
				   label, accent, glow, players, isWinning, playerId, restartReady, getSkinIndex,
				 }: {
  label: string;
  accent: string;
  glow: string;
  players: Player[];
  isWinning: boolean;
  playerId: string;
  restartReady: string[];
  getSkinIndex: (id: string, role?: string) => number;
}) {
  if (players.length === 0) return null;

  return (
	  <section className="flex flex-col items-center gap-2.5 sm:gap-3">
		<div className="flex items-center gap-2.5">
		  <span className="h-px w-6 sm:w-10" style={{background: `linear-gradient(to right, transparent, ${accent})`}}/>
		  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-[0.3em]" style={{color: accent}}>
			{label}
		  </h2>
		  <span className="h-px w-6 sm:w-10" style={{background: `linear-gradient(to left, transparent, ${accent})`}}/>
		</div>

		<div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5 landscape:gap-3">
		  {players.map((p, i) => (
			  <PlayerResult
				  key={p.id}
				  player={p}
				  index={i}
				  accent={accent}
				  glow={glow}
				  isWinning={isWinning}
				  isMe={p.id === playerId}
				  inMenus={restartReady.includes(p.id)}
				  skinIndex={getSkinIndex(p.id, p.role)}
			  />
		  ))}
		</div>
	  </section>
  );
}

function PlayerResult({
						player, index, accent, glow, isWinning, isMe, inMenus, skinIndex,
					  }: {
  player: Player;
  index: number;
  accent: string;
  glow: string;
  isWinning: boolean;
  isMe: boolean;
  inMenus: boolean;
  skinIndex: number;
}) {
  const disconnected = player.connected === false;
  // "Dans les menus" et "Déconnecté" reprennent le même traitement visuel
  // (nom estompé + libellé doré en italique).
  const muted = inMenus || disconnected;

  return (
	  <motion.div
		  initial={{opacity: 0, y: 16, scale: 0.92}}
		  animate={{opacity: 1, y: 0, scale: 1}}
		  transition={{delay: 0.2 + index * 0.06, duration: 0.35}}
		  className="flex w-20 sm:w-28 landscape:w-20 flex-col items-center"
	  >
		<div className="relative flex items-center justify-center">
		  {/* Lueur d'équipe (vainqueurs uniquement), sans bord ni boîte */}
		  {isWinning && (
			  <div
				  className="pointer-events-none absolute inset-0 -m-2 rounded-full blur-xl"
				  style={{background: `radial-gradient(circle, ${glow}, transparent 70%)`}}
			  />
		  )}
		  <div
			  className={cn(
				  'relative h-28 w-[4.6rem] sm:h-40 sm:w-[6.6rem] landscape:h-28 landscape:w-[4.6rem] transition-all',
				  isWinning ? '' : 'grayscale-[0.5] opacity-60',
			  )}
		  >
			<Image
				src={getRoleCard(player.role, skinIndex)}
				alt={player.role ?? 'role'}
				fill
				className="object-contain drop-shadow-xl"
				style={isWinning ? {filter: `drop-shadow(0 0 10px ${glow})`} : undefined}
			/>
		  </div>
		</div>

		<span
			className={cn(
				'mt-1.5 w-full truncate text-center text-[11px] sm:text-xs font-bold tracking-wide',
				muted ? 'text-[#8a6842]' : isMe ? 'text-[#ffd479]' : 'text-[#f3e7d3]',
			)}
		>
		  {player.name}
		</span>

		{muted && (
			<span className="text-[10px] italic tracking-wide text-[#c9a56d] leading-tight text-center">
			  {inMenus ? '(au lobby)' : '(déconnecté…)'}
			</span>
		)}
	  </motion.div>
  );
}
