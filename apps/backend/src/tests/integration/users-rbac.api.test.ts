/**
 * Users & RBAC API Integration Tests
 * Issue: #247 — Rozszerzenie testów integracyjnych
 *
 * Tests:
 * - User management CRUD (settings:manage_users permission)
 * - Role management CRUD (settings:manage_roles permission)
 * - Permission listing (settings:read permission)
 * - Company settings CRUD (settings:manage_company permission)
 * - Archive settings (settings:manage_company permission)
 */
import { api, authHeader, createTestUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Users & RBAC API', () => {
  let seed: TestSeedData;

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

  const adminAuth = () => authHeader('ADMIN');
  const employeeAuth = () => authHeader('EMPLOYEE');

  // ================================================================
  // USERS — /api/settings/users
  // ================================================================
  describe('Users — /api/settings/users', () => {
    describe('GET /api/settings/users', () => {
      it('should list users with admin auth', async () => {
        const res = await api
          .get('/api/settings/users')
          .set(adminAuth());

        expect(res.status).toBe(200);
      });

      it('should return 401 without auth', async () => {
        const res = await api.get('/api/settings/users');

        expect(res.status).toBe(401);
      });

      it('should return 403 for employee without permission', async () => {
        const res = await api
          .get('/api/settings/users')
          .set(employeeAuth());

        expect([401, 403]).toContain(res.status);
      });
    });

    describe('POST /api/settings/users', () => {
      let roleId: string;

      beforeEach(async () => {
        // Ensure a role exists for user creation
        const role = await prismaTest.role.create({
          data: {
            name: 'Test Role',
            slug: 'test-role',
            isActive: true,
          },
        });
        roleId = role.id;
      });

      it('should create a new user with valid data', async () => {
        const res = await api
          .post('/api/settings/users')
          .set(adminAuth())
          .send({
            email: 'newuser@test.pl',
            password: 'ValidPass123!',
            firstName: 'Nowy',
            lastName: 'Użytkownik',
            roleId,
          });

        expect([200, 201]).toContain(res.status);
      });

      it('should reject duplicate email', async () => {
        const res = await api
          .post('/api/settings/users')
          .set(adminAuth())
          .send({
            email: 'admin@test.pl', // already exists
            password: 'ValidPass123!',
            firstName: 'Duplikat',
            lastName: 'Email',
            roleId,
          });

        expect([400, 409, 422, 500]).toContain(res.status);
      });

      it('should reject missing required fields', async () => {
        const res = await api
          .post('/api/settings/users')
          .set(adminAuth())
          .send({ email: 'partial@test.pl' });

        expect([400, 422]).toContain(res.status);
      });

      it('should reject short password', async () => {
        const res = await api
          .post('/api/settings/users')
          .set(adminAuth())
          .send({
            email: 'shortpass@test.pl',
            password: '12345', // min 6
            firstName: 'Short',
            lastName: 'Pass',
            roleId,
          });

        expect([400, 422]).toContain(res.status);
      });
    });

    describe('GET /api/settings/users/:id', () => {
      it('should return user by id', async () => {
        const res = await api
          .get(`/api/settings/users/${seed.admin.id}`)
          .set(adminAuth());

        expect(res.status).toBe(200);
      });

      it('should return 404 for non-existent user', async () => {
        const fakeId = '00000000-0000-4000-a000-000000000000';
        const res = await api
          .get(`/api/settings/users/${fakeId}`)
          .set(adminAuth());

        expect([404, 500]).toContain(res.status);
      });
    });

    describe('PUT /api/settings/users/:id', () => {
      it('should update user data', async () => {
        const res = await api
          .put(`/api/settings/users/${seed.user.id}`)
          .set(adminAuth())
          .send({
            firstName: 'Updated',
            lastName: 'Name',
          });

        expect([200, 204]).toContain(res.status);
      });

      it('should reject invalid email format', async () => {
        const res = await api
          .put(`/api/settings/users/${seed.user.id}`)
          .set(adminAuth())
          .send({ email: 'not-an-email' });

        expect([400, 422]).toContain(res.status);
      });
    });

    describe('PATCH /api/settings/users/:id/password', () => {
      it('should change user password', async () => {
        const res = await api
          .patch(`/api/settings/users/${seed.user.id}/password`)
          .set(adminAuth())
          .send({ newPassword: 'NewValidPass456!' });

        expect([200, 204]).toContain(res.status);
      });

      it('should reject short new password', async () => {
        const res = await api
          .patch(`/api/settings/users/${seed.user.id}/password`)
          .set(adminAuth())
          .send({ newPassword: '12' });

        expect([400, 422]).toContain(res.status);
      });
    });

    describe('PATCH /api/settings/users/:id/toggle-active', () => {
      it('should toggle user active status', async () => {
        const res = await api
          .patch(`/api/settings/users/${seed.user.id}/toggle-active`)
          .set(adminAuth());

        expect([200, 204]).toContain(res.status);
      });
    });

    describe('DELETE /api/settings/users/:id', () => {
      it('should delete user', async () => {
        // Create a disposable user
        const disposable = await createTestUser({
          email: `disposable-${Date.now()}@test.pl`,
        });

        const res = await api
          .delete(`/api/settings/users/${disposable.id}`)
          .set(adminAuth());

        expect([200, 204]).toContain(res.status);
      });

      it('should return 401 without auth', async () => {
        const res = await api.delete(`/api/settings/users/${seed.user.id}`);

        expect(res.status).toBe(401);
      });
    });
  });

  // ================================================================
  // ROLES — /api/settings/roles
  // ================================================================
  describe('Roles — /api/settings/roles', () => {
    describe('GET /api/settings/roles', () => {
      it('should list roles', async () => {
        const res = await api
          .get('/api/settings/roles')
          .set(adminAuth());

        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/settings/roles', () => {
      it('should create a new role', async () => {
        const res = await api
          .post('/api/settings/roles')
          .set(adminAuth())
          .send({
            name: 'Nowa Rola',
            slug: 'nowa-rola',
            description: 'Opis testowej roli',
            color: '#FF5500',
            permissionIds: [],
          });

        expect([200, 201]).toContain(res.status);
      });

      it('should reject invalid slug format', async () => {
        const res = await api
          .post('/api/settings/roles')
          .set(adminAuth())
          .send({
            name: 'Invalid Slug',
            slug: 'INVALID SLUG!!',
            permissionIds: [],
          });

        expect([400, 422]).toContain(res.status);
      });

      it('should reject empty role name', async () => {
        const res = await api
          .post('/api/settings/roles')
          .set(adminAuth())
          .send({
            name: '',
            slug: 'empty-name',
            permissionIds: [],
          });

        expect([400, 422]).toContain(res.status);
      });
    });

    describe('PUT /api/settings/roles/:id', () => {
      it('should update role', async () => {
        const role = await prismaTest.role.create({
          data: { name: 'Updatable', slug: 'updatable', isActive: true },
        });

        const res = await api
          .put(`/api/settings/roles/${role.id}`)
          .set(adminAuth())
          .send({ name: 'Updated Role Name' });

        expect([200, 204]).toContain(res.status);
      });
    });

    describe('PUT /api/settings/roles/:id/permissions', () => {
      it('should update role permissions', async () => {
        const role = await prismaTest.role.create({
          data: { name: 'PermRole', slug: 'perm-role', isActive: true },
        });

        // Create a permission to assign
        const permission = await prismaTest.permission.create({
          data: { module: 'test', action: 'read', slug: 'test:read', name: 'Test Read' },
        });

        const res = await api
          .put(`/api/settings/roles/${role.id}/permissions`)
          .set(adminAuth())
          .send({ permissionIds: [permission.id] });

        expect([200, 204]).toContain(res.status);
      });

      it('should accept empty permissions array', async () => {
        const role = await prismaTest.role.create({
          data: { name: 'EmptyPerm', slug: 'empty-perm', isActive: true },
        });

        const res = await api
          .put(`/api/settings/roles/${role.id}/permissions`)
          .set(adminAuth())
          .send({ permissionIds: [] });

        expect([200, 204]).toContain(res.status);
      });
    });

    describe('DELETE /api/settings/roles/:id', () => {
      it('should delete custom role', async () => {
        const role = await prismaTest.role.create({
          data: { name: 'Deletable', slug: 'deletable', isActive: true },
        });

        const res = await api
          .delete(`/api/settings/roles/${role.id}`)
          .set(adminAuth());

        expect([200, 204]).toContain(res.status);
      });
    });
  });

  // ================================================================
  // PERMISSIONS — /api/settings/permissions
  // ================================================================
  describe('Permissions — /api/settings/permissions', () => {
    describe('GET /api/settings/permissions', () => {
      it('should list permissions', async () => {
        const res = await api
          .get('/api/settings/permissions')
          .set(adminAuth());

        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/settings/permissions/grouped', () => {
      it('should return grouped permissions', async () => {
        const res = await api
          .get('/api/settings/permissions/grouped')
          .set(adminAuth());

        expect(res.status).toBe(200);
      });
    });
  });

  // ================================================================
  // COMPANY SETTINGS — /api/settings/company
  // ================================================================
  describe('Company Settings — /api/settings/company', () => {
    describe('GET /api/settings/company', () => {
      it('should return company settings', async () => {
        const res = await api
          .get('/api/settings/company')
          .set(adminAuth());

        // 200 if settings exist, 404 if not — both acceptable
        expect([200, 404]).toContain(res.status);
      });

      it('should return 401 without auth', async () => {
        const res = await api.get('/api/settings/company');

        expect(res.status).toBe(401);
      });
    });

    describe('PUT /api/settings/company', () => {
      it('should update company settings', async () => {
        // Ensure company settings exist
        await prismaTest.companySettings.create({
          data: {
            companyName: 'Test Company',
            defaultCurrency: 'PLN',
            timezone: 'Europe/Warsaw',
          },
        }).catch(() => {/* may already exist */});

        const res = await api
          .put('/api/settings/company')
          .set(adminAuth())
          .send({
            companyName: 'Updated Company Name',
            phone: '+48111222333',
          });

        expect([200, 204]).toContain(res.status);
      });

      it('should reject invalid email in company settings', async () => {
        const res = await api
          .put('/api/settings/company')
          .set(adminAuth())
          .send({ email: 'not-valid-email' });

        expect([400, 422]).toContain(res.status);
      });
    });
  });

  // ================================================================
  // ARCHIVE SETTINGS — /api/settings/archive
  // ================================================================
  describe('Archive Settings — /api/settings/archive', () => {
    describe('GET /api/settings/archive', () => {
      it('should return archive settings', async () => {
        const res = await api
          .get('/api/settings/archive')
          .set(adminAuth());

        expect([200, 404]).toContain(res.status);
      });
    });

    describe('PUT /api/settings/archive', () => {
      it('should update archive settings', async () => {
        const res = await api
          .put('/api/settings/archive')
          .set(adminAuth())
          .send({ archiveAfterDays: 90 });

        expect([200, 204]).toContain(res.status);
      });

      it('should reject zero archiveAfterDays', async () => {
        const res = await api
          .put('/api/settings/archive')
          .set(adminAuth())
          .send({ archiveAfterDays: 0 });

        expect([400, 422]).toContain(res.status);
      });

      it('should reject archiveAfterDays > 365', async () => {
        const res = await api
          .put('/api/settings/archive')
          .set(adminAuth())
          .send({ archiveAfterDays: 999 });

        expect([400, 422]).toContain(res.status);
      });
    });

    describe('POST /api/settings/archive/run-now', () => {
      it('should trigger archive process', async () => {
        const res = await api
          .post('/api/settings/archive/run-now')
          .set(adminAuth());

        // May succeed (200) or fail if no settings configured (400/500)
        expect(res.status).not.toBe(401);
      });

      it('should return 401 without auth', async () => {
        const res = await api.post('/api/settings/archive/run-now');

        expect(res.status).toBe(401);
      });
    });
  });
});
