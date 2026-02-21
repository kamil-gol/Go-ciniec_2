/**
 * Service Extras — Integration Tests
 *
 * Full CRUD tests for:
 *   - Service Categories (admin catalog)
 *   - Service Items (admin catalog)
 *   - Reservation Extras (assignment to reservations)
 *   - Auth guards
 */

import {
  api,
  authHeader,
  expectSuccess,
  expectError,
  createTestUser,
  createTestClient,
  prismaTest,
} from '../helpers/test-utils';
import {
  cleanDatabase,
  connectTestDb,
  disconnectTestDb,
} from '../helpers/prisma-test-client';
import { seedTestData } from '../helpers/db-seed';

const BASE = '/api/service-extras';

// ========================================
// Lifecycle
// ========================================

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await cleanDatabase();
  await seedTestData();
});

afterAll(async () => {
  await cleanDatabase();
  await disconnectTestDb();
});

// ========================================
// Helpers
// ========================================

async function createCategory(overrides: Record<string, any> = {}) {
  const res = await api
    .post(`${BASE}/categories`)
    .set(authHeader())
    .send({
      name: 'Dekoracje',
      slug: 'dekoracje',
      icon: '\ud83c\udf38',
      color: '#ec4899',
      isActive: true,
      ...overrides,
    });
  return res;
}

async function createItem(categoryId: string, overrides: Record<string, any> = {}) {
  const res = await api
    .post(`${BASE}/items`)
    .set(authHeader())
    .send({
      categoryId,
      name: 'Tort weselny',
      priceType: 'FLAT',
      basePrice: 500,
      isActive: true,
      ...overrides,
    });
  return res;
}

async function createReservation() {
  // Find seeded hall & event type
  const hall = await prismaTest.hall.findFirst();
  const eventType = await prismaTest.eventType.findFirst();
  const client = await prismaTest.client.findFirst();

  if (!hall || !eventType || !client) {
    throw new Error('Seed data missing: hall, eventType or client');
  }

  return prismaTest.reservation.create({
    data: {
      hallId: hall.id,
      eventTypeId: eventType.id,
      clientId: client.id,
      date: new Date('2026-06-15'),
      timeFrom: '16:00',
      timeTo: '23:00',
      guestCount: 100,
      status: 'CONFIRMED',
    },
  });
}

// ========================================
// \ud83d\udcc1 Categories CRUD
// ========================================

describe('Categories CRUD', () => {
  describe('POST /categories', () => {
    it('should create a category', async () => {
      const res = await createCategory();
      expectSuccess(res, 201);
      expect(res.body.data).toMatchObject({
        name: 'Dekoracje',
        slug: 'dekoracje',
        icon: '\ud83c\udf38',
        color: '#ec4899',
        isActive: true,
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('should reject without required name', async () => {
      const res = await api
        .post(`${BASE}/categories`)
        .set(authHeader())
        .send({ slug: 'no-name' });
      expectError(res, 400);
    });

    it('should reject duplicate slug', async () => {
      await createCategory({ slug: 'unique-slug' });
      const res = await createCategory({ slug: 'unique-slug', name: 'Inna' });
      expect([400, 409]).toContain(res.status);
    });
  });

  describe('GET /categories', () => {
    it('should return all categories with items', async () => {
      const catRes = await createCategory();
      const catId = catRes.body.data.id;
      await createItem(catId);

      const res = await api
        .get(`${BASE}/categories`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter active only', async () => {
      await createCategory({ name: 'Aktywna', slug: 'aktywna', isActive: true });
      await createCategory({ name: 'Nieaktywna', slug: 'nieaktywna', isActive: false });

      const res = await api
        .get(`${BASE}/categories?activeOnly=true`)
        .set(authHeader());
      expectSuccess(res);
      const names = res.body.data.map((c: any) => c.name);
      expect(names).toContain('Aktywna');
      expect(names).not.toContain('Nieaktywna');
    });
  });

  describe('GET /categories/:id', () => {
    it('should return single category', async () => {
      const catRes = await createCategory();
      const id = catRes.body.data.id;

      const res = await api
        .get(`${BASE}/categories/${id}`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data.id).toBe(id);
    });

    it('should 404 for non-existent', async () => {
      const res = await api
        .get(`${BASE}/categories/00000000-0000-0000-0000-000000000099`)
        .set(authHeader());
      expectError(res, 404);
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update category', async () => {
      const catRes = await createCategory();
      const id = catRes.body.data.id;

      const res = await api
        .put(`${BASE}/categories/${id}`)
        .set(authHeader())
        .send({ name: 'Dekoracje Premium', color: '#8b5cf6' });
      expectSuccess(res);
      expect(res.body.data.name).toBe('Dekoracje Premium');
      expect(res.body.data.color).toBe('#8b5cf6');
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category and cascade items', async () => {
      const catRes = await createCategory();
      const id = catRes.body.data.id;
      await createItem(id);

      const res = await api
        .delete(`${BASE}/categories/${id}`)
        .set(authHeader());
      expectSuccess(res);

      // Verify category gone
      const check = await api
        .get(`${BASE}/categories/${id}`)
        .set(authHeader());
      expectError(check, 404);
    });
  });

  describe('POST /categories/reorder', () => {
    it('should reorder categories', async () => {
      const cat1 = await createCategory({ name: 'A', slug: 'a' });
      const cat2 = await createCategory({ name: 'B', slug: 'b' });
      const cat3 = await createCategory({ name: 'C', slug: 'c' });

      const ids = [
        cat3.body.data.id,
        cat1.body.data.id,
        cat2.body.data.id,
      ];

      const res = await api
        .post(`${BASE}/categories/reorder`)
        .set(authHeader())
        .send({ orderedIds: ids });
      expectSuccess(res);

      // Verify new order
      const list = await api
        .get(`${BASE}/categories`)
        .set(authHeader());
      const slugs = list.body.data.map((c: any) => c.slug);
      expect(slugs).toEqual(['c', 'a', 'b']);
    });
  });
});

// ========================================
// \ud83d\udce6 Items CRUD
// ========================================

describe('Items CRUD', () => {
  let categoryId: string;

  beforeEach(async () => {
    const catRes = await createCategory();
    categoryId = catRes.body.data.id;
  });

  describe('POST /items', () => {
    it('should create FLAT item', async () => {
      const res = await createItem(categoryId, {
        name: 'Tort',
        priceType: 'FLAT',
        basePrice: 800,
      });
      expectSuccess(res, 201);
      expect(res.body.data).toMatchObject({
        name: 'Tort',
        priceType: 'FLAT',
        basePrice: 800,
        categoryId,
      });
    });

    it('should create PER_PERSON item', async () => {
      const res = await createItem(categoryId, {
        name: 'Alkohol',
        priceType: 'PER_PERSON',
        basePrice: 50,
      });
      expectSuccess(res, 201);
      expect(res.body.data.priceType).toBe('PER_PERSON');
    });

    it('should create FREE item', async () => {
      const res = await createItem(categoryId, {
        name: 'Parking',
        priceType: 'FREE',
        basePrice: 0,
      });
      expectSuccess(res, 201);
      expect(res.body.data.priceType).toBe('FREE');
    });

    it('should reject without categoryId', async () => {
      const res = await api
        .post(`${BASE}/items`)
        .set(authHeader())
        .send({ name: 'Orphan', priceType: 'FLAT', basePrice: 100 });
      expectError(res, 400);
    });
  });

  describe('GET /items', () => {
    it('should list items filtered by categoryId', async () => {
      await createItem(categoryId, { name: 'Item A' });
      await createItem(categoryId, { name: 'Item B' });

      const res = await api
        .get(`${BASE}/items?categoryId=${categoryId}`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('PUT /items/:id', () => {
    it('should update item price and name', async () => {
      const itemRes = await createItem(categoryId);
      const id = itemRes.body.data.id;

      const res = await api
        .put(`${BASE}/items/${id}`)
        .set(authHeader())
        .send({ name: 'Tort Premium', basePrice: 1200 });
      expectSuccess(res);
      expect(res.body.data.name).toBe('Tort Premium');
      expect(res.body.data.basePrice).toBe(1200);
    });
  });

  describe('DELETE /items/:id', () => {
    it('should delete item', async () => {
      const itemRes = await createItem(categoryId);
      const id = itemRes.body.data.id;

      const res = await api
        .delete(`${BASE}/items/${id}`)
        .set(authHeader());
      expectSuccess(res);
    });
  });
});

// ========================================
// \ud83d\udd17 Reservation Extras
// ========================================

describe('Reservation Extras', () => {
  let categoryId: string;
  let itemFlatId: string;
  let itemPerPersonId: string;
  let itemFreeId: string;
  let reservationId: string;

  beforeEach(async () => {
    const catRes = await createCategory();
    categoryId = catRes.body.data.id;

    const flat = await createItem(categoryId, {
      name: 'Tort',
      priceType: 'FLAT',
      basePrice: 500,
    });
    itemFlatId = flat.body.data.id;

    const perPerson = await createItem(categoryId, {
      name: 'Alkohol',
      priceType: 'PER_PERSON',
      basePrice: 50,
    });
    itemPerPersonId = perPerson.body.data.id;

    const free = await createItem(categoryId, {
      name: 'Parking',
      priceType: 'FREE',
      basePrice: 0,
    });
    itemFreeId = free.body.data.id;

    const reservation = await createReservation();
    reservationId = reservation.id;
  });

  describe('POST /reservations/:id/extras', () => {
    it('should assign FLAT extra to reservation', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId, quantity: 2 });
      expectSuccess(res, 201);
      expect(res.body.data).toMatchObject({
        serviceItemId: itemFlatId,
        reservationId,
        quantity: 2,
        priceType: 'FLAT',
      });
    });

    it('should assign FREE extra with zero price', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFreeId });
      expectSuccess(res, 201);
      expect(res.body.data.totalPrice).toBe(0);
    });
  });

  describe('GET /reservations/:id/extras', () => {
    it('should return extras with totalExtrasPrice', async () => {
      await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId, quantity: 1 });

      const res = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(typeof res.body.totalExtrasPrice).toBe('number');
    });
  });

  describe('PUT /reservations/:id/extras (bulk)', () => {
    it('should bulk assign multiple extras', async () => {
      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({
          extras: [
            { serviceItemId: itemFlatId, quantity: 1 },
            { serviceItemId: itemPerPersonId, quantity: 1 },
            { serviceItemId: itemFreeId },
          ],
        });
      expectSuccess(res);
      expect(res.body.data.length).toBe(3);
    });
  });

  describe('PUT /reservations/:id/extras/:extraId', () => {
    it('should update extra quantity', async () => {
      const assign = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId, quantity: 1 });
      const extraId = assign.body.data.id;

      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras/${extraId}`)
        .set(authHeader())
        .send({ quantity: 3 });
      expectSuccess(res);
      expect(res.body.data.quantity).toBe(3);
    });

    it('should update extra status to CONFIRMED', async () => {
      const assign = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });
      const extraId = assign.body.data.id;

      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras/${extraId}`)
        .set(authHeader())
        .send({ status: 'CONFIRMED' });
      expectSuccess(res);
      expect(res.body.data.status).toBe('CONFIRMED');
    });
  });

  describe('DELETE /reservations/:id/extras/:extraId', () => {
    it('should remove extra from reservation', async () => {
      const assign = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });
      const extraId = assign.body.data.id;

      const res = await api
        .delete(`${BASE}/reservations/${reservationId}/extras/${extraId}`)
        .set(authHeader());
      expectSuccess(res);

      // Verify removed
      const list = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expect(list.body.data.length).toBe(0);
    });
  });
});

// ========================================
// \ud83d\udd12 Auth Guards
// ========================================

describe('Auth Guards', () => {
  it('should reject unauthenticated GET /categories', async () => {
    const res = await api.get(`${BASE}/categories`);
    expectError(res, 401);
  });

  it('should reject unauthenticated POST /categories', async () => {
    const res = await api
      .post(`${BASE}/categories`)
      .send({ name: 'Test', slug: 'test' });
    expectError(res, 401);
  });

  it('should reject unauthenticated GET /items', async () => {
    const res = await api.get(`${BASE}/items`);
    expectError(res, 401);
  });

  it('should reject unauthenticated POST /items', async () => {
    const res = await api
      .post(`${BASE}/items`)
      .send({ name: 'X', priceType: 'FLAT', basePrice: 10 });
    expectError(res, 401);
  });

  it('should reject non-admin creating category', async () => {
    const res = await api
      .post(`${BASE}/categories`)
      .set(authHeader('VIEWER'))
      .send({ name: 'Hack', slug: 'hack' });
    expectError(res, 403);
  });

  it('should reject non-admin creating item', async () => {
    const res = await api
      .post(`${BASE}/items`)
      .set(authHeader('VIEWER'))
      .send({ categoryId: '00000000-0000-0000-0000-000000000001', name: 'X', priceType: 'FLAT' });
    expectError(res, 403);
  });
});
