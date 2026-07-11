import {useState} from 'react';
import {Info, Timer, Dices, Settings2, ChevronDown, UserX} from 'lucide-react';
import {LOUPE_MIN_PLAYERS, MAX_PLAYERS, MIN_PLAYERS, TURN_DURATION_OPTIONS} from '@timebomb/shared';
import {useGameStore} from '@/store/useGameStore';
import {Button, Stripes} from '@/components/ui';
import {LoupeWikiModal} from '@/components/wiki/LoupeWikiModal';
import {ChaosWikiModal} from '@/components/wiki/ChaosWikiModal';
import {ModeRow} from './ModeRow';
import {ModeDivider} from './ModeDivider';
import type {LobbyViewProps} from './types';

export function LobbyView({gameState, onStart}: LobbyViewProps) {
  const {playerId, toggleLoupeMode, toggleTimerMode, toggleChaosMode, leaveRoom, kickPlayer} = useGameStore();
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [isChaosWikiOpen, setIsChaosWikiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Identity goes through the id (unique and stable), never through the nickname.
  const me = gameState.players.find((p) => p.id === playerId);
  const isHost = !!me?.isHost;
  // While the previous game is still FINISHED, some players have not clicked
  // "Rejouer" yet: show them as "(fin de partie)" and block the start until
  // they are back.
  const restartReady = gameState.restartReady ?? [];
  const isStillInGame = (targetId: string) =>
      gameState.status === 'FINISHED' && !restartReady.includes(targetId);
  const waitingForPlayers = gameState.status === 'FINISHED';
  const canStart =
      !waitingForPlayers && gameState.players.length >= MIN_PLAYERS && gameState.players.length <= MAX_PLAYERS;
  const canUseLoupe = gameState.players.length >= LOUPE_MIN_PLAYERS;

  const activeModesCount =
      (gameState.isLoupeModeEnabled ? 1 : 0) +
      (gameState.isTimerModeEnabled ? 1 : 0) +
      (gameState.isChaosModeEnabled ? 1 : 0);

  return (
      <main
          className="flex min-h-screen flex-col items-center bg-black/40 text-white p-4 relative overflow-y-auto justify-center">
        <h2 className="text-3xl font-bold mb-2 tracking-wide drop-shadow-md font-serif text-cream mt-4 lg:mt-0">ROOM {gameState.roomId}</h2>
        <p className="mb-6 font-serif tracking-wide text-cream">En attente de joueurs...
          ({gameState.players.length}/{MAX_PLAYERS})</p>

        {/* Single column in portrait, two columns in landscape / wide screens */}
        <div
            className="w-full max-w-sm landscape:max-w-3xl lg:max-w-3xl flex flex-col landscape:flex-row lg:flex-row landscape:items-start lg:items-start gap-6 z-10">

          {/* Game modes panel */}
          <div
              className="relative w-full landscape:flex-1 lg:flex-1 bg-ink/40 backdrop-blur-md rounded-2xl border border-gold/30 shadow-2xl overflow-hidden">
            <Stripes className="opacity-10"/>

            {/* Collapsible header */}
            <button
                type="button"
                onClick={() => setIsSettingsOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 p-4 relative z-10 cursor-pointer hover:bg-white/5 transition-colors"
            >
            <span
                className="flex items-center gap-2 font-serif tracking-wide text-sm text-cream uppercase drop-shadow-md font-bold">
              <Settings2 size={18} className="text-gold"/>
              Modes de jeu
              {activeModesCount > 0 && (
                  <span
                      className="text-xs bg-sherlock-deep/80 border border-sherlock/50 text-sherlock px-2 py-0.5 rounded-full normal-case">
                    {activeModesCount} actif{activeModesCount > 1 ? 's' : ''}
                  </span>
              )}
            </span>
              <ChevronDown
                  size={20}
                  className={`text-gold transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Collapsible content */}
            <div
                className={`relative z-10 flex flex-col gap-6 px-6 transition-all duration-300 ${isSettingsOpen ? 'max-h-[600px] opacity-100 pb-6 pt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}
            >

              <ModeRow
                  label="Extension Loupe"
                  action={
                    <button
                        onClick={() => setIsWikiOpen(true)}
                        className="text-bronze hover:text-sherlock hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-all cursor-help"
                        title="Comment fonctionne l'extension ?"
                    >
                      <Info size={18}/>
                    </button>
                  }
                  isHost={isHost}
                  enabled={!!gameState.isLoupeModeEnabled}
                  disabled={!canUseLoupe}
                  onChange={(enabled) => toggleLoupeMode(gameState.roomId, enabled)}
              >
                {!canUseLoupe && isHost && (
                    <p className="text-sm text-gold font-serif italic tracking-wide">{LOUPE_MIN_PLAYERS} joueurs
                      minimum requis</p>
                )}
              </ModeRow>

              <ModeDivider/>

              <ModeRow
                  label="Mode Chrono"
                  action={<Timer size={18} className="text-bronze"/>}
                  isHost={isHost}
                  enabled={!!gameState.isTimerModeEnabled}
                  onChange={(enabled) => toggleTimerMode(gameState.roomId, enabled, gameState.timerDuration || TURN_DURATION_OPTIONS[1])}
              >
                {/* Turn duration picker (visible when enabled) */}
                {gameState.isTimerModeEnabled && (
                    <div className="flex items-center justify-between mt-1 animate-menu-in">
                      <span className="text-sm font-serif italic text-gold">Temps par tour :</span>
                      {isHost ? (
                          <select
                              value={gameState.timerDuration || TURN_DURATION_OPTIONS[1]}
                              onChange={(e) => toggleTimerMode(gameState.roomId, true, Number(e.target.value))}
                              className="bg-black/60 border border-bronze/60 text-cream text-sm rounded-lg px-3 py-1 focus:outline-none focus:border-gold font-bold"
                          >
                            {TURN_DURATION_OPTIONS.map(seconds => (
                                <option key={seconds} value={seconds}>{seconds} Secondes</option>
                            ))}
                          </select>
                      ) : (
                          <span className="text-cream font-bold">{gameState.timerDuration} Secondes</span>
                      )}
                    </div>
                )}
              </ModeRow>

              <ModeDivider/>

              <ModeRow
                  label="Mode Chaos"
                  action={
                    <button
                        onClick={() => setIsChaosWikiOpen(true)}
                        className="text-bronze hover:text-gold hover:drop-shadow-[0_0_8px_rgba(201,165,109,0.6)] transition-all cursor-help"
                        title="Comment fonctionne le Mode Chaos ?"
                    >
                      <Dices size={18}/>
                    </button>
                  }
                  isHost={isHost}
                  enabled={!!gameState.isChaosModeEnabled}
                  onChange={(enabled) => toggleChaosMode(gameState.roomId, enabled)}
              />
            </div>
          </div>

          {/* Player list */}
          <ul className="w-full landscape:flex-1 lg:flex-1 space-y-3 z-10">
            {gameState.players.map((p) => (
                <li key={p.id}
                    className="relative p-4 bg-ink/60 backdrop-blur-sm rounded-xl flex justify-between items-center border border-bronze/50 shadow-lg group overflow-hidden">
                  <Stripes className="opacity-10 group-hover:opacity-20"/>
                  <span
                      className={`font-serif tracking-wide font-bold drop-shadow-sm flex items-center relative z-10 ${(p.connected === false || isStillInGame(p.id)) ? 'text-bronze' : 'text-cream'}`}>
            {p.name}
                    {p.id === playerId &&
                        <span className="text-gold text-sm ml-2 italic tracking-wide no-underline">(Toi)</span>}
                    {p.connected === false &&
                        <span className="text-gold text-xs ml-2 italic tracking-wide">(Déconnecté…)</span>}
                    {p.connected !== false && isStillInGame(p.id) &&
                        <span className="text-gold text-xs ml-2 italic tracking-wide">(Fin de partie)</span>}
          </span>

                  <div className="flex items-center gap-2 relative z-10">
                    {p.isHost && (
                        <span
                            className="text-xs bg-black/40 border border-gold/50 px-3 py-1.5 rounded-lg text-gold font-bold uppercase tracking-wide shadow-inner">
                Hôte
              </span>
                    )}
                    {/* The host can kick any other player from the lobby */}
                    {isHost && p.id !== me?.id && (
                        <button
                            onClick={() => kickPlayer(gameState.roomId, p.id)}
                            title={`Expulser ${p.name}`}
                            aria-label={`Expulser ${p.name}`}
                            className="text-bronze hover:text-[#b54848] hover:drop-shadow-[0_0_8px_rgba(181,72,72,0.6)] transition-all cursor-pointer p-1"
                        >
                          <UserX size={18}/>
                        </button>
                    )}
                  </div>
                </li>
            ))}
          </ul>

        </div>

        <div className="flex flex-row gap-4 w-full justify-center z-10 my-8">
          {isHost && (
              <Button variant="sherlock" size="lg" onClick={onStart} disabled={!canStart}>
                {canStart
                    ? 'Lancer la partie'
                    : waitingForPlayers
                        ? 'En attente des joueurs…'
                        : `${MIN_PLAYERS} à ${MAX_PLAYERS} joueurs requis`}
              </Button>
          )}
          <Button variant="moriarty" size="lg" onClick={() => leaveRoom(gameState.roomId)}>
            Quitter le lobby
          </Button>
        </div>

        <LoupeWikiModal isOpen={isWikiOpen} onClose={() => setIsWikiOpen(false)}/>
        <ChaosWikiModal isOpen={isChaosWikiOpen} onClose={() => setIsChaosWikiOpen(false)}/>
      </main>
  );
}
