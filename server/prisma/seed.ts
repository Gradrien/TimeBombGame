// server/prisma/seed.ts
import { PrismaClient } from '../src/generated/client/index';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Liste de tous les IDs de succès disponibles dans le jeu
const ALL_ACHIEVEMENTS = [
  // Paliers (Tiers 1, 2, 3)
  'DEMOLITION_1', 'DEMOLITION_2', 'DEMOLITION_3',
  'DOIGTS_FEE_1', 'DOIGTS_FEE_2', 'DOIGTS_FEE_3',
  'ROI_STRATEGIE_1', 'ROI_STRATEGIE_2', 'ROI_STRATEGIE_3',
  'SHERLOCK_1', 'SHERLOCK_2', 'SHERLOCK_3',
  'MORIARTY_1', 'MORIARTY_2', 'MORIARTY_3',
  'OEIL_LYNX_1', 'OEIL_LYNX_2', 'OEIL_LYNX_3',
  'BROUILLEUR_1', 'BROUILLEUR_2', 'BROUILLEUR_3',
  // One-shots
  'PETARD', 'LAISSE_FAIRE', 'CHAT_NOIR', 'CREDIBILITE_MAX',
  'IN_EXTREMIS', 'CHOU_BLANC', 'CHERCHEUR_VIDE', 'COLLABO'
].map(id => ({ achievementId: id }));

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // 1. Utilisateur classique : Adrien
  const userAdrien = await prisma.user.upsert({
	where: { username: 'Adrien' },
	update: {
	  gamesPlayed: 50,
	  gamesWon: 35,
	  gamesAsSherlock: 30,
	  gamesAsMoriarty: 20,
	  winsSherlock: 25,
	  winsMoriarty: 10,
	  cablesCut: 65,
	  bombsExploded: 12,
	  loupesUsed: 6,
	  cardsJammed: 3,
	  consecutiveBombs: 2,
	  achievements: {
		deleteMany: {},
		create: [
		  { achievementId: 'DEMOLITION_1' },
		  { achievementId: 'DEMOLITION_2' },
		  { achievementId: 'DOIGTS_FEE_1' },
		  { achievementId: 'DOIGTS_FEE_2' },
		  { achievementId: 'SHERLOCK_1' },
		  { achievementId: 'PETARD' },
		  { achievementId: 'CHAT_NOIR' },
		  { achievementId: 'OEIL_LYNX_1' },
		],
	  },
	},
	create: {
	  username: 'Adrien',
	  pinCode: '1234',
	  gamesPlayed: 50,
	  gamesWon: 35,
	  gamesAsSherlock: 30,
	  gamesAsMoriarty: 20,
	  winsSherlock: 25,
	  winsMoriarty: 10,
	  cablesCut: 65,
	  bombsExploded: 12,
	  loupesUsed: 6,
	  cardsJammed: 3,
	  consecutiveBombs: 2,
	  achievements: {
		create: [
		  { achievementId: 'DEMOLITION_1' },
		  { achievementId: 'DEMOLITION_2' },
		  { achievementId: 'DOIGTS_FEE_1' },
		  { achievementId: 'DOIGTS_FEE_2' },
		  { achievementId: 'SHERLOCK_1' },
		  { achievementId: 'PETARD' },
		  { achievementId: 'CHAT_NOIR' },
		  { achievementId: 'OEIL_LYNX_1' },
		],
	  },
	},
  });

  console.log('✅ Seeding terminé pour :', userAdrien.username);

  // 2. Utilisateur Spécial : Légende (Tous les succès)
  const userLegend = await prisma.user.upsert({
	where: { username: 'Légende' },
	update: {
	  gamesPlayed: 200,
	  gamesWon: 150,
	  gamesAsSherlock: 100,
	  gamesAsMoriarty: 100,
	  winsSherlock: 80,
	  winsMoriarty: 70,
	  cablesCut: 150,
	  bombsExploded: 30,
	  loupesUsed: 25,
	  cardsJammed: 15,
	  consecutiveBombs: 3,
	  achievements: {
		deleteMany: {},
		create: ALL_ACHIEVEMENTS,
	  },
	},
	create: {
	  username: 'Légende',
	  pinCode: '9999',
	  gamesPlayed: 200,
	  gamesWon: 150,
	  gamesAsSherlock: 100,
	  gamesAsMoriarty: 100,
	  winsSherlock: 80,
	  winsMoriarty: 70,
	  cablesCut: 150,
	  bombsExploded: 30,
	  loupesUsed: 25,
	  cardsJammed: 15,
	  consecutiveBombs: 3,
	  achievements: {
		create: ALL_ACHIEVEMENTS,
	  },
	},
  });

  console.log('✅ Seeding terminé pour :', userLegend.username, '(100% complété)');
}

main()
	.then(async () => {
	  await prisma.$disconnect();
	})
	.catch(async (e) => {
	  console.error('❌ Erreur lors du seeding :', e);
	  await prisma.$disconnect();
	  process.exit(1);
	});
