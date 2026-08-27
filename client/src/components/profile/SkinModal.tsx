import {useState} from 'react';
import Image from 'next/image';
import {Check, KeyRound, Lock, Palette} from 'lucide-react';
import {getSkin, SKINS, type SkinDef} from '@timebomb/shared';
import {useGameStore} from '@/store/useGameStore';
import {hasSkinTextures} from '@/skins';
import {Button} from '@/components/ui';
import {WikiModal} from '@/components/wiki/WikiModal';
import type {SkinModalProps, SkinOptionProps} from './types';

/** A pack the player owns: click to equip it. */
function SkinOption({skin, isActive, onSelect}: SkinOptionProps) {
  return (
      <button
          onClick={onSelect}
          disabled={isActive}
          className={`group relative flex items-center gap-4 rounded-xl border p-3 text-left transition-all
          ${isActive
              ? 'border-gold bg-black/50 cursor-default'
              : 'border-bronze/40 bg-black/25 hover:-translate-y-0.5 hover:border-gold hover:bg-black/40 active:scale-[0.99]'}`}
      >
        <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-bronze/30 bg-black/40">
          <Image src={skin.preview} alt={skin.name} fill className="object-contain p-1"/>
        </span>

        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold uppercase tracking-widest text-cream">{skin.name}</span>
            {isActive && (
                <span className="flex items-center gap-1 rounded-full border border-gold/50 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                  <Check size={11}/> Équipé
                </span>
            )}
          </span>
          <span className="text-xs leading-snug text-white/50">{skin.description}</span>
        </span>
      </button>
  );
}

/** A secret pack still under wraps: no name, no preview, just a hint. */
function LockedSkinTeaser() {
  return (
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-bronze/40 bg-black/15 p-3">
        <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border border-bronze/30 bg-black/40 text-brass/60">
          <Lock size={20}/>
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-serif text-sm font-bold uppercase tracking-widest text-white/35">Pack verrouillé</span>
          <span className="text-xs leading-snug text-white/40">
            Un mot de passe circule quelque part. À vous de le trouver.
          </span>
        </span>
      </div>
  );
}

/** Skin picker: equip an owned pack, or redeem a password to unlock a secret one. */
export function SkinModal({isOpen, onClose}: SkinModalProps) {
  const {activeSkin, unlockedSkins, setActiveSkin, unlockSkin} = useGameStore();

  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockedName, setUnlockedName] = useState<string | null>(null);

  // A pack with no texture shipped in this build would resolve to the default
  // one anyway: never offer it.
  const isUsable = (skin: SkinDef) => !skin.isSecret || hasSkinTextures(skin.id);
  const owned = SKINS.filter(skin => unlockedSkins.includes(skin.id) && isUsable(skin));
  const lockedCount = SKINS.filter(skin => skin.isSecret && !unlockedSkins.includes(skin.id)).length;

  const handleUnlock = async () => {
    const candidate = password.trim();
    if (!candidate || isSubmitting) return;

    setIsSubmitting(true);
    setUnlockError(null);
    setUnlockedName(null);

    const response = await unlockSkin(candidate);
    setIsSubmitting(false);

    if (response.success) {
      setPassword('');
      setUnlockedName(getSkin(response.skinId)?.name ?? response.skinId);
    } else {
      setUnlockError(response.error);
    }
  };

  return (
      <WikiModal isOpen={isOpen} onClose={onClose} title="Apparence" icon={<Palette size={18}/>}>
        <div className="flex flex-col gap-3">
          <p className="text-xs leading-relaxed text-white/50">
            Choisissez le pack de textures du jeu. Un pack ne remplace que les visuels qu&apos;il fournit :
            tout le reste garde l&apos;apparence classique.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {owned.map(skin => (
                <SkinOption
                    key={skin.id}
                    skin={skin}
                    isActive={skin.id === activeSkin}
                    onSelect={() => setActiveSkin(skin.id)}
                />
            ))}
            {lockedCount > 0 && <LockedSkinTeaser/>}
          </div>
        </div>

        {lockedCount > 0 && (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold">
                <KeyRound size={14}/> Mot de passe
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    value={password}
                    placeholder="Saisissez le mot de passe secret"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-bronze/60 bg-black/50 px-4 py-3 text-sm tracking-wide text-white transition-all focus:border-gold focus:outline-none"
                />
                <Button variant="sherlock" size="sm" icon={<KeyRound/>} onClick={handleUnlock}
                        disabled={isSubmitting || password.trim().length === 0}>
                  {isSubmitting ? '...' : 'Débloquer'}
                </Button>
              </div>

              {unlockError && (
                  <p className="text-xs font-bold uppercase tracking-wide text-moriarty">{unlockError}</p>
              )}
              {unlockedName && (
                  <p className="text-xs font-bold uppercase tracking-wide text-green-400">
                    Pack « {unlockedName} » débloqué et équipé !
                  </p>
              )}
            </div>
        )}
      </WikiModal>
  );
}
