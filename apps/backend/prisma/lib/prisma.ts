/**
 * Shared Prisma Client for seeds, scripts, and CLI tools.
 * These run as standalone processes (not via the app singleton).
 */
import { PrismaClient } from '../../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });
export default prisma;
