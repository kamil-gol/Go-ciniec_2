/**
 * DocumentTemplateController — Unit Tests
 *
 * Covers: list, getBySlug, create, update, delete, restore, preview, getHistory
 */

jest.mock('../../../services/document-template.service', () => ({
  __esModule: true,
  default: {
    list: jest.fn(),
    getBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
    preview: jest.fn(),
    getHistory: jest.fn(),
  },
}));

import documentTemplateController from '../../../controllers/document-template.controller';
import documentTemplateService from '../../../services/document-template.service';

const svc = documentTemplateService as any;

// ─── Helpers ─────────────────────────────────────────────
const req = (overrides: any = {}): any => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user-1' },
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────
describe('DocumentTemplateController', () => {
  // ═══════════════════════════════════════════════════════
  // list
  // ═══════════════════════════════════════════════════════
  describe('list()', () => {
    it('should return all templates', async () => {
      const templates = [{ id: 't1', slug: 'invoice' }];
      svc.list.mockResolvedValue(templates);

      const response = res();
      await documentTemplateController.list(req(), response, next);

      expect(svc.list).toHaveBeenCalledWith({ category: undefined });
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: templates,
          count: 1,
        })
      );
    });

    it('should pass category query param', async () => {
      svc.list.mockResolvedValue([]);

      await documentTemplateController.list(
        req({ query: { category: 'RESERVATION_PDF' } }), res(), next
      );

      expect(svc.list).toHaveBeenCalledWith({ category: 'RESERVATION_PDF' });
    });

    it('should call next on error', async () => {
      const error = new Error('DB error');
      svc.list.mockRejectedValue(error);

      await documentTemplateController.list(req(), res(), next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ═══════════════════════════════════════════════════════
  // getBySlug
  // ═══════════════════════════════════════════════════════
  describe('getBySlug()', () => {
    it('should return template by slug', async () => {
      const tpl = { id: 't1', slug: 'invoice', content: '<html>' };
      svc.getBySlug.mockResolvedValue(tpl);

      const response = res();
      await documentTemplateController.getBySlug(
        req({ params: { slug: 'invoice' } }), response, next
      );

      expect(svc.getBySlug).toHaveBeenCalledWith('invoice');
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: tpl })
      );
    });

    it('should call next on error', async () => {
      svc.getBySlug.mockRejectedValue(new Error('not found'));

      await documentTemplateController.getBySlug(
        req({ params: { slug: 'missing' } }), res(), next
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ═══════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════
  describe('create()', () => {
    const validBody = {
      slug: 'new-tpl',
      name: 'New Template',
      category: 'RESERVATION_PDF',
      content: '<html>{{hallName}}</html>',
    };

    it('should throw 401 when no user (via next)', async () => {
      await documentTemplateController.create(
        req({ user: undefined, body: validBody }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should throw 400 when slug missing', async () => {
      await documentTemplateController.create(
        req({ body: { ...validBody, slug: '' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when name missing', async () => {
      await documentTemplateController.create(
        req({ body: { ...validBody, name: '' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when category missing', async () => {
      await documentTemplateController.create(
        req({ body: { ...validBody, category: '' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when content missing', async () => {
      await documentTemplateController.create(
        req({ body: { ...validBody, content: '' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when content is whitespace only', async () => {
      await documentTemplateController.create(
        req({ body: { ...validBody, content: '   ' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should create template and return 201', async () => {
      const created = { id: 't1', ...validBody };
      svc.create.mockResolvedValue(created);

      const response = res();
      await documentTemplateController.create(
        req({ body: validBody }), response, next
      );

      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: created })
      );
      expect(svc.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'new-tpl', name: 'New Template' }),
        'user-1'
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // update
  // ═══════════════════════════════════════════════════════
  describe('update()', () => {
    it('should throw 401 when no user', async () => {
      await documentTemplateController.update(
        req({ user: undefined, params: { slug: 'tpl' }, body: { content: 'x' } }),
        res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should throw 400 when content missing', async () => {
      await documentTemplateController.update(
        req({ params: { slug: 'tpl' }, body: {} }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when content is empty string', async () => {
      await documentTemplateController.update(
        req({ params: { slug: 'tpl' }, body: { content: '  ' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should update template on valid input', async () => {
      const updated = { id: 't1', slug: 'tpl', content: 'new content' };
      svc.update.mockResolvedValue(updated);

      const response = res();
      await documentTemplateController.update(
        req({ params: { slug: 'tpl' }, body: { content: 'new content', changeReason: 'fix typo' } }),
        response, next
      );

      expect(svc.update).toHaveBeenCalledWith(
        'tpl',
        expect.objectContaining({ content: 'new content', changeReason: 'fix typo' }),
        'user-1'
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updated })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // delete
  // ═══════════════════════════════════════════════════════
  describe('delete()', () => {
    it('should throw 401 when no user', async () => {
      await documentTemplateController.delete(
        req({ user: undefined, params: { slug: 'tpl' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should delete template and return result', async () => {
      const result = { deleted: true };
      svc.delete.mockResolvedValue(result);

      const response = res();
      await documentTemplateController.delete(
        req({ params: { slug: 'tpl' } }), response, next
      );

      expect(svc.delete).toHaveBeenCalledWith('tpl', 'user-1');
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: result })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // restore
  // ═══════════════════════════════════════════════════════
  describe('restore()', () => {
    it('should throw 401 when no user', async () => {
      await documentTemplateController.restore(
        req({ user: undefined, params: { slug: 'tpl', version: '2' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should throw 400 when version is not a positive number', async () => {
      await documentTemplateController.restore(
        req({ params: { slug: 'tpl', version: '0' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when version is NaN', async () => {
      await documentTemplateController.restore(
        req({ params: { slug: 'tpl', version: 'abc' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should restore version on valid input', async () => {
      const restored = { id: 't1', slug: 'tpl', version: 2 };
      svc.restore.mockResolvedValue(restored);

      const response = res();
      await documentTemplateController.restore(
        req({ params: { slug: 'tpl', version: '2' } }), response, next
      );

      expect(svc.restore).toHaveBeenCalledWith('tpl', 2, 'user-1');
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: restored })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // preview
  // ═══════════════════════════════════════════════════════
  describe('preview()', () => {
    it('should throw 400 when variables is not an object', async () => {
      await documentTemplateController.preview(
        req({ params: { slug: 'tpl' }, body: { variables: 'string' } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should throw 400 when variables is an array', async () => {
      await documentTemplateController.preview(
        req({ params: { slug: 'tpl' }, body: { variables: [1, 2] } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should preview template with default empty variables', async () => {
      const result = { html: '<p>Hello</p>' };
      svc.preview.mockResolvedValue(result);

      const response = res();
      await documentTemplateController.preview(
        req({ params: { slug: 'tpl' }, body: {} }), response, next
      );

      expect(svc.preview).toHaveBeenCalledWith('tpl', {});
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: result })
      );
    });

    it('should preview template with provided variables', async () => {
      const vars = { hallName: 'Sala Zlota', eventDate: '2026-06-15' };
      const result = { html: '<p>Sala Zlota</p>' };
      svc.preview.mockResolvedValue(result);

      const response = res();
      await documentTemplateController.preview(
        req({ params: { slug: 'tpl' }, body: { variables: vars } }), response, next
      );

      expect(svc.preview).toHaveBeenCalledWith('tpl', vars);
    });
  });

  // ═══════════════════════════════════════════════════════
  // getHistory
  // ═══════════════════════════════════════════════════════
  describe('getHistory()', () => {
    it('should return paginated history with defaults', async () => {
      const historyResult = { data: [], total: 0, page: 1, limit: 20 };
      svc.getHistory.mockResolvedValue(historyResult);

      const response = res();
      await documentTemplateController.getHistory(
        req({ params: { slug: 'tpl' }, query: {} }), response, next
      );

      expect(svc.getHistory).toHaveBeenCalledWith('tpl', 1, 20);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should clamp page to minimum 1', async () => {
      svc.getHistory.mockResolvedValue({ data: [], total: 0 });

      await documentTemplateController.getHistory(
        req({ params: { slug: 'tpl' }, query: { page: '-5' } }), res(), next
      );

      expect(svc.getHistory).toHaveBeenCalledWith('tpl', 1, 20);
    });

    it('should clamp limit to max 100', async () => {
      svc.getHistory.mockResolvedValue({ data: [], total: 0 });

      await documentTemplateController.getHistory(
        req({ params: { slug: 'tpl' }, query: { limit: '500' } }), res(), next
      );

      expect(svc.getHistory).toHaveBeenCalledWith('tpl', 1, 100);
    });

    it('should call next on error', async () => {
      svc.getHistory.mockRejectedValue(new Error('fail'));

      await documentTemplateController.getHistory(
        req({ params: { slug: 'tpl' } }), res(), next
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
