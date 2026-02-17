/**
 * Integration Tests Setup
 * 
 * Runs before each integration test suite.
 * Handles database cleanup and connection management.
 */
import { connectTestDb, disconnectTestDb, cleanDatabase } from './prisma-test-client';

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await disconnectTestDb();
});
