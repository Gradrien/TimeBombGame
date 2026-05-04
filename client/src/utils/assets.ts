// client/src/utils/assets.ts

export const getRoleImage = (role?: string) => {
  if (role === 'MORIARTY') return '/assets/role-moriarty.png';
  if (role === 'SHERLOCK') return '/assets/role-sherlock.png';
  return '/assets/role-back.jpg';
};

export const getCardImage = (type?: string) => {
  if (type === 'BOMB') return '/assets/card-bomb.png';
  if (type === 'DEFUSE') return '/assets/card-defuse.png';
  return '/assets/card-safe.png';
};

export const ASSETS = {
  CARD_BACK: '/assets/card-back.png',
  ROLE_BACK: '/assets/role-back.png',
  CLIPPER: '/assets/clipper.png', // Si tu as l'image de la pince
};
