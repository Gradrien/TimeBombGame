import {PrismaClient} from "../generated/client/index";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { hashPassword, verifyPassword, isHashed } from './passwordService';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

/** Minimal PIN policy, mirrored on the client (4 to 6 characters). */
const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 6;

/**
 * Removes the secret from a user record before it ever leaves the server.
 * Centralised here (DRY) so no code path can accidentally leak the hash.
 */
function toSafeUser<T extends { pinCode?: string }>(user: T): Omit<T, 'pinCode'> {
  const { pinCode: _pinCode, ...safe } = user;
  return safe;
}

/**
 * Authenticates a player by username + PIN, creating the account on first use.
 *
 * Password handling:
 *  - New accounts store a hashed PIN (never clear text).
 *  - Existing hashed PINs are verified with a constant-time comparison.
 *  - Existing *legacy* clear-text PINs (created before hashing existed) are
 *    transparently migrated on a successful login: we compare the clear value,
 *    then re-store it as a hash. This lets every pre-existing account keep using
 *    the exact same PIN with no action required from the player.
 *
 * @throws Error with a user-facing (French) message on invalid input or wrong PIN.
 * @returns the authenticated user, without the stored secret.
 */
export async function authenticatePlayer(username: string, pin: string) {
  // --- Input validation (robustness: reject malformed credentials early) ---
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  if (!cleanUsername) {
    throw new Error("Le pseudo est obligatoire.");
  }
  if (typeof pin !== 'string' || pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
    throw new Error(`Le code PIN doit contenir entre ${PIN_MIN_LENGTH} et ${PIN_MAX_LENGTH} caractères.`);
  }

  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: cleanUsername,
        mode: "insensitive"
      }
    }
  });

  // --- First login: create the account with a hashed PIN ---
  if (!user) {
    const created = await prisma.user.create({
      data: { username: cleanUsername, pinCode: await hashPassword(pin) }
    });
    return toSafeUser(created);
  }

  // --- Existing account: verify, migrating legacy clear-text PINs on the fly ---
  if (isHashed(user.pinCode)) {
    const ok = await verifyPassword(pin, user.pinCode);
    if (!ok) throw new Error("Code PIN incorrect pour ce pseudo.");
  } else {
    // Legacy plain-text PIN: compare directly, then upgrade to a hash.
    if (user.pinCode !== pin) throw new Error("Code PIN incorrect pour ce pseudo.");
    await prisma.user.update({
      where: { id: user.id },
      data: { pinCode: await hashPassword(pin) }
    });
  }

  return toSafeUser(user);
}
