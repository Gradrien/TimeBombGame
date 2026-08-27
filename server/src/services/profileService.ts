import {ACHIEVEMENTS, AchievementDef, FormattedAchievement, UserProfile} from '@timebomb/shared';
import {prisma} from '../db';
import {toSafeUser} from './authService';
import {getUnlockedSkins} from './skinService';

/**
 * Construit le profil complet d'un joueur : ses statistiques publiques et ses
 * achievements enriched with progression, ready to display.
 *
 * For tiered achievements (I / II / III), only the "current" tier is
 * returned: the first still-locked one, or the last if all are unlocked.
 */
export async function buildUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
	where: {id: userId},
	include: {achievements: true},
  });
  if (!user) return null;

  const unlockedIds = user.achievements.map(a => a.achievementId);

  // Progress value associated with each achievement family.
  const progressByPrefix: Array<[prefix: string, value: number]> = [
	['DEMOLITION', user.bombsExploded],
	['DOIGTS_FEE', user.cablesCut],
	['ROI_STRATEGIE', user.gamesWon],
	['SHERLOCK', user.winsSherlock],
	['MORIARTY', user.winsMoriarty],
	['OEIL_LYNX', user.loupesUsed],
	['BROUILLEUR', user.cardsJammed],
  ];

  const getProgress = (achId: string): number => {
	const match = progressByPrefix.find(([prefix]) => achId.startsWith(prefix));
	if (match) return match[1];
	return unlockedIds.includes(achId) ? 1 : 0;
  };

  // Groups the tiers of one family (DEMOLITION_1/2/3 -> DEMOLITION).
  const groups = new Map<string, AchievementDef[]>();
  for (const ach of Object.values(ACHIEVEMENTS)) {
	const baseId = ach.id.replace(/_\d+$/, '');
	const group = groups.get(baseId) ?? [];
	group.push(ach);
	groups.set(baseId, group);
  }

  const formattedAchievements: FormattedAchievement[] = [];

  for (const group of groups.values()) {
	group.sort((a, b) => (a.tier || 0) - (b.tier || 0));

	// Current tier: the first locked one, otherwise the family's last.
	const currentAch = group.find(ach => !unlockedIds.includes(ach.id)) ?? group[group.length - 1];

	const isUnlocked = unlockedIds.includes(currentAch.id);
	const isOneShot = currentAch.target === undefined;
	const rawProgress = getProgress(currentAch.id);
	const progress = isOneShot ? rawProgress : Math.min(rawProgress, currentAch.target!);
	const percent = isOneShot
		? (isUnlocked ? 100 : 0)
		: Math.round((progress / currentAch.target!) * 100);

	formattedAchievements.push({...currentAch, isUnlocked, progress, percent, isOneShot});
  }

  const {achievements: _achievements, ...publicUser} = toSafeUser(user);
  const unlockedSkins = await getUnlockedSkins(userId);
  return {...publicUser, formattedAchievements, unlockedSkins};
}
