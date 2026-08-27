import {DEFAULT_SKIN_ID} from '@timebomb/shared';
import {SKIN_FILES} from './manifest.generated';

/**
 * Texture routing.
 *
 * Every image path in the app is written against the default pack; this module
 * is the single place that redirects it to the active pack. A pack overrides
 * only the files it ships (see `manifest.generated.ts`), so a texture it does
 * not provide transparently keeps the default one.
 */

const ASSETS_PREFIX = '/assets/';

/** Lookup sets built once per pack, so resolution stays O(1) per image. */
const filesBySkin = new Map<string, ReadonlySet<string>>(
    Object.entries(SKIN_FILES).map(([skinId, files]) => [skinId, new Set(files)]),
);

/**
 * @param path   default-pack asset path, e.g. `/assets/roles/role-red-1.png`
 * @param skinId active pack id
 * @returns the pack's own texture when it ships one, the default path otherwise.
 */
export function resolveSkinAsset(path: string, skinId: string): string {
  if (!skinId || skinId === DEFAULT_SKIN_ID) return path;

  const files = filesBySkin.get(skinId);
  if (!files || !path.startsWith(ASSETS_PREFIX)) return path;

  const relativePath = path.slice(ASSETS_PREFIX.length);
  return files.has(relativePath) ? `${ASSETS_PREFIX}skins/${skinId}/${relativePath}` : path;
}

/** True when the pack ships at least one texture (an empty folder is not a usable pack). */
export function hasSkinTextures(skinId: string): boolean {
  return (filesBySkin.get(skinId)?.size ?? 0) > 0;
}
