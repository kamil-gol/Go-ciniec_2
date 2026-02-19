/**
 * Test Database Seeder — Read-Only Pattern
 *
 * Queries existing data created by production seed (npx prisma db seed)
 * instead of creating/upserting records.
 *
 * WHY: Multiple Jest workers calling seedTestData() concurrently
 * caused PostgreSQL deadlocks (40P01) on upsert operations.
 * Read-only queries eliminate this entirely.
 *
 * PREREQUISITE: Run `docker compose exec backend npx prisma db seed` before tests.
 *
 * Production seed creates:
 *   - Users: admin@gosciniecrodzinny.pl (ADMIN), pracownik1/2 (EMPLOYEE)
 *   - Halls: Sala Kryształowa, Sala Taneczna, Sala Złota, etc.
 *   - EventTypes: Wesele, Komunia, Urodziny, Inne
 *   - Clients: Marek Kowalski, Anna Nowak, Piotr Wiśniewski, etc.
 *
 * Only the CLIENT-role user (readonly@test.pl) is created here
 * because it doesn't exist in production seed.
 */
import prismaTest from './prisma-test-client';
import bcrypt from 'bcryptjs';

export interface TestSeedData {
  admin: any;
  user: any;
  readonlyUser: any;
  hall1: any;
  hall2: any;
  eventType1: any;
  eventType2: any;
  client1: any;
  client2: any;
}

export async function seedTestData(): Promise<TestSeedData> {
  // ── Users: find existing from production seed ──
  const admin = await prismaTest.user.findFirst({
    where: { legacyRole: 'ADMIN', isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) {
    throw new Error(
      'seedTestData: No ADMIN user found in database. ' +
      'Run `docker compose exec backend npx prisma db seed` first.'
    );
  }

  const user = await prismaTest.user.findFirst({
    where: { legacyRole: 'EMPLOYEE', isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!user) {
    throw new Error(
      'seedTestData: No EMPLOYEE user found in database. ' +
      'Run `docker compose exec backend npx prisma db seed` first.'
    );
  }

  // CLIENT-role user doesn't exist in production seed — upsert it
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  let readonlyUser: any;
  try {
    readonlyUser = await prismaTest.user.upsert({
      where: { email: 'readonly@test.pl' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'readonly@test.pl',
        password: hashedPassword,
        firstName: 'Readonly',
        lastName: 'Testowy',
        legacyRole: 'CLIENT',
        isActive: true,
      },
    });
  } catch {
    // If upsert fails (concurrent worker), try to find existing
    readonlyUser = await prismaTest.user.findUnique({
      where: { email: 'readonly@test.pl' },
    });
    if (!readonlyUser) {
      throw new Error('seedTestData: Failed to create/find CLIENT user readonly@test.pl');
    }
  }

  // ── Halls: find existing from production seed ──
  const halls = await prismaTest.hall.findMany({
    where: { isActive: true },
    orderBy: { capacity: 'desc' },
    take: 2,
  });
  if (halls.length < 2) {
    throw new Error(
      `seedTestData: Need at least 2 halls, found ${halls.length}. ` +
      'Run `docker compose exec backend npx prisma db seed` first.'
    );
  }

  // ── Event Types: find existing from production seed ──
  const eventTypes = await prismaTest.eventType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    take: 2,
  });
  if (eventTypes.length < 2) {
    throw new Error(
      `seedTestData: Need at least 2 event types, found ${eventTypes.length}. ` +
      'Run `docker compose exec backend npx prisma db seed` first.'
    );
  }

  // ── Clients: find existing from production seed ──
  const clients = await prismaTest.client.findMany({
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
  if (clients.length < 2) {
    throw new Error(
      `seedTestData: Need at least 2 clients, found ${clients.length}. ` +
      'Run `docker compose exec backend npx prisma db seed` first.'
    );
  }

  return {
    admin,
    user,
    readonlyUser,
    hall1: halls[0],
    hall2: halls[1],
    eventType1: eventTypes[0],
    eventType2: eventTypes[1],
    client1: clients[0],
    client2: clients[1],
  };
}

/**
 * Quick seed: only users (for auth tests).
 * Also read-only — finds existing ADMIN from production seed.
 */
export async function seedUsersOnly() {
  const admin = await prismaTest.user.findFirst({
    where: { legacyRole: 'ADMIN', isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) {
    throw new Error(
      'seedUsersOnly: No ADMIN user found in database. ' +
      'Run `docker compose exec backend npx prisma db seed` first.'
    );
  }

  return { admin };
}
