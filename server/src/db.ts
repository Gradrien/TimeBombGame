import 'dotenv/config';
import {Pool} from 'pg';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from './generated/client/index';

/**
 * Client Prisma unique du serveur.
 * Tous les services importent cette instance : un seul pool de connexions
 * PostgreSQL, no matter which part of the code talks to the database.
 */
const pool = new Pool({connectionString: process.env.DATABASE_URL});

export const prisma = new PrismaClient({adapter: new PrismaPg(pool)});
