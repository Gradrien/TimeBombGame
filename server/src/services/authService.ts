import {PrismaClient} from "../generated/client/index";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });


export async function authenticatePlayer(username: string, pin: string) {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive"
      }
    }
  });

  if (!user) {
	// Création de compte automatique
	return await prisma.user.create({
	  data: { username, pinCode: pin }
	});
  }

  if (user.pinCode !== pin) {
	throw new Error("Code PIN incorrect pour ce pseudo.");
  }

  return user;
}
