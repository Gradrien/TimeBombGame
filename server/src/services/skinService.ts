import {DEFAULT_SKIN_ID, getSkin, SKINS} from '@timebomb/shared';
import {prisma} from '../db';

/**
 * Texture packs (skins) owned by a player.
 *
 * Responsibility (SRP): deciding what a player owns and what they may equip.
 * The catalog itself (names, previews) is shared with the client in
 * `shared/skins.ts`; the *passwords* live here and never leave the server, so
 * a secret pack cannot be unlocked by reading the client bundle.
 *
 * A password can be overridden per pack through the environment
 * (`SKIN_PASSWORD_<ID>`), handy to rotate a secret without a redeploy.
 */

/** Unlock passwords of the secret packs, indexed by skin id. */
const SKIN_PASSWORDS: Record<string, string> = {
  Imori: 'Imorhind',
};

/** Comparison is trimmed and case-insensitive: this is a fun easter egg, not a credential. */
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function passwordFor(skinId: string): string | undefined {
  return process.env[`SKIN_PASSWORD_${skinId.toUpperCase()}`] ?? SKIN_PASSWORDS[skinId];
}

/** Ids of the packs a player owns — the default pack is always included. */
export async function getUnlockedSkins(userId: string): Promise<string[]> {
  const rows = await prisma.userSkin.findMany({
	where: {userId},
	select: {skinId: true},
  });
  // Ignore rows pointing at a pack that no longer exists in the catalog.
  const owned = rows.map(row => row.skinId).filter(skinId => getSkin(skinId));
  return [DEFAULT_SKIN_ID, ...owned];
}

/**
 * Redeems a password and unlocks the matching secret pack.
 * Idempotent: re-entering the password of an already owned pack succeeds.
 *
 * @throws Error with a user-facing (French) message when no pack matches.
 */
export async function unlockSkinWithPassword(userId: string, password: unknown): Promise<string> {
  const candidate = typeof password === 'string' ? normalize(password) : '';
  if (!candidate) throw new Error('Mot de passe requis.');

  const skin = SKINS.find(({id, isSecret}) => {
	const expected = isSecret ? passwordFor(id) : undefined;
	return expected !== undefined && normalize(expected) === candidate;
  });
  if (!skin) throw new Error('Ce mot de passe ne correspond à aucun pack.');

  await prisma.userSkin.upsert({
	where: {userId_skinId: {userId, skinId: skin.id}},
	update: {},
	create: {userId, skinId: skin.id},
  });

  return skin.id;
}

/**
 * Equips a pack the player owns.
 * @throws Error with a user-facing (French) message when the pack is unknown or locked.
 */
export async function setActiveSkin(userId: string, skinId: unknown): Promise<void> {
  if (typeof skinId !== 'string' || !getSkin(skinId)) {
	throw new Error('Pack de textures inconnu.');
  }

  const unlocked = await getUnlockedSkins(userId);
  if (!unlocked.includes(skinId)) throw new Error("Ce pack n'est pas débloqué.");

  await prisma.user.update({where: {id: userId}, data: {activeSkin: skinId}});
}
