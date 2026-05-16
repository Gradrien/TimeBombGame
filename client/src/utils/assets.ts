export const getRoleImage = (role?: string, skinIndex: number = 1) => {
  if (role === 'BROUILLEUR') return `/assets/roles/role-red-brouilleur.png`;
  if (role === 'MORIARTY') return `/assets/roles/role-red-${skinIndex}.png`;
  if (role === 'SHERLOCK') return `/assets/roles/role-blue-${skinIndex}.png`;
  return '/assets/role-back.png';
};

export const getCardImage = (type?: string) => {
  if (type === 'BOMB') return '/assets/card-bomb.png';
  if (type === 'DEFUSE') return '/assets/card-defuse.png';
  if (type === 'LOUPE') return '/assets/card-glasses.png';
  return '/assets/card-safe.png';
};

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
