import {createHmac, randomBytes, timingSafeEqual} from 'crypto';
import 'dotenv/config';

/**
 * Signed session tokens (HMAC-SHA256), stateless on the server side.
 *
 * Issued at login, the token lets a freshly (re)connected socket prove its
 * identity (`authenticate`) without resending the PIN. The token — never a
 * client-supplied `playerId` — is the source of truth: it is impossible to
 * hijack another player's seat or account by guessing their id.
 *
 * Format : `<userId>.<signatureHex>`.
 */

const secret = process.env.AUTH_SECRET ?? randomBytes(32).toString('hex');
if (!process.env.AUTH_SECRET) {
  console.warn('⚠️ AUTH_SECRET non défini : les sessions seront invalidées à chaque redémarrage du serveur.');
}

function sign(payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** @returns l'id utilisateur si le jeton est authentique, sinon `null`. */
export function verifySessionToken(token: string): string | null {
  if (typeof token !== 'string') return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const userId = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(sign(userId));

  // Constant-time comparison so nothing leaks about the expected signature.
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  return userId;
}
