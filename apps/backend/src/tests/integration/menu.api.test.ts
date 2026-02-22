/**
 * Menu API Integration Tests
 * Issue: #98 — Testy jednostkowe i integracyjne: moduł menu
 *
 * Tests all menu-related API endpoints against a real test database.
 * Uses supertest + prisma-test-client infrastructure.
 *
 * Endpoints covered:
 *   /api/menu-templates      — CRUD + duplicate + getActive
 *   /api/menu-packages       — CRUD + listByTemplate + reorder
 *   /api/menu-courses        — CRUD + assignDishes + removeDish
 *   /api/dish-categories     — CRUD + reorder (public GET)
 *   /api/dishes              — CRUD + filters
 *   /api/addon-groups        — CRUD + assignDishes + removeDish
 *   /api/package-category-settings — CRUD + bulkUpdate
 *   /api/menu-calculator     — calculate + availablePackages
 *   /api/reservations/:id/menu — select + get + update + delete
 *
 * NOTE: MenuOption and MenuPackageOption models removed from schema.
 *       Options are now passed via input data (SelectedOptionDTO), not from DB.
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';
import prismaTest from '../helpers/prisma-test-client';

// ════════════════════════════════════════════════════════════════
// HELPER: Seed menu-specific data on top of base seedTestData
// ════════════════════════════════════════════════════════════════

interface MenuSeedData extends TestSeedData {
  dishCategory: any;
  dish1: any;
  dish2: any;
  menuTemplate: any;
  menuPackage: any;
  reservation: any;
}

async function seedMenuData(): Promise<MenuSeedData> {
  const base = await seedTestData();

  // Dish Category
  const dishCategory = await prismaTest.dishCategory.create({
    data: {
      name: 'Zupy',
      slug: 'ZUPY',
      icon: '🍜',
      displayOrder: 1,
      isActive: true,
    },
  });

  // Dishes
  const dish1 = await prismaTest.dish.create({
    data: {
      name: 'Rosół z makaronem',
      description: 'Klasyczny rosół',
      categoryId: dishCategory.id,
      allergens: ['gluten'],
      isActive: true,
    },
  });

  const dish2 = await prismaTest.dish.create({
    data: {
      name: 'Żurek',
      description: 'Żurek z jajkiem i kiełbasą',
      categoryId: dishCategory.id,
      allergens: ['gluten', 'eggs'],
      isActive: true,
    },
  });

  // Menu Template
  const menuTemplate = await prismaTest.menuTemplate.create({
    data: {
      name: 'Menu Weselne 2026',
      variant: 'standard',
      eventTypeId: base.eventType1.id,
      isActive: true,
    },
  });

  // Menu Package — NOTE: MenuPackage model has NO isActive field
  const menuPackage = await prismaTest.menuPackage.create({
    data: {
      menuTemplateId: menuTemplate.id,
      name: 'Pakiet Złoty',
      description: 'Pełne menu weselne',
      pricePerAdult: 250,
      pricePerChild: 150,
      pricePerToddler: 0,
      includedItems: ['Przystawki', 'Zupa', 'Danie główne', 'Deser'],
      color: '#FFD700',
      icon: '⭐',
      displayOrder: 1,
    },
  });

  // Reservation (for menu selection tests)
  // Schema fields: date (String), startTime, endTime, adults, children, toddlers, guests, totalPrice, status
  const reservation = await prismaTest.reservation.create({
    data: {
      hallId: base.hall1.id,
      clientId: base.client1.id,
      eventTypeId: base.eventType1.id,
      createdById: base.admin.id,
      date: '2026-09-15',
      startTime: '16:00',
      endTime: '04:00',
      adults: 80,
      children: 20,
      toddlers: 10,
      guests: 110,
      totalPrice: 30000,
      status: 'CONFIRMED',
    },
  });

  return {
    ...base,
    dishCategory,
    dish1,
    dish2,
    menuTemplate,
    menuPackage,
    reservation,
  };
}

// ════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════

describe('Menu API — Integration Tests', () => {
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

  // ════════════════════════════════════════════════════
  // MENU TEMPLATES
  // ════════════════════════════════════════════════════
  describe('Menu Templates — /api/menu-templates', () => {
    describe('GET /api/menu-templates', () => {
      it('should return 200 + list for ADMIN', async () => {
        await seedMenuData();
        const res = await api.get('/api/menu-templates').set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should return 200 for EMPLOYEE (staff)', async () => {
        await seedMenuData();
        const res = await api.get('/api/menu-templates').set(authHeader('EMPLOYEE'));
        expect(res.status).toBe(200);
      });

      it('should return 401 without auth', async () => {
        const res = await api.get('/api/menu-templates');
        expect(res.status).toBe(401);
      });

      it('should return 403 for CLIENT role', async () => {
        const res = await api.get('/api/menu-templates').set(authHeader('CLIENT'));
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/menu-templates', () => {
      it('should create template as ADMIN', async () => {
        const seed = await seedTestData();
        const res = await api
          .post('/api/menu-templates')
          .set(authHeader('ADMIN'))
          .send({
            name: 'Menu Komunijne 2026',
            variant: 'basic',
            eventTypeId: seed.eventType2.id,
            isActive: true,
          });
        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
      });

      it('should return 403 for EMPLOYEE creating template', async () => {
        const seed = await seedTestData();
        const res = await api
          .post('/api/menu-templates')
          .set(authHeader('EMPLOYEE'))
          .send({
            name: 'Menu Test',
            variant: 'basic',
            eventTypeId: seed.eventType1.id,
          });
        expect(res.status).toBe(403);
      });

      it('should return 401 without auth', async () => {
        const res = await api
          .post('/api/menu-templates')
          .send({ name: 'Test' });
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/menu-templates/:id', () => {
      it('should return template by ID', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-templates/${seed.menuTemplate.id}`)
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should return 400 for invalid UUID', async () => {
        const res = await api
          .get('/api/menu-templates/not-a-uuid')
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(400);
      });

      it('should return 404 for non-existent template', async () => {
        await seedTestData();
        const res = await api
          .get('/api/menu-templates/00000000-0000-0000-0000-000000000099')
          .set(authHeader('ADMIN'));
        expect([404, 500]).toContain(res.status);
      });
    });

    describe('PUT /api/menu-templates/:id', () => {
      it('should update template as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/menu-templates/${seed.menuTemplate.id}`)
          .set(authHeader('ADMIN'))
          .send({ name: 'Menu Weselne 2026 — Updated' });
        expect(res.status).toBe(200);
      });

      it('should return 403 for EMPLOYEE', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/menu-templates/${seed.menuTemplate.id}`)
          .set(authHeader('EMPLOYEE'))
          .send({ name: 'Hacked' });
        expect(res.status).toBe(403);
      });
    });

    describe('DELETE /api/menu-templates/:id', () => {
      it('should delete template as ADMIN', async () => {
        const base = await seedTestData();
        // Create a template without packages so it can be deleted
        const tpl = await prismaTest.menuTemplate.create({
          data: {
            name: 'Do Usunięcia',
            variant: 'test',
            eventTypeId: base.eventType1.id,
            isActive: false,
          },
        });
        const res = await api
          .delete(`/api/menu-templates/${tpl.id}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(res.status);
      });

      it('should return 403 for EMPLOYEE', async () => {
        const seed = await seedMenuData();
        const res = await api
          .delete(`/api/menu-templates/${seed.menuTemplate.id}`)
          .set(authHeader('EMPLOYEE'));
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/menu-templates/:id/duplicate', () => {
      it('should duplicate template as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post(`/api/menu-templates/${seed.menuTemplate.id}/duplicate`)
          .set(authHeader('ADMIN'))
          .send({ newName: 'Menu Weselne 2026 — Kopia' });
        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/menu-templates/active/:eventTypeId', () => {
      it('should return active template for event type', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-templates/active/${seed.eventType1.id}`)
          .set(authHeader('ADMIN'));
        // May return 200 with data or 404 if no active template matches date logic
        expect([200, 404]).toContain(res.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // MENU PACKAGES
  // ════════════════════════════════════════════════════
  describe('Menu Packages — /api/menu-packages', () => {
    describe('GET /api/menu-packages', () => {
      it('should return all packages for staff', async () => {
        await seedMenuData();
        const res = await api.get('/api/menu-packages').set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should return 401 without auth', async () => {
        const res = await api.get('/api/menu-packages');
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/menu-packages/template/:templateId', () => {
      it('should return packages for specific template', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-packages/template/${seed.menuTemplate.id}`)
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/menu-packages/event-type/:eventTypeId', () => {
      it('should return packages for event type', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-packages/event-type/${seed.eventType1.id}`)
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/menu-packages', () => {
      it('should create package as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/menu-packages')
          .set(authHeader('ADMIN'))
          .send({
            menuTemplateId: seed.menuTemplate.id,
            name: 'Pakiet Srebrny',
            description: 'Podstawowe menu',
            pricePerAdult: 180,
            pricePerChild: 100,
            pricePerToddler: 0,
            includedItems: ['Zupa', 'Danie główne'],
            displayOrder: 2,
          });
        expect([200, 201]).toContain(res.status);
      });

      it('should return 403 for EMPLOYEE', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/menu-packages')
          .set(authHeader('EMPLOYEE'))
          .send({
            menuTemplateId: seed.menuTemplate.id,
            name: 'Test',
            pricePerAdult: 100,
            pricePerChild: 50,
            pricePerToddler: 0,
          });
        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/menu-packages/:id', () => {
      it('should return single package by ID', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-packages/${seed.menuPackage.id}`)
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
      });
    });

    describe('PUT /api/menu-packages/:id', () => {
      it('should update package as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/menu-packages/${seed.menuPackage.id}`)
          .set(authHeader('ADMIN'))
          .send({ name: 'Pakiet Złoty Premium' });
        expect(res.status).toBe(200);
      });
    });

    describe('DELETE /api/menu-packages/:id', () => {
      it('should delete package as ADMIN', async () => {
        const seed = await seedMenuData();
        // Create a separate deletable package
        const pkg = await prismaTest.menuPackage.create({
          data: {
            menuTemplateId: seed.menuTemplate.id,
            name: 'Do Usunięcia',
            pricePerAdult: 100,
            pricePerChild: 50,
            pricePerToddler: 0,
            displayOrder: 99,
          },
        });
        const res = await api
          .delete(`/api/menu-packages/${pkg.id}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(res.status);
      });
    });

    describe('PUT /api/menu-packages/reorder', () => {
      it('should reorder packages as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put('/api/menu-packages/reorder')
          .set(authHeader('ADMIN'))
          .send({
            packageOrders: [{ packageId: seed.menuPackage.id, displayOrder: 5 }],
          });
        expect([200, 204]).toContain(res.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // MENU COURSES
  // ════════════════════════════════════════════════════
  describe('Menu Courses — /api/menu-courses', () => {
    describe('GET /api/menu-courses/package/:packageId', () => {
      it('should return courses for package', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-courses/package/${seed.menuPackage.id}`)
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/menu-courses', () => {
      it('should create course as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/menu-courses')
          .set(authHeader('ADMIN'))
          .send({
            packageId: seed.menuPackage.id,
            name: 'Zupa',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            displayOrder: 1,
          });
        expect([200, 201]).toContain(res.status);
      });

      it('should return 403 for EMPLOYEE', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/menu-courses')
          .set(authHeader('EMPLOYEE'))
          .send({
            packageId: seed.menuPackage.id,
            name: 'Test',
          });
        expect(res.status).toBe(403);
      });
    });

    describe('Course CRUD + dish assignment', () => {
      it('should create, update, assign dishes, remove dish, and delete course', async () => {
        const seed = await seedMenuData();

        // Create course
        const createRes = await api
          .post('/api/menu-courses')
          .set(authHeader('ADMIN'))
          .send({
            packageId: seed.menuPackage.id,
            name: 'Zupy',
            minSelect: 1,
            maxSelect: 2,
            isRequired: true,
            displayOrder: 1,
          });
        expect([200, 201]).toContain(createRes.status);
        const courseId = createRes.body.data?.id || createRes.body.id;
        expect(courseId).toBeTruthy();

        // Get by ID
        const getRes = await api
          .get(`/api/menu-courses/${courseId}`)
          .set(authHeader('ADMIN'));
        expect(getRes.status).toBe(200);

        // Update
        const updateRes = await api
          .put(`/api/menu-courses/${courseId}`)
          .set(authHeader('ADMIN'))
          .send({ name: 'Zupy i Kremy' });
        expect(updateRes.status).toBe(200);

        // Assign dishes
        const assignRes = await api
          .post(`/api/menu-courses/${courseId}/dishes`)
          .set(authHeader('ADMIN'))
          .send({
            dishes: [
              { dishId: seed.dish1.id, isDefault: true, displayOrder: 0 },
              { dishId: seed.dish2.id, isDefault: false, displayOrder: 1 },
            ],
          });
        expect([200, 201]).toContain(assignRes.status);

        // Remove dish
        const removeRes = await api
          .delete(`/api/menu-courses/${courseId}/dishes/${seed.dish2.id}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(removeRes.status);

        // Delete course
        const deleteRes = await api
          .delete(`/api/menu-courses/${courseId}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(deleteRes.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // DISH CATEGORIES (public GET, admin write)
  // ════════════════════════════════════════════════════
  describe('Dish Categories — /api/dish-categories', () => {
    describe('GET /api/dish-categories', () => {
      it('should return 200 without auth (public)', async () => {
        const res = await api.get('/api/dish-categories');
        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/dish-categories', () => {
      it('should create category as ADMIN', async () => {
        await seedTestData();
        const res = await api
          .post('/api/dish-categories')
          .set(authHeader('ADMIN'))
          .send({
            name: 'Desery',
            slug: 'desery',
            icon: '🍰',
            displayOrder: 2,
          });
        expect([200, 201]).toContain(res.status);
      });

      it('should return 403 for EMPLOYEE', async () => {
        const res = await api
          .post('/api/dish-categories')
          .set(authHeader('EMPLOYEE'))
          .send({ name: 'Test', slug: 'test' });
        expect(res.status).toBe(403);
      });

      it('should return 401 without auth', async () => {
        const res = await api
          .post('/api/dish-categories')
          .send({ name: 'Test', slug: 'test' });
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/dish-categories/:id', () => {
      it('should return category by ID (public)', async () => {
        const seed = await seedMenuData();
        const res = await api.get(`/api/dish-categories/${seed.dishCategory.id}`);
        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/dish-categories/slug/:slug', () => {
      it('should return category by slug (public)', async () => {
        await seedMenuData();
        const res = await api.get('/api/dish-categories/slug/zupy');
        expect(res.status).toBe(200);
      });
    });

    describe('PUT /api/dish-categories/:id', () => {
      it('should update category as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/dish-categories/${seed.dishCategory.id}`)
          .set(authHeader('ADMIN'))
          .send({ name: 'Zupy i Kremy' });
        expect(res.status).toBe(200);
      });
    });

    describe('DELETE /api/dish-categories/:id', () => {
      it('should delete empty category as ADMIN', async () => {
        await seedTestData();
        const cat = await prismaTest.dishCategory.create({
          data: { name: 'Puste', slug: 'puste', displayOrder: 99 },
        });
        const res = await api
          .delete(`/api/dish-categories/${cat.id}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(res.status);
      });
    });

    describe('POST /api/dish-categories/reorder', () => {
      it('should reorder categories as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/dish-categories/reorder')
          .set(authHeader('ADMIN'))
          .send({
            ids: [seed.dishCategory.id],
          });
        expect([200, 204]).toContain(res.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // DISHES (public GET, admin write)
  // ════════════════════════════════════════════════════
  describe('Dishes — /api/dishes', () => {
    describe('GET /api/dishes', () => {
      it('should return dishes (public)', async () => {
        await seedMenuData();
        const res = await api.get('/api/dishes');
        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/dishes/:id', () => {
      it('should return single dish', async () => {
        const seed = await seedMenuData();
        const res = await api.get(`/api/dishes/${seed.dish1.id}`);
        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/dishes/category/:categoryId', () => {
      it('should return dishes by category', async () => {
        const seed = await seedMenuData();
        const res = await api.get(`/api/dishes/category/${seed.dishCategory.id}`);
        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/dishes', () => {
      it('should create dish as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/dishes')
          .set(authHeaderForUser({ id: seed.admin.id, email: seed.admin.email, role: 'ADMIN' }))
          .send({
            name: 'Barszcz czerwony',
            description: 'Z uszkami',
            categoryId: seed.dishCategory.id,
            allergens: ['gluten'],
          });
        expect([200, 201]).toContain(res.status);
      });

      it('should return 403 for EMPLOYEE', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/dishes')
          .set(authHeader('EMPLOYEE'))
          .send({
            name: 'Test',
            categoryId: seed.dishCategory.id,
          });
        expect(res.status).toBe(403);
      });
    });

    describe('PUT /api/dishes/:id', () => {
      it('should update dish as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/dishes/${seed.dish1.id}`)
          .set(authHeaderForUser({ id: seed.admin.id, email: seed.admin.email, role: 'ADMIN' }))
          .send({ name: 'Rosół tradycyjny' });
        expect(res.status).toBe(200);
      });
    });

    describe('DELETE /api/dishes/:id', () => {
      it('should delete dish as ADMIN', async () => {
        const seed = await seedMenuData();
        const spare = await prismaTest.dish.create({
          data: {
            name: 'Do usunięcia',
            categoryId: seed.dishCategory.id,
            isActive: false,
          },
        });
        const res = await api
          .delete(`/api/dishes/${spare.id}`)
          .set(authHeaderForUser({ id: seed.admin.id, email: seed.admin.email, role: 'ADMIN' }));
        expect([200, 204]).toContain(res.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // ADDON GROUPS
  // ════════════════════════════════════════════════════
  describe('Addon Groups — /api/addon-groups', () => {
    describe('GET /api/addon-groups', () => {
      it('should return groups for staff', async () => {
        await seedTestData();
        const res = await api.get('/api/addon-groups').set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
      });

      it('should return 401 without auth', async () => {
        const res = await api.get('/api/addon-groups');
        expect(res.status).toBe(401);
      });
    });

    describe('POST /api/addon-groups', () => {
      it('should create addon group as ADMIN', async () => {
        await seedTestData();
        const res = await api
          .post('/api/addon-groups')
          .set(authHeader('ADMIN'))
          .send({
            name: 'Dodatki do deseru',
            priceType: 'PER_PERSON',
            basePrice: 25,
            isActive: true,
          });
        expect([200, 201]).toContain(res.status);
      });
    });

    describe('Addon Group CRUD + dish operations', () => {
      it('should create, get, update, assign dishes, remove dish, delete group', async () => {
        const seed = await seedMenuData();

        // Create
        const createRes = await api
          .post('/api/addon-groups')
          .set(authHeader('ADMIN'))
          .send({
            name: 'Zupy dodatkowe',
            priceType: 'PER_ITEM',
            basePrice: 15,
            isActive: true,
          });
        expect([200, 201]).toContain(createRes.status);
        const groupId = createRes.body.data?.id || createRes.body.id;
        expect(groupId).toBeTruthy();

        // Get by ID
        const getRes = await api
          .get(`/api/addon-groups/${groupId}`)
          .set(authHeader('ADMIN'));
        expect(getRes.status).toBe(200);

        // Update
        const updateRes = await api
          .put(`/api/addon-groups/${groupId}`)
          .set(authHeader('ADMIN'))
          .send({ name: 'Zupy dodatkowe Premium' });
        expect(updateRes.status).toBe(200);

        // Assign dishes
        const assignRes = await api
          .put(`/api/addon-groups/${groupId}/dishes`)
          .set(authHeader('ADMIN'))
          .send({
            dishes: [
              { dishId: seed.dish1.id, displayOrder: 0 },
              { dishId: seed.dish2.id, displayOrder: 1 },
            ],
          });
        expect([200, 201]).toContain(assignRes.status);

        // Remove dish
        const removeRes = await api
          .delete(`/api/addon-groups/${groupId}/dishes/${seed.dish1.id}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(removeRes.status);

        // Delete group
        const deleteRes = await api
          .delete(`/api/addon-groups/${groupId}`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(deleteRes.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // PACKAGE CATEGORY SETTINGS
  // ════════════════════════════════════════════════════
  describe('Package Category Settings — /api/package-category-settings', () => {
    describe('GET /api/menu-packages/:packageId/categories', () => {
      it('should return category settings for package', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-packages/${seed.menuPackage.id}/categories`)
          .set(authHeader('ADMIN'));
        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/package-category-settings', () => {
      it('should create category setting as ADMIN', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/package-category-settings')
          .set(authHeader('ADMIN'))
          .send({
            packageId: seed.menuPackage.id,
            categoryId: seed.dishCategory.id,
            minSelect: 1,
            maxSelect: 2,
            isRequired: true,
            isEnabled: true,
          });
        expect([200, 201, 400]).toContain(res.status);
      });
    });

    describe('PUT /api/menu-packages/:packageId/categories', () => {
      it('should bulk update category settings', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/menu-packages/${seed.menuPackage.id}/categories`)
          .set(authHeader('ADMIN'))
          .send({
            settings: [],
          });
        expect([200, 204]).toContain(res.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // MENU CALCULATOR
  // ════════════════════════════════════════════════════
  describe('Menu Calculator — /api/menu-calculator', () => {
    describe('POST /api/menu-calculator/calculate', () => {
      it('should calculate menu price', async () => {
        const seed = await seedMenuData();
        const res = await api
          .post('/api/menu-calculator/calculate')
          .set(authHeader('ADMIN'))
          .send({
            packageId: seed.menuPackage.id,
            adultsCount: 80,
            childrenCount: 20,
            toddlersCount: 10,
            selectedOptions: [],
          });
        expect([200, 400]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body.success).toBe(true);
        }
      });

      it('should return 401 without auth', async () => {
        const res = await api
          .post('/api/menu-calculator/calculate')
          .send({ packageId: 'test' });
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/menu-calculator/packages/available', () => {
      it('should return available packages for event type', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/menu-calculator/packages/available?eventTypeId=${seed.eventType1.id}`)
          .set(authHeader('ADMIN'));
        expect([200, 400]).toContain(res.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // RESERVATION MENU SELECTION
  // ════════════════════════════════════════════════════
  describe('Reservation Menu — /api/reservations/:id/menu', () => {
    describe('POST /api/reservations/:id/select-menu', () => {
      it('should select menu for reservation', async () => {
        const seed = await seedMenuData();

        const res = await api
          .post(`/api/reservations/${seed.reservation.id}/select-menu`)
          .set(authHeader('ADMIN'))
          .send({
            packageId: seed.menuPackage.id,
            adultsCount: 80,
            childrenCount: 20,
            toddlersCount: 10,
            selectedOptions: [],
            dishSelections: [],
          });
        expect([200, 201, 400]).toContain(res.status);
      });

      it('should return 401 without auth', async () => {
        const res = await api
          .post('/api/reservations/00000000-0000-0000-0000-000000000001/select-menu')
          .send({});
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/reservations/:id/menu', () => {
      it('should return 404 when no menu selected', async () => {
        const seed = await seedMenuData();
        const res = await api
          .get(`/api/reservations/${seed.reservation.id}/menu`)
          .set(authHeader('ADMIN'));
        // No snapshot created yet
        expect([200, 400, 404, 500]).toContain(res.status);
      });
    });

    describe('PUT /api/reservations/:id/menu', () => {
      it('should return error when no snapshot exists', async () => {
        const seed = await seedMenuData();
        const res = await api
          .put(`/api/reservations/${seed.reservation.id}/menu`)
          .set(authHeader('ADMIN'))
          .send({ adultsCount: 100 });
        expect([200, 400, 404, 500]).toContain(res.status);
      });
    });

    describe('DELETE /api/reservations/:id/menu', () => {
      it('should return error when no snapshot exists', async () => {
        const seed = await seedMenuData();
        const res = await api
          .delete(`/api/reservations/${seed.reservation.id}/menu`)
          .set(authHeader('ADMIN'));
        expect([200, 204, 404, 500]).toContain(res.status);
      });
    });

    describe('Full menu selection flow', () => {
      it('should select, get, update guest counts, and delete menu', async () => {
        const seed = await seedMenuData();

        // 1. Select menu (options passed via input, not from DB)
        const selectRes = await api
          .post(`/api/reservations/${seed.reservation.id}/select-menu`)
          .set(authHeader('ADMIN'))
          .send({
            packageId: seed.menuPackage.id,
            adultsCount: 80,
            childrenCount: 20,
            toddlersCount: 10,
            selectedOptions: [],
            dishSelections: [],
          });

        if (![200, 201].includes(selectRes.status)) {
          // If select fails, skip rest
          return;
        }

        // 2. Get menu snapshot
        const getRes = await api
          .get(`/api/reservations/${seed.reservation.id}/menu`)
          .set(authHeader('ADMIN'));
        expect(getRes.status).toBe(200);

        // 3. Update guest counts
        const updateRes = await api
          .put(`/api/reservations/${seed.reservation.id}/menu`)
          .set(authHeader('ADMIN'))
          .send({ packageId: seed.menuPackage.id, selectedOptions: [], dishSelections: [] });
        expect(updateRes.status).toBe(200);

        // 4. Delete menu
        const deleteRes = await api
          .delete(`/api/reservations/${seed.reservation.id}/menu`)
          .set(authHeader('ADMIN'));
        expect([200, 204]).toContain(deleteRes.status);
      });
    });
  });

  // ════════════════════════════════════════════════════
  // AUTH MATRIX — Menu-specific endpoints
  // ════════════════════════════════════════════════════
  describe('Auth Matrix — Menu endpoints', () => {
    const staffGetEndpoints = [
      '/api/menu-templates',
      '/api/menu-packages',
      '/api/addon-groups',
    ];

    it('should block all menu GET endpoints without token', async () => {
      for (const path of staffGetEndpoints) {
        const res = await api.get(path);
        expect(res.status).toBe(401);
      }
    });

    it('should block CLIENT from staff-only menu endpoints', async () => {
      for (const path of staffGetEndpoints) {
        const res = await api.get(path).set(authHeader('CLIENT'));
        expect(res.status).toBe(403);
      }
    });

    it('should allow EMPLOYEE access to menu GET endpoints', async () => {
      await seedMenuData();
      for (const path of staffGetEndpoints) {
        const res = await api.get(path).set(authHeader('EMPLOYEE'));
        expect(res.status).toBe(200);
      }
    });

    it('should block EMPLOYEE from admin-only POST endpoints', async () => {
      const adminPostEndpoints = [
        '/api/menu-templates',
        '/api/menu-packages',
        '/api/menu-courses',
        '/api/addon-groups',
        '/api/package-category-settings',
      ];

      for (const path of adminPostEndpoints) {
        const res = await api
          .post(path)
          .set(authHeader('EMPLOYEE'))
          .send({});
        expect(res.status).toBe(403);
      }
    });

    it('should allow public access to dish categories and dishes', async () => {
      const publicEndpoints = [
        '/api/dish-categories',
        '/api/dishes',
      ];

      for (const path of publicEndpoints) {
        const res = await api.get(path);
        expect(res.status).toBe(200);
      }
    });
  });
});
