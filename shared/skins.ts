/**
 * Skin catalog (texture packs).
 *
 * A skin only ever *overrides* assets: every texture it does not ship falls
 * back to the default pack, so a partially drawn pack is perfectly valid.
 * Files live in `client/public/assets/skins/<id>/`, mirroring the layout of
 * `client/public/assets/`.
 *
 * The unlock password of a secret skin is NEVER declared here: this module is
 * bundled into the client. Passwords live server-side only
 * (`server/src/services/skinService.ts`).
 */

export const DEFAULT_SKIN_ID = 'default';

export interface SkinDef {
  id: string;
  name: string;
  description: string;
  /** Asset shown as the pack's thumbnail, relative to `/assets`. */
  preview: string;
  /** A secret pack stays hidden until a password unlocks it. */
  isSecret: boolean;
}

export const SKINS: SkinDef[] = [
  {
	id: DEFAULT_SKIN_ID,
	name: 'Classique',
	description: "Les textures d'origine de Time Bomb.",
	preview: '/assets/card-bomb.png',
	isSecret: false,
  },
  {
	id: 'Imori',
	name: 'Imori',
	description: 'Un pack secret, réservé à ceux qui connaissent le mot de passe.',
	preview: '/assets/skins/Imori/card-bomb.png',
	isSecret: true,
  },
];

export function getSkin(skinId: string): SkinDef | undefined {
  return SKINS.find(skin => skin.id === skinId);
}

export function isSkinId(value: unknown): value is string {
  return typeof value === 'string' && SKINS.some(skin => skin.id === value);
}
