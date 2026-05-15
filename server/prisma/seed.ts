// server/prisma/seed.ts
import { PrismaClient } from '../src/generated/client/index';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  const user = await prisma.user.upsert({
	where: { username: 'Adrien' },
	update: {
	  // Met à jour les stats du joueur
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
	  // Réinitialise et recrée les succès liés
	  achievements: {
		deleteMany: {}, // Efface les anciens succès pour éviter les doublons
		create: [
		  { achievementId: 'DEMOLITION_1' },
		  { achievementId: 'DEMOLITION_2' }, // Palier 2 débloqué
		  { achievementId: 'DOIGTS_FEE_1' },
		  { achievementId: 'DOIGTS_FEE_2' }, // Palier 2 débloqué
		  { achievementId: 'SHERLOCK_1' },
		  { achievementId: 'PETARD' },       // One-shot
		  { achievementId: 'CHAT_NOIR' },    // One-shot
		  { achievementId: 'OEIL_LYNX_1' },
		],
	  },
	},
	create: {
	  // Crée le joueur s'il n'existe pas
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

  console.log('✅ Seeding terminé avec succès pour :', user.username);
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
