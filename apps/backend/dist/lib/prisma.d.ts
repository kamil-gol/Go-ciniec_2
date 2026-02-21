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
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
/**
 * Graceful shutdown helper — call from server.ts SIGTERM handler
 */
export declare function disconnectPrisma(): Promise<void>;
//# sourceMappingURL=prisma.d.ts.map