// shared/achievements.ts

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  target?: number;
  tier?: 1 | 2 | 3;
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  // --- ONE-SHOTS (Actions spécifiques en jeu) ---
  PETARD: {
	id: 'PETARD',
	name: "T'es en pétard",
	description: "Faire exploser la bombe à la toute première coupe de la partie."
  },
  LAISSE_FAIRE: {
	id: 'LAISSE_FAIRE',
	name: "Laisse faire les pros",
	description: "Gagner une partie en tant que Sherlock sans couper un seul câble."
  },
  CHAT_NOIR: {id: 'CHAT_NOIR', name: "Chat noir", description: "Faire exploser la bombe 2 parties d'affilée."},
  CREDIBILITE_MAX: {
	id: 'CREDIBILITE_MAX',
	name: "Crédibilité maximale",
	description: "Se faire trouver 3 câbles de désamorçage chez soi en une seule partie en tant que Sherlock."
  },
  IN_EXTREMIS: {
	id: 'IN_EXTREMIS',
	name: "In extremis",
	description: "Couper le dernier câble de désamorçage lors de la toute dernière coupe du 4ème round."
  },
  CHOU_BLANC: {
	id: 'CHOU_BLANC',
	name: "Chou blanc",
	description: "Finir une manche complète sans qu'aucun câble de désamorçage ou bombe ne soit coupé."
  },
  CHERCHEUR_VIDE: {
	id: 'CHERCHEUR_VIDE',
	name: "Besoin d'une reconversion ?",
	description: "Couper uniquement des câbles vides pendant toute une partie."
  },
  COLLABO: {
	id: 'COLLABO',
	name: 'Collabo',
	description: 'Trouver 3 câbles chez soi en une partie en tant que Moriarty',
  },

  // --- PROGRESSION : BOMBES ---
  DEMOLITION_1: {
	id: 'DEMOLITION_1',
	name: "Expert en démolition I",
	description: "Faire exploser 5 bombes.",
	target: 5,
	tier: 1
  },
  DEMOLITION_2: {
	id: 'DEMOLITION_2',
	name: "Expert en démolition II",
	description: "Faire exploser 10 bombes.",
	target: 10,
	tier: 2
  },
  DEMOLITION_3: {
	id: 'DEMOLITION_3',
	name: "Expert en démolition III",
	description: "Faire exploser 20 bombes.",
	target: 20,
	tier: 3
  },

  // --- PROGRESSION : COUPES ---
  DOIGTS_FEE_1: {id: 'DOIGTS_FEE_1', name: "Doigts de fée I", description: "Couper 25 câbles.", target: 25, tier: 1},
  DOIGTS_FEE_2: {id: 'DOIGTS_FEE_2', name: "Doigts de fée II", description: "Couper 50 câbles.", target: 50, tier: 2},
  DOIGTS_FEE_3: {
	id: 'DOIGTS_FEE_3',
	name: "Doigts de fée III",
	description: "Couper 100 câbles.",
	target: 100,
	tier: 3
  },

  // --- PROGRESSION : VICTOIRES GLOBALES ---
  ROI_STRATEGIE_1: {
	id: 'ROI_STRATEGIE_1',
	name: "Roi de la stratégie I",
	description: "Gagner 20 parties.",
	target: 20,
	tier: 1
  },
  ROI_STRATEGIE_2: {
	id: 'ROI_STRATEGIE_2',
	name: "Roi de la stratégie II",
	description: "Gagner 50 parties.",
	target: 50,
	tier: 2
  },
  ROI_STRATEGIE_3: {
	id: 'ROI_STRATEGIE_3',
	name: "Roi de la stratégie III",
	description: "Gagner 100 parties.",
	target: 100,
	tier: 3
  },

  // --- PROGRESSION : VICTOIRES SHERLOCK ---
  SHERLOCK_1: {
	id: 'SHERLOCK_1',
	name: "Sherlock of Holmes time I",
	description: "Gagner 10 fois en tant que Sherlock.",
	target: 10,
	tier: 1
  },
  SHERLOCK_2: {
	id: 'SHERLOCK_2',
	name: "Sherlock of Holmes time II",
	description: "Gagner 20 fois en tant que Sherlock.",
	target: 20,
	tier: 2
  },
  SHERLOCK_3: {
	id: 'SHERLOCK_3',
	name: "Sherlock of Holmes time III",
	description: "Gagner 50 fois en tant que Sherlock.",
	target: 50,
	tier: 3
  },

  // --- PROGRESSION : VICTOIRES MORIARTY ---
  MORIARTY_1: {
	id: 'MORIARTY_1',
	name: "Le Napoléon du crime I",
	description: "Gagner 10 fois en tant que Moriarty.",
	target: 10,
	tier: 1
  },
  MORIARTY_2: {
	id: 'MORIARTY_2',
	name: "Le Napoléon du crime II",
	description: "Gagner 20 fois en tant que Moriarty.",
	target: 20,
	tier: 2
  },
  MORIARTY_3: {
	id: 'MORIARTY_3',
	name: "Le Napoléon du crime III",
	description: "Gagner 50 fois en tant que Moriarty.",
	target: 50,
	tier: 3
  },

  // --- PROGRESSION : LOUPE & BROUILLEUR ---
  OEIL_LYNX_1: {
	id: 'OEIL_LYNX_1',
	name: "Oeil de lynx I",
	description: "Trouver un indice avec la loupe 5 fois.",
	target: 5,
	tier: 1
  },
  OEIL_LYNX_2: {
	id: 'OEIL_LYNX_2',
	name: "Oeil de lynx II",
	description: "Trouver un indice avec la loupe 10 fois.",
	target: 10,
	tier: 2
  },
  OEIL_LYNX_3: {
	id: 'OEIL_LYNX_3',
	name: "Oeil de lynx III",
	description: "Trouver un indice avec la loupe 20 fois.",
	target: 20,
	tier: 3
  },

  BROUILLEUR_1: {
	id: 'BROUILLEUR_1',
	name: "Brouilleur de piste I",
	description: "Brouiller 2 loupes.",
	target: 2,
	tier: 1
  },
  BROUILLEUR_2: {
	id: 'BROUILLEUR_2',
	name: "Brouilleur de piste II",
	description: "Brouiller 5 loupes.",
	target: 5,
	tier: 2
  },
  BROUILLEUR_3: {
	id: 'BROUILLEUR_3',
	name: "Brouilleur de piste III",
	description: "Brouiller 10 loupes.",
	target: 10,
	tier: 3
  },
};
