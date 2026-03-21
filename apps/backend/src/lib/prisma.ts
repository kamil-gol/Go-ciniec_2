/**
 * Prisma Client Singleton
 *
 * Prevents multiple PrismaClient instances in development (hot-reload)
 * and production. All services should import `prisma` from this module.
 *
 * Usage:
 *   import { prisma } from '@/lib/prisma';
 *   // or
 *   import prisma from '@/lib/prisma';
 */

import { PrismaClient } from '@/generated/prisma/index';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from '@utils/logger';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Support both: import { prisma } and import prisma from '@/lib/prisma'
export default prisma;

/**
 * Graceful shutdown helper — call from server.ts SIGTERM handler
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
}
