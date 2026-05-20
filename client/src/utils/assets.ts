import {GameState, Player} from "@timebomb/shared"

export const getRoleImage = (role?: string, skinIndex: number = 1) => {
  if (role === 'BROUILLEUR') return `/assets/characters/role-red-brouilleur.png`;
  if (role === 'MORIARTY') return `/assets/characters/role-red-${skinIndex}.png`;
  if (role === 'SHERLOCK') return `/assets/characters/role-blue-${skinIndex}.png`;
  return '/assets/characters/role-back.png';
};

export const getRoleCard = (role?: string, skinIndex: number = 1) => {
  if (role === 'BROUILLEUR') return `/assets/roles/role-red-brouilleur.png`;
  if (role === 'MORIARTY') return `/assets/roles/role-red-${skinIndex}.png`;
  if (role === 'SHERLOCK') return `/assets/roles/role-blue-${skinIndex}.png`;
  return '/assets/roles/role-back.png';
};

export const getCardImage = (type?: string) => {
  if (type === 'BOMB') return '/assets/card-bomb.png';
  if (type === 'DEFUSE') return '/assets/card-defuse.png';
  if (type === 'LOUPE') return '/assets/card-glasses.png';
  return '/assets/card-safe.png';
};

export function getPlayerSkinIndex(gameState: GameState, playerId: string, me: Player) {
  const myPlayerIndex = gameState.players.findIndex(p => p.id === playerId);
  let mySkinIndex = 1;
  if (me.role === 'SHERLOCK') {
    mySkinIndex = (myPlayerIndex % 5) + 1;
  } else if (me.role === 'MORIARTY') {
    mySkinIndex = (myPlayerIndex % 3) + 1;
  }
  return mySkinIndex;
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
