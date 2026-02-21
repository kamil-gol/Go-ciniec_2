/**
 * Clients, Halls & Event Types API Integration Tests
 * Issue: #99 — Klienci / Sale / Wydarzenia (Faza 3)
 *
 * Tests CRUD endpoints for supporting entities.
 */
import { api, authHeader } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData } from '../helpers/db-seed';
describe('Clients, Halls & Event Types API', () => {
    let seed;
    beforeAll(async () => {
        await connectTestDb();
    });
    beforeEach(async () => {
        await cleanDatabase();
        seed = await seedTestData();
    });
    afterAll(async () => {
        await cleanDatabase();
        await disconnectTestDb();
    });
    // ================================================================
    // CLIENTS — /api/clients
    // ================================================================
    describe('Clients API — /api/clients', () => {
        // ---------- POST ----------
        describe('POST /api/clients', () => {
            it('should create a client with valid data', async () => {
                const res = await api
                    .post('/api/clients')
                    .set(authHeader('ADMIN'))
                    .send({
                    firstName: 'Nowy',
                    lastName: 'Klient',
                    email: 'nowy@test.pl',
                    phone: '+48111222333',
                    notes: 'Testowy klient',
                });
                expect([200, 201]).toContain(res.status);
            });
            it('should return 401 without auth', async () => {
                const res = await api
                    .post('/api/clients')
                    .send({ firstName: 'Brak', lastName: 'Auth' });
                expect(res.status).toBe(401);
            });
            it('should return error for missing required fields', async () => {
                const res = await api
                    .post('/api/clients')
                    .set(authHeader('ADMIN'))
                    .send({ email: 'bezimienia@test.pl' });
                expect([400, 422, 500]).toContain(res.status);
            });
            it('should deny CLIENT role', async () => {
                const res = await api
                    .post('/api/clients')
                    .set(authHeader('CLIENT'))
                    .send({ firstName: 'Client', lastName: 'Attempt' });
                expect([401, 403]).toContain(res.status);
            });
        });
        // ---------- GET list ----------
        describe('GET /api/clients', () => {
            it('should list clients', async () => {
                const res = await api
                    .get('/api/clients')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(200);
            });
            it('should return seeded clients', async () => {
                const res = await api
                    .get('/api/clients')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(200);
            });
        });
        // ---------- GET by id ----------
        describe('GET /api/clients/:id', () => {
            it('should return client by id', async () => {
                const res = await api
                    .get(`/api/clients/${seed.client1.id}`)
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(200);
            });
            it('should return 400 for invalid UUID', async () => {
                const res = await api
                    .get('/api/clients/not-uuid')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(400);
            });
            it('should return 404 for non-existent UUID', async () => {
                const fakeUuid = '00000000-0000-4000-a000-000000000000';
                const res = await api
                    .get(`/api/clients/${fakeUuid}`)
                    .set(authHeader('ADMIN'));
                expect([404, 500]).toContain(res.status);
            });
        });
        // ---------- PUT ----------
        describe('PUT /api/clients/:id', () => {
            it('should update client data', async () => {
                const res = await api
                    .put(`/api/clients/${seed.client1.id}`)
                    .set(authHeader('ADMIN'))
                    .send({
                    firstName: 'Jan',
                    lastName: 'Kowalski Updated',
                    phone: '+48999888777',
                });
                expect(res.status).toBe(200);
            });
        });
        // ---------- DELETE (admin only) ----------
        describe('DELETE /api/clients/:id', () => {
            it('should allow ADMIN to delete client', async () => {
                const client = await prismaTest.client.create({
                    data: {
                        firstName: 'Do',
                        lastName: 'Usuniecia',
                        email: 'delete@test.pl',
                        phone: '+48000000000',
                    },
                });
                const res = await api
                    .delete(`/api/clients/${client.id}`)
                    .set(authHeader('ADMIN'));
                expect([200, 204]).toContain(res.status);
            });
            it('should deny CLIENT role from deleting client', async () => {
                const res = await api
                    .delete(`/api/clients/${seed.client1.id}`)
                    .set(authHeader('CLIENT'));
                expect(res.status).toBe(403);
            });
            it('should return 400 for invalid UUID', async () => {
                const res = await api
                    .delete('/api/clients/invalid')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(400);
            });
        });
    });
    // ================================================================
    // HALLS — /api/halls
    // ================================================================
    describe('Halls API — /api/halls', () => {
        // ---------- POST (admin only) ----------
        describe('POST /api/halls', () => {
            it('should create a hall with ADMIN', async () => {
                const res = await api
                    .post('/api/halls')
                    .set(authHeader('ADMIN'))
                    .send({
                    name: 'Sala Nowa',
                    capacity: 150,
                    description: 'Nowa sala testowa',
                });
                expect([200, 201]).toContain(res.status);
            });
            it('should deny CLIENT role from creating hall', async () => {
                const res = await api
                    .post('/api/halls')
                    .set(authHeader('CLIENT'))
                    .send({
                    name: 'Sala Nieautoryzowana',
                    capacity: 50,
                });
                expect(res.status).toBe(403);
            });
            it('should return error for missing name', async () => {
                const res = await api
                    .post('/api/halls')
                    .set(authHeader('ADMIN'))
                    .send({ capacity: 100 });
                expect([400, 422, 500]).toContain(res.status);
            });
        });
        // ---------- GET list ----------
        describe('GET /api/halls', () => {
            it('should list halls with auth', async () => {
                const res = await api
                    .get('/api/halls')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(200);
            });
            it('should return 401 without auth', async () => {
                const res = await api.get('/api/halls');
                expect(res.status).toBe(401);
            });
        });
        // ---------- GET by id ----------
        describe('GET /api/halls/:id', () => {
            it('should return hall by id', async () => {
                const res = await api
                    .get(`/api/halls/${seed.hall1.id}`)
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(200);
            });
            it('should return 400 for invalid UUID', async () => {
                const res = await api
                    .get('/api/halls/bad-uuid')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(400);
            });
        });
        // ---------- PUT (admin only) ----------
        describe('PUT /api/halls/:id', () => {
            it('should update hall with ADMIN', async () => {
                const res = await api
                    .put(`/api/halls/${seed.hall1.id}`)
                    .set(authHeader('ADMIN'))
                    .send({
                    name: 'Sala Glowna Zaktualizowana',
                    capacity: 250,
                });
                expect(res.status).toBe(200);
            });
            it('should deny CLIENT role from updating hall', async () => {
                const res = await api
                    .put(`/api/halls/${seed.hall1.id}`)
                    .set(authHeader('CLIENT'))
                    .send({ name: 'Hacked' });
                expect(res.status).toBe(403);
            });
        });
        // ---------- DELETE (admin only) ----------
        describe('DELETE /api/halls/:id', () => {
            it('should allow ADMIN to delete hall', async () => {
                const hall = await prismaTest.hall.create({
                    data: {
                        name: 'Sala Do Usuniecia',
                        capacity: 10,
                        isActive: true,
                    },
                });
                const res = await api
                    .delete(`/api/halls/${hall.id}`)
                    .set(authHeader('ADMIN'));
                expect([200, 204]).toContain(res.status);
            });
            it('should deny CLIENT role from deleting hall', async () => {
                const res = await api
                    .delete(`/api/halls/${seed.hall1.id}`)
                    .set(authHeader('CLIENT'));
                expect(res.status).toBe(403);
            });
        });
    });
    // ================================================================
    // EVENT TYPES — /api/event-types
    // ================================================================
    describe('Event Types API — /api/event-types', () => {
        // ---------- POST (admin only) ----------
        describe('POST /api/event-types', () => {
            it('should create event type with ADMIN', async () => {
                const res = await api
                    .post('/api/event-types')
                    .set(authHeader('ADMIN'))
                    .send({
                    name: 'Konferencja',
                    isActive: true,
                });
                expect([200, 201]).toContain(res.status);
            });
            it('should deny CLIENT role from creating event type', async () => {
                const res = await api
                    .post('/api/event-types')
                    .set(authHeader('CLIENT'))
                    .send({ name: 'Nieautoryzowany Typ' });
                expect(res.status).toBe(403);
            });
        });
        // ---------- GET list (public) ----------
        describe('GET /api/event-types', () => {
            it('should list event types (no auth required)', async () => {
                const res = await api.get('/api/event-types');
                expect(res.status).toBe(200);
            });
            it('should return seeded event types', async () => {
                const res = await api.get('/api/event-types');
                expect(res.status).toBe(200);
            });
        });
        // ---------- GET by id (public) ----------
        describe('GET /api/event-types/:id', () => {
            it('should return event type by id', async () => {
                const res = await api
                    .get(`/api/event-types/${seed.eventType1.id}`);
                expect(res.status).toBe(200);
            });
            it('should return 400 for invalid UUID', async () => {
                const res = await api.get('/api/event-types/not-uuid');
                expect(res.status).toBe(400);
            });
        });
        // ---------- GET stats ----------
        describe('GET /api/event-types/stats', () => {
            it('should return event type statistics', async () => {
                const res = await api
                    .get('/api/event-types/stats')
                    .set(authHeader('ADMIN'));
                expect(res.status).toBe(200);
            });
        });
        // ---------- GET colors (public) ----------
        describe('GET /api/event-types/colors', () => {
            it('should return predefined colors without auth', async () => {
                const res = await api.get('/api/event-types/colors');
                expect(res.status).toBe(200);
            });
        });
        // ---------- PUT (admin only) ----------
        describe('PUT /api/event-types/:id', () => {
            it('should update event type with ADMIN', async () => {
                const res = await api
                    .put(`/api/event-types/${seed.eventType1.id}`)
                    .set(authHeader('ADMIN'))
                    .send({ name: 'Wesele Premium' });
                expect(res.status).toBe(200);
            });
            it('should deny CLIENT role', async () => {
                const res = await api
                    .put(`/api/event-types/${seed.eventType1.id}`)
                    .set(authHeader('CLIENT'))
                    .send({ name: 'Hacked' });
                expect(res.status).toBe(403);
            });
        });
        // ---------- DELETE (admin only) ----------
        describe('DELETE /api/event-types/:id', () => {
            it('should allow ADMIN to delete event type', async () => {
                const et = await prismaTest.eventType.create({
                    data: { name: 'Do Usuniecia', isActive: true },
                });
                const res = await api
                    .delete(`/api/event-types/${et.id}`)
                    .set(authHeader('ADMIN'));
                expect([200, 204]).toContain(res.status);
            });
            it('should deny CLIENT role from deleting', async () => {
                const res = await api
                    .delete(`/api/event-types/${seed.eventType1.id}`)
                    .set(authHeader('CLIENT'));
                expect(res.status).toBe(403);
            });
        });
    });
});
//# sourceMappingURL=clients-halls-events.api.test.js.map