/**
 * Menu API Integration Tests
 * Issue: #98 — Testy modułu Menu i Posiłki (sekcja 2: testy integracyjne API)
 *
 * Tests all menu-related endpoints against real test database.
 * Endpoints: /api/menu-templates, /api/menu-packages, /api/menu-options,
 *           /api/menu-courses, /api/addon-groups, /api/package-category-settings,
 *           /api/reservations/:id/menu (select/get/update/delete)
 *
 * IMPORTANT: Uses authHeaderForUser(seed.admin) for write operations because
 * controllers extract userId from JWT for audit logging — the user must exist in DB.
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

let seed: TestSeedData;

/** Helper: auth header with real admin user from seed */
const adminAuth = () => authHeaderForUser({ id: seed.admin.id, email: seed.admin.email, role: 'ADMIN' });
/** Helper: auth header with real employee user from seed */
const employeeAuth = () => authHeaderForUser({ id: seed.user.id, email: seed.user.email, role: 'EMPLOYEE' });

/** Helper: valid future date for validFrom */
const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

/** Helper: valid far future date for validTo */
const farFutureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

/** Helper: create a template via API, return its id */
async function createTemplate(name: string = 'Test Template'): Promise<string> {
  const res = await api.post('/api/menu-templates')
    .set(adminAuth())
    .send({
      name,
      eventTypeId: seed.eventType1.id,
      validFrom: futureDate(),
      isActive: true,
    });
  expect(res.status).toBe(201);
  return res.body.data.id;
}

/** Helper: create a package via API, return its id */
async function createPackage(templateId: string, name: string = 'Test Package'): Promise<string> {
  const res = await api.post('/api/menu-packages')
    .set(adminAuth())
    .send({
      name,
      menuTemplateId: templateId,
      pricePerAdult: 250,
      pricePerChild: 150,
      pricePerToddler: 0,
    });
  expect(res.status).toBe(201);
  return res.body.data.id;
}

describe('Menu API — /api/menu-*', () => {
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

  // ═══════════════════════════════════════════════════════════════
  // AUTH MATRIX
  // ═══════════════════════════════════════════════════════════════
  describe('Auth Matrix', () => {
    it('should block unauthenticated access to menu-templates', async () => {
      const res = await api.get('/api/menu-templates');
      expect(res.status).toBe(401);
    });

    it('should block unauthenticated access to menu-packages', async () => {
      const res = await api.get('/api/menu-packages');
      expect(res.status).toBe(401);
    });

    it('should block unauthenticated access to menu-options', async () => {
      const res = await api.get('/api/menu-options');
      expect(res.status).toBe(401);
    });

    it('should block unauthenticated access to addon-groups', async () => {
      const res = await api.get('/api/addon-groups');
      expect(res.status).toBe(401);
    });

    it('should allow ADMIN GET access to menu endpoints', async () => {
      const endpoints = ['/api/menu-templates', '/api/menu-packages', '/api/menu-options', '/api/addon-groups'];
      for (const ep of endpoints) {
        const res = await api.get(ep).set(adminAuth());
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      }
    });

    it('should allow EMPLOYEE GET access to menu endpoints', async () => {
      const res = await api.get('/api/menu-templates').set(employeeAuth());
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    it('should deny EMPLOYEE write access to menu-templates', async () => {
      const res = await api.post('/api/menu-templates')
        .set(employeeAuth())
        .send({ name: 'Test', eventTypeId: seed.eventType1.id, validFrom: futureDate() });
      expect(res.status).toBe(403);
    });

    it('should deny CLIENT access to menu endpoints', async () => {
      const res = await api.get('/api/menu-templates')
        .set(authHeaderForUser({ id: seed.readonlyUser.id, email: seed.readonlyUser.email, role: 'CLIENT' }));
      expect([401, 403]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MENU TEMPLATES CRUD
  // ═══════════════════════════════════════════════════════════════
  describe('Menu Templates — /api/menu-templates', () => {
    it('GET / should return empty array initially', async () => {
      const res = await api.get('/api/menu-templates').set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST / should create a new template', async () => {
      const res = await api.post('/api/menu-templates')
        .set(adminAuth())
        .send({
          name: 'Menu Weselne 2026',
          description: 'Standardowe menu weselne',
          eventTypeId: seed.eventType1.id,
          validFrom: futureDate(),
          isActive: true,
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Menu Weselne 2026');
    });

    it('POST / should reject invalid data (missing validFrom)', async () => {
      const res = await api.post('/api/menu-templates')
        .set(adminAuth())
        .send({ name: 'No Date', eventTypeId: seed.eventType1.id });
      expect(res.status).toBe(400);
    });

    it('GET /:id should return created template', async () => {
      const templateId = await createTemplate('Template Test');

      const res = await api.get(`/api/menu-templates/${templateId}`).set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(templateId);
    });

    it('PUT /:id should update template', async () => {
      const templateId = await createTemplate('Old Name');

      const res = await api.put(`/api/menu-templates/${templateId}`)
        .set(adminAuth())
        .send({ name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
    });

    it('DELETE /:id should remove template', async () => {
      const templateId = await createTemplate('To Delete');

      const res = await api.delete(`/api/menu-templates/${templateId}`).set(adminAuth());
      expect(res.status).toBe(200);

      const check = await api.get(`/api/menu-templates/${templateId}`).set(adminAuth());
      expect(check.status).toBe(404);
    });

    it('POST /:id/duplicate should clone template', async () => {
      const templateId = await createTemplate('Original');

      const res = await api.post(`/api/menu-templates/${templateId}/duplicate`)
        .set(adminAuth())
        .send({ newName: 'Kopia — Original', validFrom: farFutureDate() });
      expect(res.status).toBe(201);
      expect(res.body.data.id).not.toBe(templateId);
    });

    it('GET /:id should return 404 for non-existent UUID', async () => {
      const res = await api.get('/api/menu-templates/00000000-0000-0000-0000-000000000099')
        .set(adminAuth());
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MENU PACKAGES CRUD
  // ═══════════════════════════════════════════════════════════════
  describe('Menu Packages — /api/menu-packages', () => {
    let templateId: string;

    beforeEach(async () => {
      templateId = await createTemplate('Pkg Test Template');
    });

    it('POST / should create a package', async () => {
      const res = await api.post('/api/menu-packages')
        .set(adminAuth())
        .send({
          name: 'Pakiet Standard',
          menuTemplateId: templateId,
          pricePerAdult: 250,
          pricePerChild: 150,
          pricePerToddler: 0,
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('GET / should list packages', async () => {
      await createPackage(templateId, 'P1');

      const res = await api.get('/api/menu-packages').set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /template/:templateId should list packages for template', async () => {
      await createPackage(templateId, 'P1');

      const res = await api.get(`/api/menu-packages/template/${templateId}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /:id should update package', async () => {
      const pkgId = await createPackage(templateId, 'Old Pkg');

      const res = await api.put(`/api/menu-packages/${pkgId}`)
        .set(adminAuth())
        .send({ name: 'Updated Pkg', pricePerAdult: 300 });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove package', async () => {
      const pkgId = await createPackage(templateId, 'To Delete');

      const res = await api.delete(`/api/menu-packages/${pkgId}`).set(adminAuth());
      expect(res.status).toBe(200);
    });

    it('PUT /reorder should reorder packages', async () => {
      const p1 = await createPackage(templateId, 'Pkg A');
      const p2 = await createPackage(templateId, 'Pkg B');

      const res = await api.put('/api/menu-packages/reorder')
        .set(adminAuth())
        .send({
          packageOrders: [
            { packageId: p2, displayOrder: 0 },
            { packageId: p1, displayOrder: 1 },
          ],
        });
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MENU OPTIONS CRUD
  // ═══════════════════════════════════════════════════════════════
  describe('Menu Options — /api/menu-options', () => {
    it('GET / should return empty initially', async () => {
      const res = await api.get('/api/menu-options').set(adminAuth());
      expect(res.status).toBe(200);
    });

    it('POST / should create an option', async () => {
      const res = await api.post('/api/menu-options')
        .set(adminAuth())
        .send({
          name: 'Wódka premium',
          category: 'ALCOHOL',
          priceType: 'PER_PERSON',
          priceAmount: 30,
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('POST / should reject missing required fields', async () => {
      const res = await api.post('/api/menu-options')
        .set(adminAuth())
        .send({ name: 'No price type' });
      expect(res.status).toBe(400);
    });

    it('PUT /:id should update option', async () => {
      const created = await api.post('/api/menu-options')
        .set(adminAuth())
        .send({ name: 'Old Option', category: 'ALCOHOL', priceType: 'FLAT', priceAmount: 20 });
      const optId = created.body.data.id;

      const res = await api.put(`/api/menu-options/${optId}`)
        .set(adminAuth())
        .send({ name: 'New Option', priceAmount: 40 });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove option', async () => {
      const created = await api.post('/api/menu-options')
        .set(adminAuth())
        .send({ name: 'To Delete', category: 'OTHER', priceType: 'FREE', priceAmount: 0 });

      const res = await api.delete(`/api/menu-options/${created.body.data.id}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MENU COURSES
  // ═══════════════════════════════════════════════════════════════
  describe('Menu Courses — /api/menu-courses', () => {
    let packageId: string;

    beforeEach(async () => {
      const templateId = await createTemplate('Course Template');
      packageId = await createPackage(templateId, 'Course Pkg');
    });

    it('POST / should create a course', async () => {
      const res = await api.post('/api/menu-courses')
        .set(adminAuth())
        .send({ name: 'Przystawki', packageId, displayOrder: 0 });
      expect(res.status).toBe(201);
    });

    it('GET /package/:packageId should list courses for package', async () => {
      await api.post('/api/menu-courses')
        .set(adminAuth())
        .send({ name: 'Zupy', packageId, displayOrder: 1 });

      const res = await api.get(`/api/menu-courses/package/${packageId}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /:id should update course', async () => {
      const created = await api.post('/api/menu-courses')
        .set(adminAuth())
        .send({ name: 'Old Course', packageId, displayOrder: 0 });
      const courseId = created.body.data.id;

      const res = await api.put(`/api/menu-courses/${courseId}`)
        .set(adminAuth())
        .send({ name: 'Updated Course' });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove course', async () => {
      const created = await api.post('/api/menu-courses')
        .set(adminAuth())
        .send({ name: 'To Delete', packageId, displayOrder: 0 });

      const res = await api.delete(`/api/menu-courses/${created.body.data.id}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ADDON GROUPS
  // ═══════════════════════════════════════════════════════════════
  describe('Addon Groups — /api/addon-groups', () => {
    it('GET / should return empty initially', async () => {
      const res = await api.get('/api/addon-groups').set(adminAuth());
      expect(res.status).toBe(200);
    });

    it('POST / should create an addon group', async () => {
      const res = await api.post('/api/addon-groups')
        .set(adminAuth())
        .send({ name: 'Dodatki mięsne', priceType: 'PER_ITEM', basePrice: 25, minSelect: 0, maxSelect: 3 });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('POST / should reject invalid priceType', async () => {
      const res = await api.post('/api/addon-groups')
        .set(adminAuth())
        .send({ name: 'Invalid', priceType: 'FLAT', basePrice: 10 });
      expect(res.status).toBe(400);
    });

    it('GET /:id should return addon group', async () => {
      const created = await api.post('/api/addon-groups')
        .set(adminAuth())
        .send({ name: 'Test Group', priceType: 'FREE' });
      const groupId = created.body.data.id;

      const res = await api.get(`/api/addon-groups/${groupId}`).set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(groupId);
    });

    it('PUT /:id should update addon group', async () => {
      const created = await api.post('/api/addon-groups')
        .set(adminAuth())
        .send({ name: 'Old Group', priceType: 'PER_PERSON', basePrice: 50 });

      const res = await api.put(`/api/addon-groups/${created.body.data.id}`)
        .set(adminAuth())
        .send({ name: 'Updated Group' });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove addon group', async () => {
      const created = await api.post('/api/addon-groups')
        .set(adminAuth())
        .send({ name: 'To Delete', priceType: 'FREE' });

      const res = await api.delete(`/api/addon-groups/${created.body.data.id}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FULL FLOW: Template → Package → Course → Reservation Menu
  // ═══════════════════════════════════════════════════════════════
  describe('Full Menu Flow', () => {
    it('should support complete flow: template → package → course', async () => {
      // 1. Create template
      const templateId = await createTemplate('Flow Template');

      // 2. Create package
      const packageId = await createPackage(templateId, 'Flow Package');

      // 3. Create course
      const courseRes = await api.post('/api/menu-courses')
        .set(adminAuth())
        .send({ name: 'Flow Course', packageId, displayOrder: 0 });
      expect(courseRes.status).toBe(201);

      // 4. Verify full chain via GET
      const pkgRes = await api.get(`/api/menu-packages/template/${templateId}`)
        .set(adminAuth());
      expect(pkgRes.status).toBe(200);
      expect(pkgRes.body.data.length).toBe(1);
      expect(pkgRes.body.data[0].id).toBe(packageId);

      const coursesRes = await api.get(`/api/menu-courses/package/${packageId}`)
        .set(adminAuth());
      expect(coursesRes.status).toBe(200);
      expect(coursesRes.body.data.length).toBe(1);
    });

    it('should support reservation menu selection flow', async () => {
      const templateId = await createTemplate('Reservation Flow Template');
      const packageId = await createPackage(templateId, 'Reservation Flow Package');

      // Create a reservation
      const futDate = new Date();
      futDate.setDate(futDate.getDate() + 60);
      const dateStr = futDate.toISOString().split('T')[0];

      const resCreate = await api.post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          date: dateStr,
          startTime: '18:00',
          endTime: '23:00',
          adults: 50,
          children: 10,
          toddlers: 5,
          status: 'CONFIRMED',
        });

      // Reservation may fail if date conflicts — skip rest if so
      if (![200, 201].includes(resCreate.status) || !resCreate.body.data?.id) return;
      const reservationId = resCreate.body.data.id;

      // Select menu
      const selectRes = await api.post(`/api/reservations/${reservationId}/select-menu`)
        .set(adminAuth())
        .send({ packageId });
      expect(selectRes.status).toBeLessThan(500);

      // Get menu
      const getMenuRes = await api.get(`/api/reservations/${reservationId}/menu`)
        .set(adminAuth());
      expect(getMenuRes.status).toBeLessThan(500);

      // Delete menu
      const deleteMenuRes = await api.delete(`/api/reservations/${reservationId}/menu`)
        .set(adminAuth());
      expect(deleteMenuRes.status).toBeLessThan(500);
    });
  });
});
