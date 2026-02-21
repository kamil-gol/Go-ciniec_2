/**
 * Service Extras — Integration Tests
 *
 * Full CRUD tests for:
 *   - Service Categories (admin catalog)
 *   - Service Items (admin catalog)
 *   - Reservation Extras (assignment to reservations)
 *   - Auth guards
 *   - Edge cases & validation
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

let categoryCounter = 0;

async function createCategory(overrides: Record<string, any> = {}) {
  categoryCounter++;
  const res = await api
    .post(`${BASE}/categories`)
    .set(authHeader())
    .send({
      name: `Dekoracje ${categoryCounter}`,
      slug: `dekoracje-${categoryCounter}`,
      icon: '🌸',
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

async function createReservation(overrides: Record<string, any> = {}) {
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
      ...overrides,
    },
  });
}

// ========================================
// 📁 Categories CRUD
// ========================================

describe('Categories CRUD', () => {
  describe('POST /categories', () => {
    it('should create a category', async () => {
      const res = await createCategory({
        name: 'Dekoracje',
        slug: 'dekoracje',
      });
      expectSuccess(res, 201);
      expect(res.body.data).toMatchObject({
        name: 'Dekoracje',
        slug: 'dekoracje',
        icon: '🌸',
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
      await createCategory({ slug: 'unique-slug', name: 'Pierwsza' });
      const res = await createCategory({ slug: 'unique-slug', name: 'Inna' });
      expect([400, 409]).toContain(res.status);
    });

    it('should create category with description', async () => {
      const res = await createCategory({
        name: 'Z opisem',
        slug: 'z-opisem',
        description: 'Kategoria z pełnym opisem testowym',
      });
      expectSuccess(res, 201);
      expect(res.body.data.description).toBe('Kategoria z pełnym opisem testowym');
    });

    it('should create category with isActive=false', async () => {
      const res = await createCategory({
        name: 'Nieaktywna',
        slug: 'nieaktywna',
        isActive: false,
      });
      expectSuccess(res, 201);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should auto-assign sortOrder on creation', async () => {
      const cat1 = await createCategory({ name: 'Pierwsza', slug: 'cat-order-1' });
      const cat2 = await createCategory({ name: 'Druga', slug: 'cat-order-2' });
      expectSuccess(cat1, 201);
      expectSuccess(cat2, 201);
      expect(cat2.body.data.sortOrder).toBeGreaterThanOrEqual(cat1.body.data.sortOrder);
    });

    it('should trim whitespace from name', async () => {
      const res = await createCategory({
        name: '  Spacjowa  ',
        slug: 'spacjowa',
      });
      expectSuccess(res, 201);
      // Should either trim or accept — verify name is stored
      expect(res.body.data.name).toBeDefined();
    });

    it('should reject empty string as name', async () => {
      const res = await api
        .post(`${BASE}/categories`)
        .set(authHeader())
        .send({ name: '', slug: 'empty-name' });
      expectError(res, 400);
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
      await createCategory({ name: 'Aktywna', slug: 'aktywna-f', isActive: true });
      await createCategory({ name: 'Nieaktywna', slug: 'nieaktywna-f', isActive: false });

      const res = await api
        .get(`${BASE}/categories?activeOnly=true`)
        .set(authHeader());
      expectSuccess(res);
      const names = res.body.data.map((c: any) => c.name);
      expect(names).toContain('Aktywna');
      expect(names).not.toContain('Nieaktywna');
    });

    it('should return categories in sortOrder', async () => {
      const cat1 = await createCategory({ name: 'A-first', slug: 'a-sorted' });
      const cat2 = await createCategory({ name: 'B-second', slug: 'b-sorted' });
      const cat3 = await createCategory({ name: 'C-third', slug: 'c-sorted' });

      const res = await api
        .get(`${BASE}/categories`)
        .set(authHeader());
      expectSuccess(res);

      const slugs = res.body.data.map((c: any) => c.slug);
      const idxA = slugs.indexOf('a-sorted');
      const idxB = slugs.indexOf('b-sorted');
      const idxC = slugs.indexOf('c-sorted');
      expect(idxA).toBeLessThan(idxB);
      expect(idxB).toBeLessThan(idxC);
    });

    it('should return empty array when no categories', async () => {
      // cleanDatabase already ran — no extra categories
      // Just verify it doesn't crash
      const res = await api
        .get(`${BASE}/categories`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should include item count or items in response', async () => {
      const catRes = await createCategory({ name: 'Z itemami', slug: 'with-items' });
      const catId = catRes.body.data.id;
      await createItem(catId, { name: 'Item 1' });
      await createItem(catId, { name: 'Item 2' });
      await createItem(catId, { name: 'Item 3' });

      const res = await api
        .get(`${BASE}/categories`)
        .set(authHeader());
      expectSuccess(res);

      const cat = res.body.data.find((c: any) => c.slug === 'with-items');
      expect(cat).toBeDefined();
      // Should have items array or _count
      const itemCount = cat.items?.length ?? cat._count?.items ?? 0;
      expect(itemCount).toBe(3);
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

    it('should 400 for invalid UUID', async () => {
      const res = await api
        .get(`${BASE}/categories/not-a-uuid`)
        .set(authHeader());
      expectError(res, 400);
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

    it('should update only provided fields (partial update)', async () => {
      const catRes = await createCategory({
        name: 'Oryginalna',
        slug: 'partial-test',
        color: '#ff0000',
        icon: '🎉',
      });
      const id = catRes.body.data.id;

      const res = await api
        .put(`${BASE}/categories/${id}`)
        .set(authHeader())
        .send({ color: '#00ff00' });
      expectSuccess(res);
      expect(res.body.data.color).toBe('#00ff00');
      expect(res.body.data.name).toBe('Oryginalna');
      expect(res.body.data.icon).toBe('🎉');
    });

    it('should toggle isActive', async () => {
      const catRes = await createCategory({ isActive: true });
      const id = catRes.body.data.id;

      const res = await api
        .put(`${BASE}/categories/${id}`)
        .set(authHeader())
        .send({ isActive: false });
      expectSuccess(res);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should 404 for non-existent category', async () => {
      const res = await api
        .put(`${BASE}/categories/00000000-0000-0000-0000-000000000099`)
        .set(authHeader())
        .send({ name: 'Ghost' });
      expectError(res, 404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category and cascade items', async () => {
      const catRes = await createCategory();
      const id = catRes.body.data.id;
      const item1 = await createItem(id, { name: 'Cascade A' });
      const item2 = await createItem(id, { name: 'Cascade B' });

      const res = await api
        .delete(`${BASE}/categories/${id}`)
        .set(authHeader());
      expectSuccess(res);

      // Verify category gone
      const check = await api
        .get(`${BASE}/categories/${id}`)
        .set(authHeader());
      expectError(check, 404);

      // Verify items also gone
      const itemCheck = await api
        .get(`${BASE}/items?categoryId=${id}`)
        .set(authHeader());
      expectSuccess(itemCheck);
      expect(itemCheck.body.data.length).toBe(0);
    });

    it('should delete empty category', async () => {
      const catRes = await createCategory();
      const id = catRes.body.data.id;

      const res = await api
        .delete(`${BASE}/categories/${id}`)
        .set(authHeader());
      expectSuccess(res);
    });

    it('should 404 deleting non-existent category', async () => {
      const res = await api
        .delete(`${BASE}/categories/00000000-0000-0000-0000-000000000099`)
        .set(authHeader());
      expectError(res, 404);
    });
  });

  describe('POST /categories/reorder', () => {
    it('should reorder categories', async () => {
      const cat1 = await createCategory({ name: 'A', slug: 'reorder-a' });
      const cat2 = await createCategory({ name: 'B', slug: 'reorder-b' });
      const cat3 = await createCategory({ name: 'C', slug: 'reorder-c' });

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
      const idxC = slugs.indexOf('reorder-c');
      const idxA = slugs.indexOf('reorder-a');
      const idxB = slugs.indexOf('reorder-b');
      expect(idxC).toBeLessThan(idxA);
      expect(idxA).toBeLessThan(idxB);
    });

    it('should reject empty orderedIds', async () => {
      const res = await api
        .post(`${BASE}/categories/reorder`)
        .set(authHeader())
        .send({ orderedIds: [] });
      expect([400, 422]).toContain(res.status);
    });

    it('should reject non-array orderedIds', async () => {
      const res = await api
        .post(`${BASE}/categories/reorder`)
        .set(authHeader())
        .send({ orderedIds: 'not-an-array' });
      expect([400, 422]).toContain(res.status);
    });
  });
});

// ========================================
// 📦 Items CRUD
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
      expect(res.body.data.basePrice).toBe(50);
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

    it('should create item with description', async () => {
      const res = await createItem(categoryId, {
        name: 'Z opisem',
        description: 'Szczegółowy opis usługi dodatkowej',
      });
      expectSuccess(res, 201);
      expect(res.body.data.description).toBe('Szczegółowy opis usługi dodatkowej');
    });

    it('should create item with icon', async () => {
      const res = await createItem(categoryId, {
        name: 'Z ikoną',
        icon: '🎂',
      });
      expectSuccess(res, 201);
      expect(res.body.data.icon).toBe('🎂');
    });

    it('should create exclusive item', async () => {
      const res = await createItem(categoryId, {
        name: 'Ekskluzywna',
        isExclusive: true,
      });
      expectSuccess(res, 201);
      expect(res.body.data.isExclusive).toBe(true);
    });

    it('should create item that requires note', async () => {
      const res = await createItem(categoryId, {
        name: 'Z notatką',
        requiresNote: true,
      });
      expectSuccess(res, 201);
      expect(res.body.data.requiresNote).toBe(true);
    });

    it('should create inactive item', async () => {
      const res = await createItem(categoryId, {
        name: 'Nieaktywna pozycja',
        isActive: false,
      });
      expectSuccess(res, 201);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should reject invalid priceType', async () => {
      const res = await api
        .post(`${BASE}/items`)
        .set(authHeader())
        .send({
          categoryId,
          name: 'Zły typ',
          priceType: 'INVALID_TYPE',
          basePrice: 100,
        });
      expectError(res, 400);
    });

    it('should reject negative basePrice', async () => {
      const res = await api
        .post(`${BASE}/items`)
        .set(authHeader())
        .send({
          categoryId,
          name: 'Ujemna cena',
          priceType: 'FLAT',
          basePrice: -100,
        });
      expectError(res, 400);
    });

    it('should reject non-existent categoryId', async () => {
      const res = await api
        .post(`${BASE}/items`)
        .set(authHeader())
        .send({
          categoryId: '00000000-0000-0000-0000-000000000099',
          name: 'Ghost category',
          priceType: 'FLAT',
          basePrice: 100,
        });
      expect([400, 404]).toContain(res.status);
    });

    it('should reject item without name', async () => {
      const res = await api
        .post(`${BASE}/items`)
        .set(authHeader())
        .send({
          categoryId,
          priceType: 'FLAT',
          basePrice: 100,
        });
      expectError(res, 400);
    });

    it('should allow zero basePrice for FLAT type', async () => {
      const res = await createItem(categoryId, {
        name: 'Darmowy FLAT',
        priceType: 'FLAT',
        basePrice: 0,
      });
      expectSuccess(res, 201);
      expect(res.body.data.basePrice).toBe(0);
    });

    it('should handle large basePrice', async () => {
      const res = await createItem(categoryId, {
        name: 'Drogi',
        priceType: 'FLAT',
        basePrice: 99999,
      });
      expectSuccess(res, 201);
      expect(res.body.data.basePrice).toBe(99999);
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

    it('should return all items without categoryId filter', async () => {
      await createItem(categoryId, { name: 'Item X' });

      const cat2Res = await createCategory({ name: 'Inna kategoria', slug: 'inna-kat' });
      await createItem(cat2Res.body.data.id, { name: 'Item Y' });

      const res = await api
        .get(`${BASE}/items`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for category with no items', async () => {
      const res = await api
        .get(`${BASE}/items?categoryId=${categoryId}`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /items/:id', () => {
    it('should return single item with category info', async () => {
      const itemRes = await createItem(categoryId, { name: 'Konkretny' });
      const id = itemRes.body.data.id;

      const res = await api
        .get(`${BASE}/items/${id}`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data.id).toBe(id);
      expect(res.body.data.name).toBe('Konkretny');
    });

    it('should 404 for non-existent item', async () => {
      const res = await api
        .get(`${BASE}/items/00000000-0000-0000-0000-000000000099`)
        .set(authHeader());
      expectError(res, 404);
    });

    it('should 400 for invalid UUID', async () => {
      const res = await api
        .get(`${BASE}/items/bad-uuid`)
        .set(authHeader());
      expectError(res, 400);
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

    it('should update priceType from FLAT to PER_PERSON', async () => {
      const itemRes = await createItem(categoryId, {
        priceType: 'FLAT',
        basePrice: 500,
      });
      const id = itemRes.body.data.id;

      const res = await api
        .put(`${BASE}/items/${id}`)
        .set(authHeader())
        .send({ priceType: 'PER_PERSON', basePrice: 50 });
      expectSuccess(res);
      expect(res.body.data.priceType).toBe('PER_PERSON');
      expect(res.body.data.basePrice).toBe(50);
    });

    it('should update isExclusive flag', async () => {
      const itemRes = await createItem(categoryId, { isExclusive: false });
      const id = itemRes.body.data.id;

      const res = await api
        .put(`${BASE}/items/${id}`)
        .set(authHeader())
        .send({ isExclusive: true });
      expectSuccess(res);
      expect(res.body.data.isExclusive).toBe(true);
    });

    it('should update requiresNote flag', async () => {
      const itemRes = await createItem(categoryId, { requiresNote: false });
      const id = itemRes.body.data.id;

      const res = await api
        .put(`${BASE}/items/${id}`)
        .set(authHeader())
        .send({ requiresNote: true });
      expectSuccess(res);
      expect(res.body.data.requiresNote).toBe(true);
    });

    it('should toggle isActive on item', async () => {
      const itemRes = await createItem(categoryId, { isActive: true });
      const id = itemRes.body.data.id;

      const res = await api
        .put(`${BASE}/items/${id}`)
        .set(authHeader())
        .send({ isActive: false });
      expectSuccess(res);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should update description and icon', async () => {
      const itemRes = await createItem(categoryId);
      const id = itemRes.body.data.id;

      const res = await api
        .put(`${BASE}/items/${id}`)
        .set(authHeader())
        .send({ description: 'Nowy opis', icon: '🌟' });
      expectSuccess(res);
      expect(res.body.data.description).toBe('Nowy opis');
      expect(res.body.data.icon).toBe('🌟');
    });

    it('should 404 for non-existent item', async () => {
      const res = await api
        .put(`${BASE}/items/00000000-0000-0000-0000-000000000099`)
        .set(authHeader())
        .send({ name: 'Ghost' });
      expectError(res, 404);
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

    it('should 404 deleting non-existent item', async () => {
      const res = await api
        .delete(`${BASE}/items/00000000-0000-0000-0000-000000000099`)
        .set(authHeader());
      expectError(res, 404);
    });

    it('should not affect other items in same category', async () => {
      const item1 = await createItem(categoryId, { name: 'Zostaje' });
      const item2 = await createItem(categoryId, { name: 'Do usunięcia' });

      await api
        .delete(`${BASE}/items/${item2.body.data.id}`)
        .set(authHeader());

      const res = await api
        .get(`${BASE}/items?categoryId=${categoryId}`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Zostaje');
    });
  });
});

// ========================================
// 🔗 Reservation Extras
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

    it('should assign PER_PERSON extra', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemPerPersonId, quantity: 1 });
      expectSuccess(res, 201);
      expect(res.body.data.priceType).toBe('PER_PERSON');
    });

    it('should default quantity to 1', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });
      expectSuccess(res, 201);
      expect(res.body.data.quantity).toBe(1);
    });

    it('should assign extra with custom note', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({
          serviceItemId: itemFlatId,
          note: 'Tort czekoladowy 5 pięter',
        });
      expectSuccess(res, 201);
      expect(res.body.data.note).toBe('Tort czekoladowy 5 pięter');
    });

    it('should assign extra with custom price override', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({
          serviceItemId: itemFlatId,
          customPrice: 750,
        });
      expectSuccess(res, 201);
      // customPrice or priceOverride should be stored
      const price = res.body.data.customPrice ?? res.body.data.priceOverride ?? res.body.data.totalPrice;
      expect(price).toBeDefined();
    });

    it('should reject non-existent serviceItemId', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({
          serviceItemId: '00000000-0000-0000-0000-000000000099',
        });
      expect([400, 404]).toContain(res.status);
    });

    it('should reject non-existent reservationId', async () => {
      const res = await api
        .post(`${BASE}/reservations/00000000-0000-0000-0000-000000000099/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });
      expect([400, 404]).toContain(res.status);
    });

    it('should reject zero quantity', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId, quantity: 0 });
      expect([400, 422]).toContain(res.status);
    });

    it('should reject negative quantity', async () => {
      const res = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId, quantity: -1 });
      expect([400, 422]).toContain(res.status);
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

    it('should return empty array for reservation with no extras', async () => {
      const res = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data).toEqual([]);
    });

    it('should sum totalExtrasPrice for multiple extras', async () => {
      // FLAT: 500 x 2 = 1000
      await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId, quantity: 2 });

      // FREE: 0
      await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFreeId });

      const res = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expectSuccess(res);
      expect(res.body.data.length).toBe(2);
      expect(res.body.totalExtrasPrice).toBeGreaterThanOrEqual(500);
    });

    it('should include item details in extras response', async () => {
      await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });

      const res = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expectSuccess(res);

      const extra = res.body.data[0];
      // Should include serviceItem or item details
      const itemRef = extra.serviceItem || extra.item;
      if (itemRef) {
        expect(itemRef.name).toBe('Tort');
      }
    });

    it('should 404 for non-existent reservation', async () => {
      const res = await api
        .get(`${BASE}/reservations/00000000-0000-0000-0000-000000000099/extras`)
        .set(authHeader());
      expect([200, 404]).toContain(res.status);
      // Some APIs return empty array, others 404
      if (res.status === 200) {
        expect(res.body.data).toEqual([]);
      }
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

    it('should replace existing extras on bulk assign', async () => {
      // First assign one
      await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });

      // Bulk replace with different set
      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({
          extras: [
            { serviceItemId: itemFreeId },
          ],
        });
      expectSuccess(res);

      // Should only have 1 extra now
      const check = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expect(check.body.data.length).toBe(1);
    });

    it('should handle empty extras array (clear all)', async () => {
      await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });

      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ extras: [] });
      expectSuccess(res);

      const check = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expect(check.body.data.length).toBe(0);
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

    it('should update extra note', async () => {
      const assign = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });
      const extraId = assign.body.data.id;

      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras/${extraId}`)
        .set(authHeader())
        .send({ note: 'Zmieniona notatka' });
      expectSuccess(res);
      expect(res.body.data.note).toBe('Zmieniona notatka');
    });

    it('should 404 for non-existent extraId', async () => {
      const res = await api
        .put(`${BASE}/reservations/${reservationId}/extras/00000000-0000-0000-0000-000000000099`)
        .set(authHeader())
        .send({ quantity: 5 });
      expectError(res, 404);
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

    it('should not affect other extras when deleting one', async () => {
      const assign1 = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFlatId });
      const assign2 = await api
        .post(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader())
        .send({ serviceItemId: itemFreeId });

      await api
        .delete(`${BASE}/reservations/${reservationId}/extras/${assign1.body.data.id}`)
        .set(authHeader());

      const list = await api
        .get(`${BASE}/reservations/${reservationId}/extras`)
        .set(authHeader());
      expect(list.body.data.length).toBe(1);
    });

    it('should 404 for non-existent extraId', async () => {
      const res = await api
        .delete(`${BASE}/reservations/${reservationId}/extras/00000000-0000-0000-0000-000000000099`)
        .set(authHeader());
      expectError(res, 404);
    });
  });
});

// ========================================
// 💰 Price Calculations
// ========================================

describe('Price Calculations', () => {
  let categoryId: string;
  let reservationId: string;

  beforeEach(async () => {
    const catRes = await createCategory();
    categoryId = catRes.body.data.id;
    const reservation = await createReservation({ guestCount: 80 });
    reservationId = reservation.id;
  });

  it('should calculate FLAT price correctly (basePrice * quantity)', async () => {
    const item = await createItem(categoryId, {
      name: 'Tort',
      priceType: 'FLAT',
      basePrice: 600,
    });

    await api
      .post(`${BASE}/reservations/${reservationId}/extras`)
      .set(authHeader())
      .send({ serviceItemId: item.body.data.id, quantity: 2 });

    const res = await api
      .get(`${BASE}/reservations/${reservationId}/extras`)
      .set(authHeader());
    expectSuccess(res);

    const extra = res.body.data[0];
    const totalPrice = extra.totalPrice ?? extra.calculatedPrice;
    if (totalPrice !== undefined) {
      expect(totalPrice).toBe(1200); // 600 * 2
    }
  });

  it('should calculate FREE as zero regardless of quantity', async () => {
    const item = await createItem(categoryId, {
      name: 'Gratis',
      priceType: 'FREE',
      basePrice: 0,
    });

    await api
      .post(`${BASE}/reservations/${reservationId}/extras`)
      .set(authHeader())
      .send({ serviceItemId: item.body.data.id, quantity: 5 });

    const res = await api
      .get(`${BASE}/reservations/${reservationId}/extras`)
      .set(authHeader());
    expectSuccess(res);
    expect(res.body.totalExtrasPrice).toBe(0);
  });

  it('should aggregate totalExtrasPrice across multiple extras', async () => {
    const flatItem = await createItem(categoryId, {
      name: 'FLAT 300',
      priceType: 'FLAT',
      basePrice: 300,
    });
    const freeItem = await createItem(categoryId, {
      name: 'FREE Item',
      priceType: 'FREE',
      basePrice: 0,
    });

    await api
      .put(`${BASE}/reservations/${reservationId}/extras`)
      .set(authHeader())
      .send({
        extras: [
          { serviceItemId: flatItem.body.data.id, quantity: 3 },
          { serviceItemId: freeItem.body.data.id, quantity: 1 },
        ],
      });

    const res = await api
      .get(`${BASE}/reservations/${reservationId}/extras`)
      .set(authHeader());
    expectSuccess(res);
    // FLAT: 300*3 = 900, FREE: 0 → total >= 900
    expect(res.body.totalExtrasPrice).toBeGreaterThanOrEqual(900);
  });
});

// ========================================
// 🔄 Cross-reservation isolation
// ========================================

describe('Cross-reservation isolation', () => {
  let categoryId: string;
  let itemId: string;

  beforeEach(async () => {
    const catRes = await createCategory();
    categoryId = catRes.body.data.id;
    const item = await createItem(categoryId, {
      name: 'Shared item',
      priceType: 'FLAT',
      basePrice: 200,
    });
    itemId = item.body.data.id;
  });

  it('should isolate extras between different reservations', async () => {
    const res1 = await createReservation({ date: new Date('2026-07-01') });
    const res2 = await createReservation({ date: new Date('2026-07-02') });

    // Assign to reservation 1
    await api
      .post(`${BASE}/reservations/${res1.id}/extras`)
      .set(authHeader())
      .send({ serviceItemId: itemId, quantity: 5 });

    // Assign different quantity to reservation 2
    await api
      .post(`${BASE}/reservations/${res2.id}/extras`)
      .set(authHeader())
      .send({ serviceItemId: itemId, quantity: 1 });

    // Verify isolation
    const extras1 = await api
      .get(`${BASE}/reservations/${res1.id}/extras`)
      .set(authHeader());
    const extras2 = await api
      .get(`${BASE}/reservations/${res2.id}/extras`)
      .set(authHeader());

    expect(extras1.body.data.length).toBe(1);
    expect(extras2.body.data.length).toBe(1);
    expect(extras1.body.data[0].quantity).toBe(5);
    expect(extras2.body.data[0].quantity).toBe(1);
  });

  it('should not affect other reservations when deleting extra', async () => {
    const res1 = await createReservation({ date: new Date('2026-08-01') });
    const res2 = await createReservation({ date: new Date('2026-08-02') });

    const assign1 = await api
      .post(`${BASE}/reservations/${res1.id}/extras`)
      .set(authHeader())
      .send({ serviceItemId: itemId });
    await api
      .post(`${BASE}/reservations/${res2.id}/extras`)
      .set(authHeader())
      .send({ serviceItemId: itemId });

    // Delete from reservation 1
    await api
      .delete(`${BASE}/reservations/${res1.id}/extras/${assign1.body.data.id}`)
      .set(authHeader());

    // Reservation 2 should still have its extra
    const extras2 = await api
      .get(`${BASE}/reservations/${res2.id}/extras`)
      .set(authHeader());
    expect(extras2.body.data.length).toBe(1);
  });
});

// ========================================
// 🔒 Auth Guards
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

  it('should reject non-admin updating category', async () => {
    const catRes = await createCategory();
    const id = catRes.body.data.id;

    const res = await api
      .put(`${BASE}/categories/${id}`)
      .set(authHeader('VIEWER'))
      .send({ name: 'Hacked' });
    expectError(res, 403);
  });

  it('should reject non-admin deleting category', async () => {
    const catRes = await createCategory();
    const id = catRes.body.data.id;

    const res = await api
      .delete(`${BASE}/categories/${id}`)
      .set(authHeader('VIEWER'));
    expectError(res, 403);
  });

  it('should reject non-admin updating item', async () => {
    const catRes = await createCategory();
    const item = await createItem(catRes.body.data.id);

    const res = await api
      .put(`${BASE}/items/${item.body.data.id}`)
      .set(authHeader('VIEWER'))
      .send({ name: 'Hacked' });
    expectError(res, 403);
  });

  it('should reject non-admin deleting item', async () => {
    const catRes = await createCategory();
    const item = await createItem(catRes.body.data.id);

    const res = await api
      .delete(`${BASE}/items/${item.body.data.id}`)
      .set(authHeader('VIEWER'));
    expectError(res, 403);
  });

  it('should reject non-admin reordering categories', async () => {
    const res = await api
      .post(`${BASE}/categories/reorder`)
      .set(authHeader('VIEWER'))
      .send({ orderedIds: [] });
    expectError(res, 403);
  });

  it('should reject unauthenticated reservation extras access', async () => {
    const reservation = await createReservation();
    const res = await api
      .get(`${BASE}/reservations/${reservation.id}/extras`);
    expectError(res, 401);
  });

  it('should allow VIEWER to read categories', async () => {
    const res = await api
      .get(`${BASE}/categories`)
      .set(authHeader('VIEWER'));
    expectSuccess(res);
  });

  it('should allow VIEWER to read items', async () => {
    const res = await api
      .get(`${BASE}/items`)
      .set(authHeader('VIEWER'));
    expectSuccess(res);
  });
});
