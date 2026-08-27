import Image from 'next/image';
import {Lock} from 'lucide-react';
import {getBadgeImage, ASSETS} from '@/utils/assets';
import {useSkinAsset} from '@/skins';
import {tierStyle} from './tiers';
import type {AchievementCardProps} from './types';

export function AchievementCard({ach}: AchievementCardProps) {
  const t = tierStyle(ach.tier);
  const skinned = useSkinAsset();
  const colored = ach.isUnlocked || (ach.tier && ach.tier > 1);

  return (
      <div
          className={`group relative flex flex-col items-center rounded-xl p-3 text-center transition-all duration-300
          ${ach.isUnlocked
              ? 'border border-transparent bg-black/25 hover:-translate-y-0.5'
              : 'bg-black/15'}`}
          style={ach.isUnlocked ? {borderColor: `${t.ring}55`} : undefined}
      >
        {/* Rarity glow for unlocked achievements */}
        {ach.isUnlocked && (
            <div
                className="pointer-events-none absolute inset-0 rounded-xl opacity-40 transition-opacity group-hover:opacity-70"
                style={{background: `radial-gradient(circle at 50% 0%, ${t.glow}, transparent 70%)`}}/>
        )}

        <div className="relative z-10 mb-2 flex items-center justify-center h-20 w-20">
          <Image
              fill
              src={skinned(getBadgeImage(ach.id))}
              alt={ach.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = skinned(ASSETS.BADGE_PLACEHOLDER);
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

        <h3 className={`relative z-10 mb-1 text-[11px] font-bold uppercase leading-tight tracking-wide sm:text-xs ${ach.isUnlocked ? 'text-cream' : 'text-white/40'}`}>
          {ach.name}
        </h3>
        <p className="relative z-10 mb-2 text-[10px] italic leading-snug text-white/45">
          {ach.description}
        </p>

        <div className="relative z-10 mt-auto w-full pt-1">
          {ach.isOneShot ? (
              <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${ach.isUnlocked ? 'text-gold-bright' : 'text-white/30'}`}>
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
                    className={`text-[10px] font-bold uppercase tracking-wide ${ach.isUnlocked ? 'text-gold-bright' : 'text-white/40'}`}>
                  {ach.isUnlocked ? '✦ Accompli' : `${ach.progress} / ${ach.target}`}
                </span>
              </div>
          )}
        </div>
      </div>
  );
}
