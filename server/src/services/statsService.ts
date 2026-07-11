import {CardType, GameSessionStats, GameState, isOnTeam} from '@timebomb/shared';
import {prisma} from '../db';

// ---------------------------------------------------------------------------
// 1. Event hooks (pure functions, called by the game engine)
// ---------------------------------------------------------------------------

/** Fresh per-game stats, created when a game starts. */
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

export function recordCut(
	stats: GameSessionStats,
	cutterId: string,
	targetId: string,
	cardType: CardType,
	currentRound: number,
	cutIndexInRound: number // 1 for the round's first cut, 2 for the second…
) {
  // First cut of the game
  if (currentRound === 1 && cutIndexInRound === 1) {
	stats.firstCutBy = cutterId;
	if (cardType === 'BOMB') stats.isFirstCutBomb = true;
  }

  // Cutter stats
  stats.cutsMade[cutterId] = (stats.cutsMade[cutterId] || 0) + 1;
  if (cardType === 'SAFE') {
	stats.safeCablesCut[cutterId] = (stats.safeCablesCut[cutterId] || 0) + 1;
  }
  if (cardType === 'BOMB') {
	stats.bombCutter = cutterId;
  }

  // Target stats
  if (cardType === 'DEFUSE') {
	stats.defusesFoundOn[targetId] = (stats.defusesFoundOn[targetId] || 0) + 1;
  }

  // Remember the last cut
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
// 2. Achievement engine + DB update (call when room.status becomes 'FINISHED')
// ---------------------------------------------------------------------------

export async function processEndGameStats(room: GameState, stats: GameSessionStats) {
  const winner = room.winner;
  const totalPlayers = room.players.length;

  const updates = room.players.map(async (player) => {
	// Identity is bound to the socket, so every player maps to an account;
	// unknown ids (account deleted meanwhile) are simply skipped.
	const dbUser = await prisma.user.findUnique({where: {id: player.id}});
	if (!dbUser) return null;

	const isSherlock = isOnTeam(player.role, 'SHERLOCK');
	const isMoriartyTeam = isOnTeam(player.role, 'MORIARTY');
	const won = winner ? isOnTeam(player.role, winner) : false;

	const myCuts = stats.cutsMade[player.id] || 0;
	const mySafeCuts = stats.safeCablesCut[player.id] || 0;
	const cutBombThisGame = stats.bombCutter === player.id;
	const newConsecutiveBombs = cutBombThisGame ? dbUser.consecutiveBombs + 1 : 0;

	// --- 1. Update cumulative stats in the DB ---
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

	// Reload the user with their updated stats
	const updatedUser = await prisma.user.findUnique({where: {id: player.id}, include: {achievements: true}});
	if (!updatedUser) return null;

	// Ids of already-unlocked achievements: required so the same achievements
	// are not re-awarded (and re-emitted to the client) every game.
	const currentAch = updatedUser.achievements.map(a => a.achievementId);
	const newAch: string[] = [];

	// Tier validation helper
	const checkTiers = (value: number, tiers: number[], ids: string[]) => {
	  tiers.forEach((t, i) => {
		if (value >= t && !currentAch.includes(ids[i]) && !newAch.includes(ids[i])) {
		  newAch.push(ids[i]);
		}
	  });
	};

	// --- 2. Progressive (tiered) achievements ---
	checkTiers(updatedUser.bombsExploded, [5, 10, 20], ['DEMOLITION_1', 'DEMOLITION_2', 'DEMOLITION_3']);
	checkTiers(updatedUser.cablesCut, [25, 50, 100], ['DOIGTS_FEE_1', 'DOIGTS_FEE_2', 'DOIGTS_FEE_3']);
	checkTiers(updatedUser.gamesWon, [20, 50, 100], ['ROI_STRATEGIE_1', 'ROI_STRATEGIE_2', 'ROI_STRATEGIE_3']);
	checkTiers(updatedUser.winsSherlock, [10, 20, 50], ['SHERLOCK_1', 'SHERLOCK_2', 'SHERLOCK_3']);
	checkTiers(updatedUser.winsMoriarty, [10, 20, 50], ['MORIARTY_1', 'MORIARTY_2', 'MORIARTY_3']);
	checkTiers(updatedUser.loupesUsed, [5, 10, 20], ['OEIL_LYNX_1', 'OEIL_LYNX_2', 'OEIL_LYNX_3']);
	checkTiers(updatedUser.cardsJammed, [2, 5, 10], ['BROUILLEUR_1', 'BROUILLEUR_2', 'BROUILLEUR_3']);

	// --- 3. One-shot achievements ---

	// PETARD: cut the bomb on the very first cut of the game
	if (stats.isFirstCutBomb && stats.firstCutBy === player.id && !currentAch.includes('PETARD')) {
	  newAch.push('PETARD');
	}

	// LAISSE_FAIRE: win as Sherlock with 0 cuts
	if (isSherlock && won && myCuts === 0 && !currentAch.includes('LAISSE_FAIRE')) {
	  newAch.push('LAISSE_FAIRE');
	}

	// CHAT_NOIR: blow up the bomb twice in a row
	if (newConsecutiveBombs >= 2 && !currentAch.includes('CHAT_NOIR')) {
	  newAch.push('CHAT_NOIR');
	}

	// CREDIBILITE_MAX: have 3 defuses found in your hand as Sherlock
	if (isSherlock && (stats.defusesFoundOn[player.id] || 0) >= 3 && !currentAch.includes('CREDIBILITE_MAX')) {
	  newAch.push('CREDIBILITE_MAX');
	}

	// COLLABO: have 3 defuses found in your hand as Moriarty
	if (player.role === 'MORIARTY' && (stats.defusesFoundOn[player.id] || 0) >= 3 && !currentAch.includes('COLLABO')) {
	  newAch.push('COLLABO');
	}

	// IN_EXTREMIS: cut the last cable on the last cut of round 4
	if (winner === 'SHERLOCK' && stats.lastCutRound === 4 && stats.lastCutIndex === totalPlayers && stats.lastCutBy === player.id && !currentAch.includes('IN_EXTREMIS')) {
	  newAch.push('IN_EXTREMIS');
	}

	// CHOU_BLANC: finish a round with no defuse/bomb cut (team achievement, everyone gets it)
	if (stats.chouBlancAchieved && !currentAch.includes('CHOU_BLANC')) {
	  newAch.push('CHOU_BLANC');
	}

	// CHERCHEUR_VIDE: cut only safe cards during the game (at least 1)
	if (myCuts > 0 && myCuts === mySafeCuts && !currentAch.includes('CHERCHEUR_VIDE')) {
	  newAch.push('CHERCHEUR_VIDE');
	}

	// --- 4. Persist the new achievements ---
	if (newAch.length > 0) {
	  await prisma.userAchievement.createMany({
		data: newAch.map(achId => ({
		  userId: player.id,
		  achievementId: achId
		})),
		skipDuplicates: true // avoids a crash if the achievement already exists
	  });
	  return {playerId: player.id, unlockedAchievements: newAch};
	}

	return null;
  });

  const results = await Promise.all(updates);
  // Only return the players who unlocked something, ready to emit over the socket.
  return results.filter(r => r !== null);
}
