import {useState} from 'react';
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import type {LobbyViewProps} from "@/types/views";
import {Info, Timer, Dices, Settings2, ChevronDown} from 'lucide-react';
import {LoupeWikiModal} from '@/components/LoupeWikiModal';
import {ChaosWikiModal} from '@/components/ChaosWikiModal';
import {MAX_PLAYERS} from '@timebomb/shared';

export function LobbyView({gameState, playerName, onStart}: LobbyViewProps) {
  const {toggleLoupeMode, toggleTimerMode, toggleChaosMode, leaveRoom} = useGameStore();
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [isChaosWikiOpen, setIsChaosWikiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isHost = gameState.players.find((p) => p.name === playerName)?.isHost;
  const canStart = gameState.players.length >= 4 && gameState.players.length <= MAX_PLAYERS;
  const canUseLoupe = gameState.players.length >= 5;

  const activeModesCount =
	  (gameState.isLoupeModeEnabled ? 1 : 0) +
	  (gameState.isTimerModeEnabled ? 1 : 0) +
	  (gameState.isChaosModeEnabled ? 1 : 0);

  return (
	  <main
		  className="flex min-h-screen flex-col items-center bg-black/40 text-white p-4 relative overflow-y-auto justify-center">
		<h2 className="text-3xl font-bold mb-2 tracking-wide drop-shadow-md font-serif text-[#f3e7d3] mt-4 lg:mt-0">ROOM {gameState.roomId}</h2>
		<p className="mb-6 font-serif tracking-wide text-[#f3e7d3]">En attente de joueurs...
		  ({gameState.players.length}/{MAX_PLAYERS})</p>

		{/* Conteneur responsive : colonne sur mobile portrait, deux colonnes en paysage / écran large */}
		<div
			className="w-full max-w-sm landscape:max-w-3xl lg:max-w-3xl flex flex-col landscape:flex-row lg:flex-row landscape:items-start lg:items-start gap-6 z-10">

		  {/* ========================================= */}
		  {/* BLOC PARAMÈTRES / EXTENSIONS  */}
		  {/* ========================================= */}
		  <div
			  className="relative w-full landscape:flex-1 lg:flex-1 bg-[#1a1510]/40 backdrop-blur-md rounded-2xl border border-[#c9a56d]/30 shadow-2xl overflow-hidden">
			<div className="absolute inset-0 opacity-10 pointer-events-none"
				 style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)"}}/>

			{/* --- En-tête rétractable --- */}
			<button
				type="button"
				onClick={() => setIsSettingsOpen((v) => !v)}
				className="w-full flex items-center justify-between gap-3 p-4 relative z-10 cursor-pointer hover:bg-white/5 transition-colors"
			>
			<span
				className="flex items-center gap-2 font-serif tracking-wide text-sm text-[#f3e7d3] uppercase drop-shadow-md font-bold">
			  <Settings2 size={18} className="text-[#c9a56d]"/>
			  Modes de jeu
			  {activeModesCount > 0 && (
				  <span
					  className="text-xs bg-[#1d4463]/80 border border-[#60a5fa]/50 text-[#60a5fa] px-2 py-0.5 rounded-full normal-case">
					{activeModesCount} actif{activeModesCount > 1 ? 's' : ''}
				  </span>
			  )}
			</span>
			  <ChevronDown
				  size={20}
				  className={`text-[#c9a56d] transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`}
			  />
			</button>

			{/* --- Contenu rétractable --- */}
			<div
				className={`relative z-10 flex flex-col gap-6 px-6 transition-all duration-300 ${isSettingsOpen ? 'max-h-[600px] opacity-100 pb-6 pt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}
			>

			  {/* --- Extension Loupe --- */}
			  <div className="flex flex-col gap-2 relative z-10">
				<div className="flex items-center justify-between">
				  <div className="flex items-center gap-3">
              <span className="font-serif tracking-wide text-sm text-[#f3e7d3] uppercase drop-shadow-md font-bold">
                Extension Loupe
              </span>
					<button
						onClick={() => setIsWikiOpen(true)}
						className="text-[#8a6842] hover:text-[#60a5fa] hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-all cursor-help"
						title="Comment fonctionne l'extension ?"
					>
					  <Info size={18}/>
					</button>
				  </div>

				  {isHost ? (
					  <label
						  className={`relative inline-flex items-center ${canUseLoupe ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 saturate-0'}`}>
						<input
							type="checkbox"
							className="sr-only"
							checked={!!gameState.isLoupeModeEnabled}
							disabled={!canUseLoupe}
							onChange={(e) => toggleLoupeMode(gameState.roomId, e.target.checked)}
						/>
						<div
							className={`w-14 h-7 rounded-full shadow-inner transition-colors duration-500 relative border ${gameState.isLoupeModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50' : 'bg-black/60 border-[#8a6842]/60'}`}>
						  <div
							  className={`absolute top-0.5 left-0.5 bg-linear-to-b from-[#f3e7d3] via-[#c9a56d] to-[#b08a57] border border-[#f3e7d3]/40 rounded-full h-5 w-5 transition-transform duration-500 shadow-md ${gameState.isLoupeModeEnabled ? 'translate-x-7' : 'translate-x-0'}`}/>
						</div>
					  </label>
				  ) : (
					  <span
						  className={`font-serif text-xs font-bold px-3 py-1.5 rounded-lg border shadow-inner tracking-wide uppercase ${gameState.isLoupeModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50 text-[#60a5fa]' : 'bg-black/40 border-[#8a6842]/60 text-[#b08a57]'}`}>
                {gameState.isLoupeModeEnabled ? 'Activé' : 'Désactivé'}
              </span>
				  )}
				</div>
				{!canUseLoupe && isHost && (
					<p className="text-sm text-zinc-100 font-serif italic tracking-wide">5 joueurs minimum requis</p>
				)}
			  </div>

			  <div
				  className="w-full h-px bg-gradient-to-r from-transparent via-[#c9a56d]/30 to-transparent relative z-10"/>

			  {/* --- Extension Chronomètre --- */}
			  <div className="flex flex-col gap-3 relative z-10">
				<div className="flex items-center justify-between">
				  <div className="flex items-center gap-3">
              <span className="font-serif tracking-wide text-sm text-[#f3e7d3] uppercase drop-shadow-md font-bold">
                Mode Chrono
              </span>
					<Timer size={18} className="text-[#8a6842]"/>
				  </div>

				  {isHost ? (
					  <label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							className="sr-only"
							checked={!!gameState.isTimerModeEnabled}
							onChange={(e) => toggleTimerMode(gameState.roomId, e.target.checked, gameState.timerDuration || 15)}
						/>
						<div
							className={`w-14 h-7 rounded-full shadow-inner transition-colors duration-500 relative border ${gameState.isTimerModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50 text-[#60a5fa]' : 'bg-black/60 border-[#8a6842]/60'}`}>
						  <div
							  className={`absolute top-0.5 left-0.5 bg-linear-to-b from-[#f3e7d3] via-[#c9a56d] to-[#b08a57] border border-[#f3e7d3]/40 rounded-full h-5 w-5 transition-transform duration-500 shadow-md ${gameState.isTimerModeEnabled ? 'translate-x-7' : 'translate-x-0'}`}/>
						</div>
					  </label>
				  ) : (
					  <span
						  className={`font-serif text-xs font-bold px-3 py-1.5 rounded-lg border shadow-inner tracking-wide uppercase ${gameState.isTimerModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50 text-[#60a5fa]' : 'bg-black/40 border-[#8a6842]/60 text-[#b08a57]'}`}>
                {gameState.isTimerModeEnabled ? 'Activé' : 'Désactivé'}
              </span>
				  )}
				</div>

				{/* Sélection du temps (Visible si activé) */}
				{gameState.isTimerModeEnabled && (
					<div className="flex items-center justify-between mt-1 animate-in fade-in slide-in-from-top-2">
					  <span className="text-sm font-serif italic text-zinc-100">Temps par tour :</span>
					  {isHost ? (
						  <select
							  value={gameState.timerDuration || 15}
							  onChange={(e) => toggleTimerMode(gameState.roomId, true, Number(e.target.value))}
							  className="bg-black/60 border border-[#8a6842]/60 text-[#f3e7d3] text-sm rounded-lg px-3 py-1 focus:outline-none focus:border-[#c9a56d] font-bold"
						  >
							<option value={10}>10 Secondes</option>
							<option value={15}>15 Secondes</option>
							<option value={30}>30 Secondes</option>
							<option value={60}>60 Secondes</option>
						  </select>
					  ) : (
						  <span className="text-[#f3e7d3] font-bold">{gameState.timerDuration} Secondes</span>
					  )}
					</div>
				)}
			  </div>

			  <div
				  className="w-full h-px bg-gradient-to-r from-transparent via-[#c9a56d]/30 to-transparent relative z-10"/>

			  {/* --- Mode Chaos --- */}
			  <div className="flex flex-col gap-2 relative z-10">
				<div className="flex items-center justify-between">
				  <div className="flex items-center gap-3">
            <span className="font-serif tracking-wide text-sm text-[#f3e7d3] uppercase drop-shadow-md font-bold">
              Mode Chaos
            </span>
					<button
						onClick={() => setIsChaosWikiOpen(true)}
						className="text-[#8a6842] hover:text-[#c9a56d] hover:drop-shadow-[0_0_8px_rgba(201,165,109,0.6)] transition-all cursor-help"
						title="Comment fonctionne le Mode Chaos ?"
					>
					  <Dices size={18}/>
					</button>
				  </div>

				  {isHost ? (
					  <label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							className="sr-only"
							checked={!!gameState.isChaosModeEnabled}
							onChange={(e) => toggleChaosMode(gameState.roomId, e.target.checked)}
						/>
						<div
							className={`w-14 h-7 rounded-full shadow-inner transition-colors duration-500 relative border ${gameState.isChaosModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50' : 'bg-black/60 border-[#8a6842]/60'}`}>
						  <div
							  className={`absolute top-0.5 left-0.5 bg-linear-to-b from-[#f3e7d3] via-[#c9a56d] to-[#b08a57] border border-[#f3e7d3]/40 rounded-full h-5 w-5 transition-transform duration-500 shadow-md ${gameState.isChaosModeEnabled ? 'translate-x-7' : 'translate-x-0'}`}/>
						</div>
					  </label>
				  ) : (
					  <span
						  className={`font-serif text-xs font-bold px-3 py-1.5 rounded-lg border shadow-inner tracking-wide uppercase ${gameState.isChaosModeEnabled ? 'bg-[#1d4463]/80 border-[#60a5fa]/50 text-[#60a5fa]' : 'bg-black/40 border-[#8a6842]/60 text-[#b08a57]'}`}>
                {gameState.isChaosModeEnabled ? 'Activé' : 'Désactivé'}
              </span>
				  )}
				</div>
				{gameState.isChaosModeEnabled && isHost && (
					<p className="text-sm text-zinc-100 font-serif italic tracking-wide">Distribution des rôles
					  aléatoire et cachée</p>
				)}
			  </div>
			</div>
		  </div>

		  {/* ========================================= */}
		  {/* LISTE DES JOUEURS                           */}
		  {/* ========================================= */}
		  <ul className="w-full landscape:flex-1 lg:flex-1 space-y-3 z-10">
			{gameState.players.map((p) => (
				<li key={p.id}
					className="relative p-4 bg-[#1a1510]/60 backdrop-blur-sm rounded-xl flex justify-between items-center border border-[#8a6842]/50 shadow-lg group overflow-hidden">
				  <div className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20"
					   style={{backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)"}}/>
				  <span
					  className={`font-serif tracking-wide font-bold drop-shadow-sm flex items-center relative z-10 ${p.connected === false ? 'text-[#8a6842] line-through opacity-60' : 'text-[#f3e7d3]'}`}>
              {p.name}
					{p.name === playerName &&
                        <span className="text-[#c9a56d] text-sm ml-2 italic tracking-wide no-underline">(Toi)</span>}
					{p.connected === false &&
                        <span className="text-[#b08a57] text-xs ml-2 italic tracking-wide no-underline">(déconnecté…)</span>}
            </span>

				  {p.isHost && (
					  <span
						  className="text-xs bg-black/40 border border-[#c9a56d]/50 px-3 py-1.5 rounded-lg text-[#c9a56d] font-bold uppercase tracking-wide shadow-inner relative z-10">
                Hôte
              </span>
				  )}
				</li>
			))}
		  </ul>

		</div>

		<div className="flex flex-row gap-4 w-full justify-center z-10 my-8">
		  {isHost && (
			  <SteampunkButton variant="sherlock" size="lg" onClick={onStart} disabled={!canStart}>
				{canStart ? 'Lancer la partie' : `4 à ${MAX_PLAYERS} joueurs requis`}
			  </SteampunkButton>
		  )}
		  <SteampunkButton variant="moriarty" size="lg" onClick={() => leaveRoom(gameState.roomId)}>
			Quitter le lobby
		  </SteampunkButton>
		</div>

		<LoupeWikiModal isOpen={isWikiOpen} onClose={() => setIsWikiOpen(false)}/>
		<ChaosWikiModal isOpen={isChaosWikiOpen} onClose={() => setIsChaosWikiOpen(false)}/>
	  </main>
  );
}
