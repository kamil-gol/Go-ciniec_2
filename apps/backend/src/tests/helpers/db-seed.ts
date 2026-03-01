/**
 * Test Database Seeder — Find-or-Create Pattern (Deadlock-Safe)
 *
 * Uses findUnique/findFirst → create with error catch instead of upsert.
 * This eliminates PostgreSQL 40P01 deadlocks when multiple Jest workers
 * call seedTestData() concurrently.
 *
 * Pattern:
 *   1. Read first (no locks)
 *   2. Create only if missing
 *   3. If concurrent worker already created it → catch error, find again
 *
 * IMPORTANT: Field names MUST match Prisma schema exactly:
 *   - User: firstName, lastName, legacyRole (NOT name, role)
 *   - Client: firstName, lastName (NOT name)
 */
import prismaTest from './prisma-test-client';
import bcrypt from 'bcryptjs';

export interface TestSeedData {
  admin: any;
  user: any;
  readonlyUser: any;
  hall1: any;
  hall2: any;
  /** #165: Hall with allowMultipleBookings=true and capacity=300 */
  hallMultiBooking: any;
  eventType1: any;
  eventType2: any;
  client1: any;
  client2: any;
}

/**
 * Find existing record or create if not found.
 * Handles race conditions when multiple Jest workers run concurrently.
 * Re-throws original create error for better debugging if retry also fails.
 */
async function findOrCreate<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>,
): Promise<T> {
  // 1. Try to find existing (read-only, no locks)
  const existing = await findFn();
  if (existing) return existing;

  // 2. Not found → try to create
  try {
    return await createFn();
  } catch (createError) {
    // 3. Another worker created it concurrently → find again
    const retry = await findFn();
    if (retry) return retry;
    // Re-throw original error for debugging
    throw createError;
  }
}

export async function seedTestData(): Promise<TestSeedData> {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  // ── Users ──
  const admin = await findOrCreate(
    () => prismaTest.user.findUnique({ where: { email: 'admin@test.pl' } }),
    () => prismaTest.user.create({
      data: {
        email: 'admin@test.pl',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Testowy',
        legacyRole: 'ADMIN',
        isActive: true,
      },
    }),
  );

  const user = await findOrCreate(
    () => prismaTest.user.findUnique({ where: { email: 'user@test.pl' } }),
    () => prismaTest.user.create({
      data: {
        email: 'user@test.pl',
        password: hashedPassword,
        firstName: 'User',
        lastName: 'Testowy',
        legacyRole: 'EMPLOYEE',
        isActive: true,
      },
    }),
  );

  const readonlyUser = await findOrCreate(
    () => prismaTest.user.findUnique({ where: { email: 'readonly@test.pl' } }),
    () => prismaTest.user.create({
      data: {
        email: 'readonly@test.pl',
        password: hashedPassword,
        firstName: 'Readonly',
        lastName: 'Testowy',
        legacyRole: 'CLIENT',
        isActive: true,
      },
    }),
  );

  // ── Halls ──
  const hall1 = await findOrCreate(
    () => prismaTest.hall.findUnique({ where: { name: 'Sala G\u0142\u00f3wna' } }),
    () => prismaTest.hall.create({
      data: {
        name: 'Sala G\u0142\u00f3wna',
        capacity: 200,
        description: 'Du\u017ca sala na wesela i konferencje',
        isActive: true,
      },
    }),
  );

  const hall2 = await findOrCreate(
    () => prismaTest.hall.findUnique({ where: { name: 'Sala Kameralna' } }),
    () => prismaTest.hall.create({
      data: {
        name: 'Sala Kameralna',
        capacity: 50,
        description: 'Ma\u0142a sala na komunie i chrzciny',
        isActive: true,
      },
    }),
  );

  // #165: Hall that allows multiple simultaneous reservations (allowMultipleBookings = schema field name)
  const hallMultiBooking = await findOrCreate(
    () => prismaTest.hall.findUnique({ where: { name: 'Sala Wielorezerwacyjna' } }),
    () => prismaTest.hall.create({
      data: {
        name: 'Sala Wielorezerwacyjna',
        capacity: 300,
        description: 'Sala umo\u017cliwiaj\u0105ca wiele rezerwacji w tym samym terminie',
        isActive: true,
        allowMultipleBookings: true,
      },
    }),
  );

  // ── Event Types ──
  const eventType1 = await findOrCreate(
    () => prismaTest.eventType.findUnique({ where: { name: 'Wesele' } }),
    () => prismaTest.eventType.create({
      data: {
        name: 'Wesele',
        isActive: true,
      },
    }),
  );

  const eventType2 = await findOrCreate(
    () => prismaTest.eventType.findUnique({ where: { name: 'Komunia' } }),
    () => prismaTest.eventType.create({
      data: {
        name: 'Komunia',
        isActive: true,
      },
    }),
  );

  // ── Clients (no unique constraint on email, use findFirst) ──
  const client1 = await findOrCreate(
    () => prismaTest.client.findFirst({ where: { email: 'jan.kowalski@test.pl' } }),
    () => prismaTest.client.create({
      data: {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan.kowalski@test.pl',
        phone: '+48123456789',
        notes: 'Klient testowy nr 1',
      },
    }),
  );

  const client2 = await findOrCreate(
    () => prismaTest.client.findFirst({ where: { email: 'anna.nowak@test.pl' } }),
    () => prismaTest.client.create({
      data: {
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna.nowak@test.pl',
        phone: '+48987654321',
        notes: 'Klient testowy nr 2',
      },
    }),
  );

  return {
    admin,
    user,
    readonlyUser,
    hall1,
    hall2,
    hallMultiBooking,
    eventType1,
    eventType2,
    client1,
    client2,
  };
}

/**
 * Quick seed: only users (for auth tests).
 * Also uses find-or-create pattern.
 */
export async function seedUsersOnly() {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const admin = await findOrCreate(
    () => prismaTest.user.findUnique({ where: { email: 'admin@test.pl' } }),
    () => prismaTest.user.create({
      data: {
        email: 'admin@test.pl',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Testowy',
        legacyRole: 'ADMIN',
        isActive: true,
      },
    }),
  );

  return { admin };
}
