import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

/**
 * Password / PIN hashing service.
 *
 * Responsibility (SRP): turning a clear-text secret into a safely storable
 * hash and verifying a candidate against a stored hash. It knows nothing about
 * the database, sockets or the game — it only deals with strings.
 *
 * We rely on Node's built-in `scrypt` (a memory-hard, salted KDF recommended
 * for password storage) so the project gains strong hashing without pulling in
 * an extra native dependency (KISS + zero-install robustness in containers).
 *
 * Stored format (self-describing so parameters can evolve safely):
 *
 *     scrypt$<keyLength>$<saltHex>$<hashHex>
 */

const scryptAsync = promisify(scrypt);

/** Algorithm tag stored as a prefix so we can detect & evolve the format. */
const ALGORITHM = 'scrypt';
/** Length in bytes of the random salt generated per password. */
const SALT_BYTES = 16;
/** Length in bytes of the derived key (hash). */
const KEY_LENGTH = 64;

/**
 * Returns true when the given stored value is already a hash produced by this
 * service. Anything else (e.g. a legacy clear-text PIN) returns false, which is
 * what the migration logic relies on to detect not-yet-hashed secrets.
 */
export function isHashed(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith(`${ALGORITHM}$`);
}

/**
 * Hashes a clear-text secret with a fresh random salt.
 * @returns the self-describing stored representation (see module doc).
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
  return `${ALGORITHM}$${KEY_LENGTH}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a clear-text candidate against a previously stored hash.
 * Uses a constant-time comparison to avoid leaking information through timing.
 *
 * @returns true when the candidate matches, false otherwise (never throws on a
 *          simple mismatch, only on a malformed stored value).
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!isHashed(stored)) return false;

  const [, keyLengthStr, saltHex, hashHex] = stored.split('$');
  const keyLength = Number(keyLengthStr);
  if (!keyLengthStr || !saltHex || !hashHex || Number.isNaN(keyLength)) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const candidate = (await scryptAsync(plain, salt, keyLength)) as Buffer;

  // Length guard: timingSafeEqual throws if buffers differ in length.
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
