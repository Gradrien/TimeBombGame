import {describe, expect, it} from 'vitest';
import {createSessionToken, verifySessionToken} from '../services/tokenService';

describe('tokenService', () => {
  it('vérifie un jeton authentique et rend son userId', () => {
	const token = createSessionToken('user-123');
	expect(verifySessionToken(token)).toBe('user-123');
  });

  it('rejette un jeton dont la signature est altérée', () => {
	const token = createSessionToken('user-123');
	const tampered = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');
	expect(verifySessionToken(tampered)).toBeNull();
  });

  it("rejette un jeton dont l'userId est altéré", () => {
	const token = createSessionToken('user-123');
	expect(verifySessionToken(token.replace('user-123', 'user-456'))).toBeNull();
  });

  it('rejette les entrées mal formées', () => {
	expect(verifySessionToken('')).toBeNull();
	expect(verifySessionToken('pas-de-point')).toBeNull();
	expect(verifySessionToken('.signature-sans-id')).toBeNull();
  });
});
