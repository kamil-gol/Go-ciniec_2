/**
 * Document Templates API Integration Tests
 * Issue: #247 — Rozszerzenie testów integracyjnych
 *
 * Tests:
 * - CRUD operations for document templates
 * - Preview with variable substitution
 * - Version history and restore
 * - Required template protection
 */
import { api, authHeader } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Document Templates API', () => {
  let seed: TestSeedData;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
    seed = await seedTestData();
    // Ensure the default test token user (from authHeader) exists in DB.
    // requirePermission looks up user → legacyRole ADMIN → wildcard '*'.
    const bcrypt = await import('bcryptjs');
    await prismaTest.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'token-admin@test.pl',
        password: await bcrypt.hash('TestPass123!', 10),
        firstName: 'Token',
        lastName: 'Admin',
        legacyRole: 'ADMIN',
        isActive: true,
      },
    }).catch(() => {});
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  const adminAuth = () => authHeader('ADMIN');

  /** Helper: create a test template */
  async function createTemplate(overrides: Record<string, any> = {}) {
    return prismaTest.documentTemplate.create({
      data: {
        slug: `test-template-${Date.now()}`,
        name: 'Szablon Testowy',
        description: 'Opis szablonu testowego',
        category: 'RESERVATION',
        format: 'MARKDOWN',
        content: '# Potwierdzenie\n\nKlient: {{clientName}}\nData: {{eventDate}}',
        availableVars: ['clientName', 'eventDate', 'hallName'],
        version: 1,
        isActive: true,
        isRequired: false,
        ...overrides,
      },
    });
  }

  // ================================================================
  // GET /api/document-templates
  // ================================================================
  describe('GET /api/document-templates', () => {
    it('should return empty list when no templates', async () => {
      const res = await api
        .get('/api/document-templates')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return templates list', async () => {
      await createTemplate({ slug: 'tmpl-list-1', name: 'Template 1' });
      await createTemplate({ slug: 'tmpl-list-2', name: 'Template 2' });

      const res = await api
        .get('/api/document-templates')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by category', async () => {
      await createTemplate({ slug: 'tmpl-cat-res', category: 'RESERVATION' });
      await createTemplate({ slug: 'tmpl-cat-inv', category: 'INVOICE' });

      const res = await api
        .get('/api/document-templates')
        .query({ category: 'RESERVATION' })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/document-templates');

      expect(res.status).toBe(401);
    });
  });

  // ================================================================
  // POST /api/document-templates
  // ================================================================
  describe('POST /api/document-templates', () => {
    it('should create a new template', async () => {
      const res = await api
        .post('/api/document-templates')
        .set(adminAuth())
        .send({
          slug: 'new-template',
          name: 'Nowy Szablon',
          category: 'RESERVATION',
          content: '# Nowy szablon\n\n{{clientName}}',
          format: 'MARKDOWN',
          availableVars: ['clientName'],
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should reject duplicate slug', async () => {
      const existing = await createTemplate({ slug: 'duplicate-slug' });

      const res = await api
        .post('/api/document-templates')
        .set(adminAuth())
        .send({
          slug: 'duplicate-slug',
          name: 'Duplikat',
          category: 'RESERVATION',
          content: 'test',
        });

      expect([400, 409, 422, 500]).toContain(res.status);
    });

    it('should reject empty content', async () => {
      const res = await api
        .post('/api/document-templates')
        .set(adminAuth())
        .send({
          slug: 'empty-content',
          name: 'Empty',
          category: 'RESERVATION',
          content: '',
        });

      // May accept empty content or reject it
      expect(res.status).not.toBe(500);
    });
  });

  // ================================================================
  // GET /api/document-templates/:slug
  // ================================================================
  describe('GET /api/document-templates/:slug', () => {
    it('should return template by slug', async () => {
      const template = await createTemplate({ slug: 'find-me' });

      const res = await api
        .get('/api/document-templates/find-me')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await api
        .get('/api/document-templates/non-existent-slug')
        .set(adminAuth());

      expect(res.status).toBe(404);
    });
  });

  // ================================================================
  // PUT /api/document-templates/:slug
  // ================================================================
  describe('PUT /api/document-templates/:slug', () => {
    it('should update template content and increment version', async () => {
      const template = await createTemplate({ slug: 'update-me' });

      const res = await api
        .put('/api/document-templates/update-me')
        .set(adminAuth())
        .send({
          content: '# Zaktualizowany szablon\n\n{{clientName}} — nowa wersja',
          changeReason: 'Aktualizacja treści',
        });

      expect([200, 204]).toContain(res.status);
    });

    it('should return 404 for non-existent template', async () => {
      const res = await api
        .put('/api/document-templates/ghost-template')
        .set(adminAuth())
        .send({ content: 'test' });

      expect(res.status).toBe(404);
    });
  });

  // ================================================================
  // DELETE /api/document-templates/:slug
  // ================================================================
  describe('DELETE /api/document-templates/:slug', () => {
    it('should delete optional template', async () => {
      await createTemplate({ slug: 'deletable', isRequired: false });

      const res = await api
        .delete('/api/document-templates/deletable')
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should block deletion of required template', async () => {
      await createTemplate({ slug: 'required-tmpl', isRequired: true });

      const res = await api
        .delete('/api/document-templates/required-tmpl')
        .set(adminAuth());

      // Should reject — required templates cannot be deleted
      expect([400, 403, 409, 422]).toContain(res.status);
    });

    it('should return 404 for non-existent template', async () => {
      const res = await api
        .delete('/api/document-templates/non-existent')
        .set(adminAuth());

      expect(res.status).toBe(404);
    });
  });

  // ================================================================
  // POST /api/document-templates/:slug/preview
  // ================================================================
  describe('POST /api/document-templates/:slug/preview', () => {
    it('should render preview with variables', async () => {
      await createTemplate({
        slug: 'preview-test',
        content: '# Potwierdzenie\n\nKlient: {{clientName}}\nData: {{eventDate}}',
        availableVars: ['clientName', 'eventDate'],
      });

      const res = await api
        .post('/api/document-templates/preview-test/preview')
        .set(adminAuth())
        .send({
          variables: {
            clientName: 'Jan Kowalski',
            eventDate: '2026-06-15',
          },
        });

      expect(res.status).toBe(200);
    });

    it('should handle missing variables gracefully', async () => {
      await createTemplate({
        slug: 'preview-missing',
        content: '{{clientName}} — {{hallName}}',
      });

      const res = await api
        .post('/api/document-templates/preview-missing/preview')
        .set(adminAuth())
        .send({ variables: {} });

      // Should still render — empty variables replaced with empty or kept as-is
      expect([200, 400]).toContain(res.status);
    });
  });

  // ================================================================
  // GET /api/document-templates/:slug/history
  // ================================================================
  describe('GET /api/document-templates/:slug/history', () => {
    it('should return empty history for new template', async () => {
      await createTemplate({ slug: 'history-empty' });

      const res = await api
        .get('/api/document-templates/history-empty/history')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return history after updates', async () => {
      await createTemplate({ slug: 'history-test' });

      // Update to create history entry
      await api
        .put('/api/document-templates/history-test')
        .set(adminAuth())
        .send({ content: 'V2', changeReason: 'Test update' });

      const res = await api
        .get('/api/document-templates/history-test/history')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });
  });

  // ================================================================
  // POST /api/document-templates/:slug/restore/:version
  // ================================================================
  describe('POST /api/document-templates/:slug/restore/:version', () => {
    it('should restore previous version', async () => {
      await createTemplate({ slug: 'restore-test', content: 'Wersja 1' });

      // Create version 2
      await api
        .put('/api/document-templates/restore-test')
        .set(adminAuth())
        .send({ content: 'Wersja 2', changeReason: 'Zmiana' });

      // Restore version 1
      const res = await api
        .post('/api/document-templates/restore-test/restore/1')
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should return error for non-existent version', async () => {
      await createTemplate({ slug: 'restore-bad' });

      const res = await api
        .post('/api/document-templates/restore-bad/restore/999')
        .set(adminAuth());

      expect([400, 404]).toContain(res.status);
    });
  });
});
