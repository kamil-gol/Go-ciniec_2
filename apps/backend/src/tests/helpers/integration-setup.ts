/**
 * Integration Tests Setup
 *
 * Runs before each integration test suite.
 * Handles database cleanup and connection management.
 *
 * NOTE: Ten plik jest w setupFiles — NIE może używać beforeAll/afterAll
 * (te są dostępne dopiero w plikach testowych).
 * Używamy go tylko do importu side-effectów.
 * Faktyczny cleanup robi się w plikach testów:
 *
 *   import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
 *   beforeAll(async () => { await connectTestDb(); });
 *   beforeEach(async () => { await cleanDatabase(); });
 *   afterAll(async () => { await cleanDatabase(); await disconnectTestDb(); });
 */

// Ensure test env vars are loaded
process.env.NODE_ENV = 'test';
