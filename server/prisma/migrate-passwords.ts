/**
 * One-shot data migration: hash every legacy clear-text PIN in the database.
 *
 * Context
 * -------
 * Accounts created before password hashing was introduced stored their PIN in
 * clear text in `User.pinCode`. This script walks the whole table and replaces
 * any clear-text PIN with its hash, so existing players keep logging in with the
 * *exact same* PIN while the database no longer holds any secret in clear.
 *
 * It is idempotent and safe to run multiple times: already-hashed PINs are
 * detected (via `isHashed`) and skipped. Logging in also migrates lazily (see
 * `authService`), so this script is the bulk/offline counterpart for accounts
 * that have not logged in yet.
 *
 * Usage
 * -----
 *     npm run migrate:passwords --workspace=server
 */
import { PrismaClient } from '../src/generated/client/index';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { hashPassword, isHashed } from '../src/services/passwordService';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔐 Migration des mots de passe : début...');

  const users = await prisma.user.findMany({ select: { id: true, username: true, pinCode: true } });

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    if (isHashed(user.pinCode)) {
      skipped++;
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { pinCode: await hashPassword(user.pinCode) },
    });
    migrated++;
    console.log(`  ✅ ${user.username} : PIN hashé.`);
  }

  console.log(`🔐 Migration terminée. ${migrated} compte(s) migré(s), ${skipped} déjà hashé(s).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors de la migration des mots de passe :', e);
    await prisma.$disconnect();
    process.exit(1);
  });
