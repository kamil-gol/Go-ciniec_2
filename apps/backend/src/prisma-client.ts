/**
 * Barrel re-export for Prisma 7 generated client.
 *
 * Prisma 7's `prisma-client` generator outputs TypeScript to
 * src/generated/prisma/.  Because that directory is created at
 * container start (npx prisma generate) and may not exist when
 * tsx first scans the file tree, importing from there via a
 * tsconfig path alias can fail at runtime.
 *
 * This file lives in a tracked, always-present location so every
 * other module can simply:
 *
 *     import { PrismaClient, Prisma } from '@/prisma-client';
 */
export * from './generated/prisma/index';
