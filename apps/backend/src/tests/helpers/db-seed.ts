/**
 * Test Database Seeder
 *
 * Seeds the test database with a minimal set of realistic data.
 * Used in integration tests when you need pre-existing records.
 *
 * Uses upsert pattern for entities with unique constraints
 * to prevent crashes if cleanDatabase() partially failed.
 *
 * IMPORTANT: Field names MUST match Prisma schema exactly:
 *   - User: firstName, lastName, legacyRole (NOT name, role)
 *   - Client: firstName, lastName (NOT name)
 *   - User.id: UUID string (NOT number)
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
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  // Users — upsert to handle partial cleanup
  const admin = await prismaTest.user.upsert({
    where: { email: 'admin@test.pl' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'admin@test.pl',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Testowy',
      legacyRole: 'ADMIN',
      isActive: true,
    },
  });

  const user = await prismaTest.user.upsert({
    where: { email: 'user@test.pl' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'user@test.pl',
      password: hashedPassword,
      firstName: 'User',
      lastName: 'Testowy',
      legacyRole: 'EMPLOYEE',
      isActive: true,
    },
  });

  const readonlyUser = await prismaTest.user.upsert({
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

  // Halls — upsert by name
  const hall1 = await prismaTest.hall.upsert({
    where: { name: 'Sala G\u0142\u00f3wna' },
    update: { isActive: true },
    create: {
      name: 'Sala G\u0142\u00f3wna',
      capacity: 200,
      description: 'Du\u017ca sala na wesela i konferencje',
      isActive: true,
    },
  });

  const hall2 = await prismaTest.hall.upsert({
    where: { name: 'Sala Kameralna' },
    update: { isActive: true },
    create: {
      name: 'Sala Kameralna',
      capacity: 50,
      description: 'Ma\u0142a sala na komunie i chrzciny',
      isActive: true,
    },
  });

  // Event Types — upsert by name
  const eventType1 = await prismaTest.eventType.upsert({
    where: { name: 'Wesele' },
    update: { isActive: true },
    create: {
      name: 'Wesele',
      isActive: true,
    },
  });

  const eventType2 = await prismaTest.eventType.upsert({
    where: { name: 'Komunia' },
    update: { isActive: true },
    create: {
      name: 'Komunia',
      isActive: true,
    },
  });

  // Clients — no unique constraint on name, use create
  // Delete existing test clients first to avoid duplicates
  await prismaTest.client.deleteMany({
    where: { email: { in: ['jan.kowalski@test.pl', 'anna.nowak@test.pl'] } },
  });

  const client1 = await prismaTest.client.create({
    data: {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan.kowalski@test.pl',
      phone: '+48123456789',
      notes: 'Klient testowy nr 1',
    },
  });

  const client2 = await prismaTest.client.create({
    data: {
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@test.pl',
      phone: '+48987654321',
      notes: 'Klient testowy nr 2',
    },
  });

  return {
    admin,
    user,
    readonlyUser,
    hall1,
    hall2,
    eventType1,
    eventType2,
    client1,
    client2,
  };
}

/**
 * Quick seed: only users (for auth tests).
 */
export async function seedUsersOnly() {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const admin = await prismaTest.user.upsert({
    where: { email: 'admin@test.pl' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'admin@test.pl',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Testowy',
      legacyRole: 'ADMIN',
      isActive: true,
    },
  });

  return { admin };
}
