/**
 * Test Database Seeder
 * 
 * Seeds the test database with a minimal set of realistic data.
 * Used in integration tests when you need pre-existing records.
 * 
 * Field names match the actual Prisma schema:
 *   User: firstName, lastName, legacyRole (mapped to "role" column)
 *   Client: firstName, lastName
 * 
 * Usage:
 *   import { seedTestData } from '../helpers/db-seed';
 *   beforeAll(async () => { await seedTestData(); });
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

  // Users
  const admin = await prismaTest.user.create({
    data: {
      email: 'admin@test.pl',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Testowy',
      legacyRole: 'ADMIN',
      isActive: true,
    },
  });

  const user = await prismaTest.user.create({
    data: {
      email: 'user@test.pl',
      password: hashedPassword,
      firstName: 'User',
      lastName: 'Testowy',
      legacyRole: 'EMPLOYEE',
      isActive: true,
    },
  });

  const readonlyUser = await prismaTest.user.create({
    data: {
      email: 'readonly@test.pl',
      password: hashedPassword,
      firstName: 'Readonly',
      lastName: 'Testowy',
      legacyRole: 'CLIENT',
      isActive: true,
    },
  });

  // Halls
  const hall1 = await prismaTest.hall.create({
    data: {
      name: 'Sala G\u0142\u00f3wna',
      capacity: 200,
      description: 'Du\u017ca sala na wesela i konferencje',
      isActive: true,
    },
  });

  const hall2 = await prismaTest.hall.create({
    data: {
      name: 'Sala Kameralna',
      capacity: 50,
      description: 'Ma\u0142a sala na komunie i chrzciny',
      isActive: true,
    },
  });

  // Event Types
  const eventType1 = await prismaTest.eventType.create({
    data: {
      name: 'Wesele',
      isActive: true,
    },
  });

  const eventType2 = await prismaTest.eventType.create({
    data: {
      name: 'Komunia',
      isActive: true,
    },
  });

  // Clients
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

  const admin = await prismaTest.user.create({
    data: {
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
