import {motion} from 'framer-motion';
import {isOnTeam} from '@timebomb/shared';
import {useGameStore} from '@/store/useGameStore';
import {getPlayerSkinIndex} from '@/utils/assets';
import {Button, TEAM} from '@/components/ui';
import {TeamRow} from './TeamRow';

export function EndView() {
  const {gameState, socket, playerId, leaveRoom, restartGame} = useGameStore();

  if (!gameState || !socket || gameState.status !== 'FINISHED') return null;

  const winner = gameState.winner ?? 'SHERLOCK';
  const theme = TEAM[winner];
  const me = gameState.players.find(p => p.id === playerId);

  const iWon = isOnTeam(me?.role, winner);

  const restartReady = gameState.restartReady ?? [];
  const iAmReady = restartReady.includes(playerId);

  const winners = gameState.players.filter(p => isOnTeam(p.role, winner));
  const losers = gameState.players.filter(p => !isOnTeam(p.role, winner));

  return (
      <main className="relative flex h-dvh w-full flex-col items-center bg-black/65 backdrop-blur-md text-white select-none overflow-hidden">

        {/* Soft halo in the winning team's color — pure light, no frame */}
        <div
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[42rem] rounded-full blur-[120px] opacity-40"
            style={{background: `radial-gradient(circle, ${theme.glow}, transparent 70%)`}}
        />

        {/* Title */}
        <motion.div
            initial={{opacity: 0, y: -16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.45, ease: 'easeOut'}}
            className="relative z-10 shrink-0 flex flex-col items-center gap-2 px-4 pt-7 pb-3 landscape:pt-4 landscape:pb-2 text-center"
        >
          <h1 className="font-serif text-2xl sm:text-4xl landscape:text-2xl font-bold uppercase leading-none tracking-[0.16em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            <span style={{color: theme.accent, textShadow: `0 0 24px ${theme.glow}`}}>{theme.label}</span>
            <span className="text-cream"> l&#39;emporte</span>
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

        {/* Teams board */}
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
                getSkinIndex={(id) => getPlayerSkinIndex(gameState.players, id)}
            />

            {/* Glowing separator between winners and losers */}
            {winners.length > 0 && losers.length > 0 && (
                <div className="relative flex items-center justify-center">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent"/>
                  <span className="absolute px-3 text-[10px] font-bold uppercase tracking-[0.4em] text-bronze">
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
                getSkinIndex={(id) => getPlayerSkinIndex(gameState.players, id)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 shrink-0 flex flex-col items-center gap-2 w-full px-4 pb-6 pt-3 landscape:pb-3">
          <div className="flex flex-row gap-3 sm:gap-5 justify-center">
            <Button
                variant="sherlock"
                size="lg"
                disabled={iAmReady}
                onClick={() => restartGame(gameState.roomId)}
            >
              {iAmReady ? 'En attente…' : 'Rejouer'}
            </Button>
            <Button
                variant="moriarty"
                size="lg"
                onClick={() => leaveRoom(gameState.roomId)}
            >
              Sortir
            </Button>
          </div>
        </div>
      </main>
  );
}
