import type {Player, Role} from '@timebomb/shared';

/**
 * Game asset paths. Role visuals come in two variants: the fullscreen
 * character (`characters/`) and the card (`roles/`).
 */

const roleAsset = (folder: 'characters' | 'roles') => (role?: Role, skinIndex: number = 1): string => {
  if (role === 'BROUILLEUR') return `/assets/${folder}/role-red-brouilleur.png`;
  if (role === 'MORIARTY') return `/assets/${folder}/role-red-${skinIndex}.png`;
  if (role === 'SHERLOCK') return `/assets/${folder}/role-blue-${skinIndex}.png`;
  return `/assets/${folder}/role-back.png`;
};

export const getRoleImage = roleAsset('characters');
export const getRoleCard = roleAsset('roles');

export const getCardImage = (type?: string) => {
  if (type === 'BOMB') return '/assets/card-bomb.png';
  if (type === 'DEFUSE') return '/assets/card-defuse.png';
  if (type === 'LOUPE') return '/assets/card-glasses.png';
  return '/assets/card-safe.png';
};

/** Number of skins available per camp. */
const SHERLOCK_SKINS = 5;
const MORIARTY_SKINS = 3;

/**
 * A player's skin (visual variant), stable for the whole game: derived from
 * their position in the player list and their camp.
 */
export function getPlayerSkinIndex(players: Player[], playerId: string): number {
  const index = players.findIndex(p => p.id === playerId);
  if (index === -1) return 1;

  const role = players[index].role;
  if (role === 'SHERLOCK') return (index % SHERLOCK_SKINS) + 1;
  if (role === 'MORIARTY') return (index % MORIARTY_SKINS) + 1;
  return 1;
}

export const getBadgeImage = (achId: string) => {
  const baseId = achId.replace(/_\d+$/, '');
  const formattedId = baseId.toLowerCase().replace(/_/g, '-');
  return `/assets/badges/${formattedId}.png`;
};

export const ASSETS = {
  CARD_BACK: '/assets/card-back.png',
  ROLE_BACK: '/assets/roles/role-back.png',
  CLIPPER: '/assets/clipper.png',
  BADGE_PLACEHOLDER: '/assets/badges/placeholder.png',
};
