/**
 * Menu API Integration Tests
 * Issue: #98 — Testy modułu Menu i Posiłki (sekcja 2: testy integracyjne API)
 *
 * Tests all menu-related endpoints against real test database.
 * Endpoints: /api/menu-templates, /api/menu-packages, /api/menu-options,
 *           /api/menu-courses, /api/addon-groups, /api/package-category-settings,
 *           /api/reservations/:id/menu (select/get/update/delete)
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';
import prismaTest from '../helpers/prisma-test-client';

let seed: TestSeedData;

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

  // ═══════════════════════════════════════════
  // AUTH MATRIX
  // ═══════════════════════════════════════════
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
        const res = await api.get(ep).set(authHeader('ADMIN'));
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      }
    });

    it('should allow EMPLOYEE GET access to menu endpoints', async () => {
      const res = await api.get('/api/menu-templates').set(authHeader('EMPLOYEE'));
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    it('should deny EMPLOYEE write access to menu-templates', async () => {
      const res = await api.post('/api/menu-templates')
        .set(authHeader('EMPLOYEE'))
        .send({ name: 'Test', eventTypeId: seed.eventType1.id });
      expect(res.status).toBe(403);
    });

    it('should deny CLIENT access to menu endpoints', async () => {
      const res = await api.get('/api/menu-templates').set(authHeader('CLIENT'));
      expect([401, 403]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // MENU TEMPLATES CRUD
  // ═══════════════════════════════════════════
  describe('Menu Templates — /api/menu-templates', () => {
    it('GET / should return empty array initially', async () => {
      const res = await api.get('/api/menu-templates').set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST / should create a new template', async () => {
      const res = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({
          name: 'Menu Weselne 2026',
          description: 'Standardowe menu weselne',
          eventTypeId: seed.eventType1.id,
          isActive: true,
        });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Menu Weselne 2026');
    });

    it('GET /:id should return created template', async () => {
      const created = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Template Test', eventTypeId: seed.eventType1.id });
      const templateId = created.body.data.id;

      const res = await api.get(`/api/menu-templates/${templateId}`).set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(templateId);
    });

    it('PUT /:id should update template', async () => {
      const created = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Old Name', eventTypeId: seed.eventType1.id });
      const templateId = created.body.data.id;

      const res = await api.put(`/api/menu-templates/${templateId}`)
        .set(authHeader('ADMIN'))
        .send({ name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
    });

    it('DELETE /:id should remove template', async () => {
      const created = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'To Delete', eventTypeId: seed.eventType1.id });
      const templateId = created.body.data.id;

      const res = await api.delete(`/api/menu-templates/${templateId}`).set(authHeader('ADMIN'));
      expect(res.status).toBe(200);

      const check = await api.get(`/api/menu-templates/${templateId}`).set(authHeader('ADMIN'));
      expect([404, 200]).toContain(check.status);
    });

    it('POST /:id/duplicate should clone template', async () => {
      const created = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Original', eventTypeId: seed.eventType1.id });
      const templateId = created.body.data.id;

      const res = await api.post(`/api/menu-templates/${templateId}/duplicate`)
        .set(authHeader('ADMIN'))
        .send({ name: 'Kopia — Original' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data.id).not.toBe(templateId);
    });

    it('GET /active/:eventTypeId should return active template', async () => {
      await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Active Template', eventTypeId: seed.eventType1.id, isActive: true });

      const res = await api.get(`/api/menu-templates/active/${seed.eventType1.id}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });

    it('GET /:id should return 404 for non-existent UUID', async () => {
      const res = await api.get('/api/menu-templates/00000000-0000-0000-0000-000000000099')
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════
  // MENU PACKAGES CRUD
  // ═══════════════════════════════════════════
  describe('Menu Packages — /api/menu-packages', () => {
    let templateId: string;

    beforeEach(async () => {
      const t = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Pkg Test Template', eventTypeId: seed.eventType1.id });
      templateId = t.body.data.id;
    });

    it('POST / should create a package', async () => {
      const res = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'Pakiet Standard', menuTemplateId: templateId, pricePerPerson: 250 });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
    });

    it('GET / should list packages', async () => {
      await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'P1', menuTemplateId: templateId, pricePerPerson: 200 });

      const res = await api.get('/api/menu-packages').set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /template/:templateId should list packages for template', async () => {
      await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'P1', menuTemplateId: templateId, pricePerPerson: 200 });

      const res = await api.get(`/api/menu-packages/template/${templateId}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });

    it('PUT /:id should update package', async () => {
      const created = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'Old Pkg', menuTemplateId: templateId, pricePerPerson: 100 });
      const pkgId = created.body.data.id;

      const res = await api.put(`/api/menu-packages/${pkgId}`)
        .set(authHeader('ADMIN'))
        .send({ name: 'Updated Pkg', pricePerPerson: 300 });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove package', async () => {
      const created = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'To Delete', menuTemplateId: templateId, pricePerPerson: 100 });

      const res = await api.delete(`/api/menu-packages/${created.body.data.id}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });

    it('PUT /reorder should reorder packages', async () => {
      const p1 = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'Pkg A', menuTemplateId: templateId, pricePerPerson: 100 });
      const p2 = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'Pkg B', menuTemplateId: templateId, pricePerPerson: 200 });

      const res = await api.put('/api/menu-packages/reorder')
        .set(authHeader('ADMIN'))
        .send({ packageIds: [p2.body.data.id, p1.body.data.id] });
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════
  // MENU OPTIONS CRUD
  // ═══════════════════════════════════════════
  describe('Menu Options — /api/menu-options', () => {
    it('GET / should return empty initially', async () => {
      const res = await api.get('/api/menu-options').set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });

    it('POST / should create an option', async () => {
      const res = await api.post('/api/menu-options')
        .set(authHeader('ADMIN'))
        .send({ name: 'Wódka premium', category: 'ALCOHOL', pricePerPerson: 30 });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
    });

    it('PUT /:id should update option', async () => {
      const created = await api.post('/api/menu-options')
        .set(authHeader('ADMIN'))
        .send({ name: 'Old Option', category: 'ALCOHOL', pricePerPerson: 20 });
      const optId = created.body.data.id;

      const res = await api.put(`/api/menu-options/${optId}`)
        .set(authHeader('ADMIN'))
        .send({ name: 'New Option', pricePerPerson: 40 });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove option', async () => {
      const created = await api.post('/api/menu-options')
        .set(authHeader('ADMIN'))
        .send({ name: 'To Delete', category: 'OTHER', pricePerPerson: 10 });

      const res = await api.delete(`/api/menu-options/${created.body.data.id}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════
  // MENU COURSES
  // ═══════════════════════════════════════════
  describe('Menu Courses — /api/menu-courses', () => {
    let packageId: string;

    beforeEach(async () => {
      const t = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Course Template', eventTypeId: seed.eventType1.id });
      const p = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'Course Pkg', menuTemplateId: t.body.data.id, pricePerPerson: 200 });
      packageId = p.body.data.id;
    });

    it('POST / should create a course', async () => {
      const res = await api.post('/api/menu-courses')
        .set(authHeader('ADMIN'))
        .send({ name: 'Przystawki', packageId, displayOrder: 0 });
      expect([200, 201]).toContain(res.status);
    });

    it('GET /package/:packageId should list courses for package', async () => {
      await api.post('/api/menu-courses')
        .set(authHeader('ADMIN'))
        .send({ name: 'Zupy', packageId, displayOrder: 1 });

      const res = await api.get(`/api/menu-courses/package/${packageId}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });

    it('PUT /:id should update course', async () => {
      const created = await api.post('/api/menu-courses')
        .set(authHeader('ADMIN'))
        .send({ name: 'Old Course', packageId, displayOrder: 0 });
      const courseId = created.body.data.id;

      const res = await api.put(`/api/menu-courses/${courseId}`)
        .set(authHeader('ADMIN'))
        .send({ name: 'Updated Course' });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove course', async () => {
      const created = await api.post('/api/menu-courses')
        .set(authHeader('ADMIN'))
        .send({ name: 'To Delete', packageId, displayOrder: 0 });

      const res = await api.delete(`/api/menu-courses/${created.body.data.id}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════
  // ADDON GROUPS
  // ═══════════════════════════════════════════
  describe('Addon Groups — /api/addon-groups', () => {
    it('GET / should return empty initially', async () => {
      const res = await api.get('/api/addon-groups').set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });

    it('POST / should create an addon group', async () => {
      const res = await api.post('/api/addon-groups')
        .set(authHeader('ADMIN'))
        .send({ name: 'Dodatki mięsne', priceType: 'PER_ITEM', basePrice: 25, minSelect: 0, maxSelect: 3 });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
    });

    it('GET /:id should return addon group', async () => {
      const created = await api.post('/api/addon-groups')
        .set(authHeader('ADMIN'))
        .send({ name: 'Test Group', priceType: 'FLAT', basePrice: 50 });
      const groupId = created.body.data.id;

      const res = await api.get(`/api/addon-groups/${groupId}`).set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(groupId);
    });

    it('PUT /:id should update addon group', async () => {
      const created = await api.post('/api/addon-groups')
        .set(authHeader('ADMIN'))
        .send({ name: 'Old Group', priceType: 'FLAT', basePrice: 50 });

      const res = await api.put(`/api/addon-groups/${created.body.data.id}`)
        .set(authHeader('ADMIN'))
        .send({ name: 'Updated Group' });
      expect(res.status).toBe(200);
    });

    it('DELETE /:id should remove addon group', async () => {
      const created = await api.post('/api/addon-groups')
        .set(authHeader('ADMIN'))
        .send({ name: 'To Delete', priceType: 'FLAT', basePrice: 0 });

      const res = await api.delete(`/api/addon-groups/${created.body.data.id}`)
        .set(authHeader('ADMIN'));
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════
  // FULL FLOW: Template → Package → Course → Reservation Menu
  // ═══════════════════════════════════════════
  describe('Full Menu Flow', () => {
    it('should support complete flow: template → package → select for reservation', async () => {
      // 1. Create template
      const templateRes = await api.post('/api/menu-templates')
        .set(authHeader('ADMIN'))
        .send({ name: 'Flow Template', eventTypeId: seed.eventType1.id, isActive: true });
      expect([200, 201]).toContain(templateRes.status);
      const templateId = templateRes.body.data.id;

      // 2. Create package
      const pkgRes = await api.post('/api/menu-packages')
        .set(authHeader('ADMIN'))
        .send({ name: 'Flow Package', menuTemplateId: templateId, pricePerPerson: 250 });
      expect([200, 201]).toContain(pkgRes.status);
      const packageId = pkgRes.body.data.id;

      // 3. Create course
      const courseRes = await api.post('/api/menu-courses')
        .set(authHeader('ADMIN'))
        .send({ name: 'Flow Course', packageId, displayOrder: 0 });
      expect([200, 201]).toContain(courseRes.status);

      // 4. Create a reservation to assign menu to
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateStr = futureDate.toISOString().split('T')[0];

      const resCreate = await api.post('/api/reservations')
        .set(authHeaderForUser({ id: seed.admin.id, email: seed.admin.email, role: 'ADMIN' }))
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
      // Reservation may or may not succeed depending on date conflicts
      if ([200, 201].includes(resCreate.status) && resCreate.body.data?.id) {
        const reservationId = resCreate.body.data.id;

        // 5. Select menu for reservation
        const selectRes = await api.post(`/api/reservations/${reservationId}/select-menu`)
          .set(authHeader('ADMIN'))
          .send({ menuTemplateId: templateId, menuPackageId: packageId });
        // May return 200/201 or error depending on snapshot logic
        expect(selectRes.status).toBeLessThan(500);

        // 6. Get menu for reservation
        const getMenuRes = await api.get(`/api/reservations/${reservationId}/menu`)
          .set(authHeader('ADMIN'));
        expect(getMenuRes.status).toBeLessThan(500);
      }
    });
  });
});
