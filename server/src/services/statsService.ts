import {GameState} from '@timebomb/shared';

import 'dotenv/config';
import {Pool} from 'pg';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from "../generated/client/index";

const pool = new Pool({connectionString: process.env.DATABASE_URL});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({adapter});


// ---------------------------------------------------------------------------
// 1. STRUCTURE DES STATISTIQUES DE SESSION (À stocker en mémoire pendant la partie)
// ---------------------------------------------------------------------------
export interface GameSessionStats {
  firstCutBy: string | null;
  isFirstCutBomb: boolean;
  chouBlancAchieved: boolean; // Finir une manche avec 0 câble/bombe coupés

  cutsMade: Record<string, number>;         // Nombre de coupes par joueur
  safeCablesCut: Record<string, number>;    // Nombre de câbles SAFE coupés par joueur
  defusesFoundOn: Record<string, number>;   // Nombre de DEFUSE trouvés SUR ce joueur

  loupesUsed: Record<string, number>;       // Nombre de loupes utilisées par joueur
  loupesJammed: Record<string, number>;     // Nombre de brouillages réussis (pour le Brouilleur)

  bombCutter: string | null;                // Celui qui a coupé la bombe (s'il y en a eu une)
  lastCutBy: string | null;                 // Celui qui a fait la toute dernière coupe
  lastCutRound: number;                     // Le round de la dernière coupe
  lastCutIndex: number;                     // L'index (numéro) de la dernière coupe dans le round
}

// Fonction pour initialiser les stats au début d'une partie (socket.on('startGame'))
export function initGameSessionStats(): GameSessionStats {
  return {
	firstCutBy: null,
	isFirstCutBomb: false,
	chouBlancAchieved: false,
	cutsMade: {},
	safeCablesCut: {},
	defusesFoundOn: {},
	loupesUsed: {},
	loupesJammed: {},
	bombCutter: null,
	lastCutBy: null,
	lastCutRound: 1,
	lastCutIndex: 0,
  };
}

// ---------------------------------------------------------------------------
// 2. HOOKS D'ÉVÉNEMENTS (À appeler dans roomManager.ts pendant la partie)
// ---------------------------------------------------------------------------

export function recordCut(
	stats: GameSessionStats,
	cutterId: string,
	targetId: string,
	cardType: string,
	currentRound: number,
	cutIndexInRound: number // (ex: 1 pour la 1ère coupe de la manche, 2 pour la 2ème...)
) {
  // Enregistrement du premier coup de la partie
  if (currentRound === 1 && cutIndexInRound === 1) {
	stats.firstCutBy = cutterId;
	if (cardType === 'BOMB') stats.isFirstCutBomb = true;
  }

  // Stats du coupeur
  stats.cutsMade[cutterId] = (stats.cutsMade[cutterId] || 0) + 1;
  if (cardType === 'SAFE') {
	stats.safeCablesCut[cutterId] = (stats.safeCablesCut[cutterId] || 0) + 1;
  }
  if (cardType === 'BOMB') {
	stats.bombCutter = cutterId;
  }

  // Stats de la cible
  if (cardType === 'DEFUSE') {
	stats.defusesFoundOn[targetId] = (stats.defusesFoundOn[targetId] || 0) + 1;
  }

  // Mémorisation de la dernière coupe
  stats.lastCutBy = cutterId;
  stats.lastCutRound = currentRound;
  stats.lastCutIndex = cutIndexInRound;
}

export function recordLoupe(stats: GameSessionStats, userId: string, isJammed: boolean, brouilleurId?: string) {
  stats.loupesUsed[userId] = (stats.loupesUsed[userId] || 0) + 1;
  if (isJammed && brouilleurId) {
	stats.loupesJammed[brouilleurId] = (stats.loupesJammed[brouilleurId] || 0) + 1;
  }
}

export function recordRoundEnd(stats: GameSessionStats, defusesFoundThisRound: number, bombFoundThisRound: boolean) {
  if (defusesFoundThisRound === 0 && !bombFoundThisRound) {
	stats.chouBlancAchieved = true;
  }
}

// ---------------------------------------------------------------------------
// 3. MOTEUR DE SUCCÈS ET MISE À JOUR BDD (À appeler lors du room.status = 'FINISHED')
// ---------------------------------------------------------------------------

export async function processEndGameStats(room: GameState, stats: GameSessionStats) {
  const winner = room.winner; // 'SHERLOCK' ou 'MORIARTY'
  const totalPlayers = room.players.length;

  const updates = room.players.map(async (player) => {
	// Sécurité : On ignore les invités sans compte réel
	if (!player.id.includes('-')) return null;

	const dbUser = await prisma.user.findUnique({where: {id: player.id}});
	if (!dbUser) return null;

	const isSherlock = player.role === 'SHERLOCK';
	const isMoriartyTeam = player.role === 'MORIARTY' || player.role === 'BROUILLEUR';
	const won = (isSherlock && winner === 'SHERLOCK') || (isMoriartyTeam && winner === 'MORIARTY');

	const myCuts = stats.cutsMade[player.id] || 0;
	const mySafeCuts = stats.safeCablesCut[player.id] || 0;
	const cutBombThisGame = stats.bombCutter === player.id;
	const newConsecutiveBombs = cutBombThisGame ? dbUser.consecutiveBombs + 1 : 0;

	// --- 1. MISE À JOUR DES STATS CUMULÉES EN BDD ---
	await prisma.user.update({
	  where: {id: player.id},
	  data: {
		gamesPlayed: {increment: 1},
		gamesWon: won ? {increment: 1} : undefined,
		gamesAsSherlock: isSherlock ? {increment: 1} : undefined,
		gamesAsMoriarty: isMoriartyTeam ? {increment: 1} : undefined,
		winsSherlock: (isSherlock && won) ? {increment: 1} : undefined,
		winsMoriarty: (isMoriartyTeam && won) ? {increment: 1} : undefined,
		cablesCut: {increment: myCuts},
		bombsExploded: cutBombThisGame ? {increment: 1} : undefined,
		loupesUsed: {increment: stats.loupesUsed[player.id] || 0},
		cardsJammed: {increment: stats.loupesJammed[player.id] || 0},
		consecutiveBombs: newConsecutiveBombs,
	  },
	});

	// Rechargement de l'utilisateur avec ses nouvelles stats
	const updatedUser = await prisma.user.findUnique({where: {id: player.id}, include: {achievements: true}});
	if (!updatedUser) return null;

	const currentAch = updatedUser.achievements;
	const newAch: string[] = [];

	// Helper pour valider les paliers
	const checkTiers = (value: number, tiers: number[], ids: string[]) => {
	  tiers.forEach((t, i) => {
		if (value >= t && !currentAch.includes(ids[i]) && !newAch.includes(ids[i])) {
		  newAch.push(ids[i]);
		}
	  });
	};

	// --- 2. VÉRIFICATION DES SUCCÈS PROGRESSIFS (PALIERS) ---
	checkTiers(updatedUser.bombsExploded, [5, 10, 20], ['DEMOLITION_1', 'DEMOLITION_2', 'DEMOLITION_3']);
	checkTiers(updatedUser.cablesCut, [25, 50, 100], ['DOIGTS_FEE_1', 'DOIGTS_FEE_2', 'DOIGTS_FEE_3']);
	checkTiers(updatedUser.gamesWon, [20, 50, 100], ['ROI_STRATEGIE_1', 'ROI_STRATEGIE_2', 'ROI_STRATEGIE_3']);
	checkTiers(updatedUser.winsSherlock, [10, 20, 50], ['SHERLOCK_1', 'SHERLOCK_2', 'SHERLOCK_3']);
	checkTiers(updatedUser.winsMoriarty, [10, 20, 50], ['MORIARTY_1', 'MORIARTY_2', 'MORIARTY_3']);
	checkTiers(updatedUser.loupesUsed, [5, 10, 20], ['OEIL_LYNX_1', 'OEIL_LYNX_2', 'OEIL_LYNX_3']);
	checkTiers(updatedUser.cardsJammed, [2, 5, 10], ['BROUILLEUR_1', 'BROUILLEUR_2', 'BROUILLEUR_3']);

	// --- 3. VÉRIFICATION DES SUCCÈS "ONE-SHOT" ---

	// T'es en pétard : Couper la bombe à la première coupe de la partie
	if (stats.isFirstCutBomb && stats.firstCutBy === player.id && !currentAch.includes('PETARD')) {
	  newAch.push('PETARD');
	}

	// Laisse faire les pros : Gagner Sherlock avec 0 coupe
	if (isSherlock && won && myCuts === 0 && !currentAch.includes('LAISSE_FAIRE')) {
	  newAch.push('LAISSE_FAIRE');
	}

	// Chat Noir : Faire exploser la bombe 2 fois d'affilée
	if (newConsecutiveBombs >= 2 && !currentAch.includes('CHAT_NOIR')) {
	  newAch.push('CHAT_NOIR');
	}

	// Crédibilité maximale : Se faire trouver 3 câbles en étant Sherlock
	if (isSherlock && (stats.defusesFoundOn[player.id] || 0) >= 3 && !currentAch.includes('CREDIBILITE_MAX')) {
	  newAch.push('CREDIBILITE_MAX');
	}

	// Collabo : Se faire trouver 3 câbles en étant Moriarty (Nouveau succès)
	if (player.role === 'MORIARTY' && (stats.defusesFoundOn[player.id] || 0) >= 3 && !currentAch.includes('COLLABO')) {
	  newAch.push('COLLABO');
	}

	// In extremis : Couper le dernier câble à la dernière coupe du round 4
	if (winner === 'SHERLOCK' && stats.lastCutRound === 4 && stats.lastCutIndex === totalPlayers && stats.lastCutBy === player.id && !currentAch.includes('IN_EXTREMIS')) {
	  newAch.push('IN_EXTREMIS');
	}

	// Chou blanc : Finir une manche sans câble/bombe coupée (Succès d'équipe, tout le monde l'a)
	if (stats.chouBlancAchieved && !currentAch.includes('CHOU_BLANC')) {
	  newAch.push('CHOU_BLANC');
	}

	// Chercheur de vide : Couper uniquement des cartes vides pendant la partie (au moins 1)
	if (myCuts > 0 && myCuts === mySafeCuts && !currentAch.includes('CHERCHEUR_VIDE')) {
	  newAch.push('CHERCHEUR_VIDE');
	}

	// --- 4. SAUVEGARDE DES NOUVEAUX SUCCÈS ---
	if (newAch.length > 0) {
	  await prisma.userAchievement.createMany({
		data: newAch.map(achId => ({
		  userId: player.id,
		  achievementId: achId
		})),
		skipDuplicates: true // Empêche les crashs si le succès est déjà là
	  });
	  return {playerId: player.id, unlockedAchievements: newAch};
	}

	return null;
  });

  const results = await Promise.all(updates);
  // Retourne uniquement les joueurs qui ont débloqué quelque chose pour que tu puisses l'émettre via Socket
  return results.filter(r => r !== null);
}
