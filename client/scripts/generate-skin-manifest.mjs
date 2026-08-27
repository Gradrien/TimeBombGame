/**
 * Generates the skin manifest consumed by `src/skins/resolve.ts`.
 *
 * A texture pack only overrides the assets it actually ships: the resolver
 * needs to know, without touching the network, which files exist in
 * `public/assets/skins/<pack>/` so a missing texture silently falls back to the
 * default one. Scanning the folder at build time keeps that list in sync — add
 * a PNG to a pack and it is picked up on the next `npm run dev` / `npm run build`.
 */

import {mkdirSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, posix, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skinsDir = join(clientDir, 'public', 'assets', 'skins');
const outFile = join(clientDir, 'src', 'skins', 'manifest.generated.ts');

/** Every file of a pack, as paths relative to the pack root, POSIX-style. */
function listFiles(dir, prefix = '') {
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const rel = prefix ? posix.join(prefix, entry) : entry;
    if (statSync(full).isDirectory()) files.push(...listFiles(full, rel));
    else files.push(rel);
  }
  return files;
}

const packs = {};
try {
  for (const pack of readdirSync(skinsDir).sort()) {
    if (pack.startsWith('.')) continue;
    if (!statSync(join(skinsDir, pack)).isDirectory()) continue;
    packs[pack] = listFiles(join(skinsDir, pack));
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // No skins folder at all: an empty manifest keeps everything on the default pack.
}

const entries = Object.entries(packs)
    .map(([pack, files]) => `  ${JSON.stringify(pack)}: [\n${files.map(f => `    ${JSON.stringify(f)},`).join('\n')}\n  ],`)
    .join('\n');

const contents = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`npm run skins:manifest\` (also wired into \`dev\` and \`build\`) after
 * adding or removing textures in \`public/assets/skins/\`.
 *
 * Maps each texture pack to the files it ships, relative to the pack root.
 */

export const SKIN_FILES: Record<string, readonly string[]> = {
${entries}
};
`;

mkdirSync(dirname(outFile), {recursive: true});
writeFileSync(outFile, contents);
console.log(`✔ Skin manifest: ${Object.keys(packs).length} pack(s) → ${relative(clientDir, outFile)}`);
