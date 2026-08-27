import Image from 'next/image';
import {motion} from 'framer-motion';
import {getRoleCard} from '@/utils/assets';
import {useSkinAsset} from '@/skins';
import {cn} from '@/components/ui';
import type {PlayerResultCardProps} from './types';

export function PlayerResultCard({
                                   player, index, glow, isWinning, isMe, inMenus, skinIndex,
                                 }: PlayerResultCardProps) {
  const disconnected = player.connected === false;
  const skinned = useSkinAsset();
  // "Back in the lobby" and "disconnected" share the same visual treatment
  // (dimmed name + golden italic label).
  const muted = inMenus || disconnected;

  return (
      <motion.div
          initial={{opacity: 0, y: 16, scale: 0.92}}
          animate={{opacity: 1, y: 0, scale: 1}}
          transition={{delay: 0.2 + index * 0.06, duration: 0.35}}
          className="flex w-20 sm:w-28 landscape:w-20 flex-col items-center"
      >
        <div className="relative flex items-center justify-center">
          {/* Team glow for winners only — no border, no box */}
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
                src={skinned(getRoleCard(player.role, skinIndex))}
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
                muted ? 'text-bronze' : isMe ? 'text-gold-bright' : 'text-cream',
            )}
        >
          {player.name}
        </span>

        {muted && (
            <span className="text-[10px] italic tracking-wide text-gold leading-tight text-center">
              {inMenus ? '(au lobby)' : '(déconnecté…)'}
            </span>
        )}
      </motion.div>
  );
}
