import {describe, expect, it} from 'vitest';
import {initGameSessionStats, recordCut, recordLoupe, recordRoundEnd} from '../services/statsService';

describe('statsService (hooks purs)', () => {
  it('mémorise le tout premier coup de la partie et détecte le pétard', () => {
	const stats = initGameSessionStats();
	recordCut(stats, 'A', 'B', 'BOMB', 1, 1);
	expect(stats.firstCutBy).toBe('A');
	expect(stats.isFirstCutBomb).toBe(true);
	expect(stats.bombCutter).toBe('A');
  });

  it('cumule les coupes et les câbles vides par joueur', () => {
	const stats = initGameSessionStats();
	recordCut(stats, 'A', 'B', 'SAFE', 1, 1);
	recordCut(stats, 'A', 'C', 'SAFE', 1, 2);
	recordCut(stats, 'B', 'A', 'DEFUSE', 1, 3);

	expect(stats.cutsMade).toEqual({A: 2, B: 1});
	expect(stats.safeCablesCut).toEqual({A: 2});
	expect(stats.defusesFoundOn).toEqual({A: 1});
	expect(stats.lastCutBy).toBe('B');
	expect(stats.lastCutIndex).toBe(3);
  });

  it('compte les loupes utilisées et les brouillages subis', () => {
	const stats = initGameSessionStats();
	recordLoupe(stats, 'A', false);
	recordLoupe(stats, 'A', true, 'B');
	expect(stats.loupesUsed).toEqual({A: 2});
	expect(stats.loupesJammed).toEqual({B: 1});
  });

  it('détecte le chou blanc (manche sans désamorçage ni bombe)', () => {
	const stats = initGameSessionStats();
	recordRoundEnd(stats, 0, false);
	expect(stats.chouBlancAchieved).toBe(true);

	const stats2 = initGameSessionStats();
	recordRoundEnd(stats2, 2, false);
	expect(stats2.chouBlancAchieved).toBe(false);
  });
});
