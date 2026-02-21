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
import { PrismaClient } from '@prisma/client';
import logger from '@utils/logger';
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
// Support both: import { prisma } and import prisma from '@/lib/prisma'
export default prisma;
/**
 * Graceful shutdown helper — call from server.ts SIGTERM handler
 */
export async function disconnectPrisma() {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
}
//# sourceMappingURL=prisma.js.map