/**
 * DocumentTemplateService — Full Unit Test Suite
 * Covers: list, getBySlug, create, update, delete, restore, preview, getHistory
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    documentTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    documentTemplateHistory: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ content: 'changed' }),
}));

import { DocumentTemplateService } from '../../../services/document-template.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new DocumentTemplateService();

const TEMPLATE = {
  id: 't1',
  slug: 'email-confirmation',
  name: 'Email potwierdzający',
  category: 'EMAIL',
  content: 'Cześć {{name}}, potwierdzamy rezerwację na {{date}}.',
  version: 1,
  isRequired: false,
  displayOrder: 1,
  availableVars: ['name', 'date'],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════
// list()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — list()', () => {
  it('returns all templates when no filter provided', async () => {
    db.documentTemplate.findMany.mockResolvedValue([TEMPLATE]);

    const result = await svc.list();

    expect(db.documentTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
    expect(result).toHaveLength(1);
  });

  it('filters by category when category filter is provided', async () => {
    db.documentTemplate.findMany.mockResolvedValue([TEMPLATE]);

    await svc.list({ category: 'EMAIL' });

    expect(db.documentTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'EMAIL' } })
    );
  });

  it('returns empty array when no templates exist', async () => {
    db.documentTemplate.findMany.mockResolvedValue([]);

    const result = await svc.list();

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════
// getBySlug()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — getBySlug()', () => {
  it('returns template when found by slug', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);

    const result = await svc.getBySlug('email-confirmation');

    expect(result).toEqual(TEMPLATE);
  });

  it('throws AppError when template not found', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);

    await expect(svc.getBySlug('missing-slug')).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════
// create()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — create()', () => {
  it('throws when category is not in VALID_CATEGORIES', async () => {
    await expect(
      svc.create({ slug: 'test', name: 'T', category: 'INVALID_CAT', content: 'X' }, 'u1')
    ).rejects.toThrow('Nieprawidłowa kategoria');
  });

  it('throws when slug contains uppercase or spaces', async () => {
    await expect(
      svc.create({ slug: 'Invalid Slug!', name: 'T', category: 'EMAIL', content: 'X' }, 'u1')
    ).rejects.toThrow('Slug może zawierać');
  });

  it('throws when slug already exists in DB', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);

    await expect(
      svc.create({ slug: 'email-confirmation', name: 'T', category: 'EMAIL', content: 'X' }, 'u1')
    ).rejects.toThrow('już istnieje');
  });

  it('creates template with auto displayOrder (maxOrder + 1)', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);
    db.documentTemplate.aggregate.mockResolvedValue({ _max: { displayOrder: 3 } });
    const created = { ...TEMPLATE, slug: 'new-template', displayOrder: 4 };
    db.documentTemplate.create.mockResolvedValue(created);

    const result = await svc.create(
      { slug: 'new-template', name: 'Nowy', category: 'EMAIL', content: 'Treść' },
      'u1'
    );

    expect(result).toEqual(created);
    expect(db.documentTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayOrder: 4, version: 1, isRequired: false }),
      })
    );
  });

  it('auto displayOrder = 1 when no templates in category (null max)', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);
    db.documentTemplate.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
    db.documentTemplate.create.mockResolvedValue({ ...TEMPLATE, displayOrder: 1 });

    await svc.create(
      { slug: 'first-ever', name: 'Pierwszy', category: 'POLICY', content: 'Treść' },
      'u1'
    );

    expect(db.documentTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayOrder: 1 }),
      })
    );
  });

  it('creates template with optional fields (description, availableVars, isActive)', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);
    db.documentTemplate.aggregate.mockResolvedValue({ _max: { displayOrder: 0 } });
    db.documentTemplate.create.mockResolvedValue(TEMPLATE);

    await svc.create(
      {
        slug: 'full-template',
        name: 'Pełny',
        category: 'RESERVATION_PDF',
        content: 'Treść',
        description: 'Opis szablonu',
        availableVars: ['name', 'date', 'hall'],
        isActive: false,
      },
      'u1'
    );

    expect(db.documentTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Opis szablonu',
          availableVars: ['name', 'date', 'hall'],
          isActive: false,
        }),
      })
    );
  });

  it('accepts all VALID_CATEGORIES without throwing', async () => {
    const validCats = ['RESERVATION_PDF', 'CATERING_PDF', 'EMAIL', 'POLICY', 'GENERAL'];

    for (const cat of validCats) {
      db.documentTemplate.findUnique.mockResolvedValue(null);
      db.documentTemplate.aggregate.mockResolvedValue({ _max: { displayOrder: 0 } });
      db.documentTemplate.create.mockResolvedValue(TEMPLATE);

      // replace _ with - so slugs like "reservation-pdf" pass the slug regex
      const slug = `slug-${cat.toLowerCase().replace(/_/g, '-')}`;

      await expect(
        svc.create({ slug, name: 'X', category: cat, content: 'X' }, 'u1')
      ).resolves.toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════
// update()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — update()', () => {
  it('throws when template not found by slug', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);

    await expect(svc.update('missing', { content: 'New' }, 'u1')).rejects.toThrow();
  });

  it('archives old version to history before updating', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.create.mockResolvedValue({ id: 'h1' });
    db.documentTemplate.update.mockResolvedValue({ ...TEMPLATE, content: 'New', version: 2 });

    await svc.update('email-confirmation', { content: 'New', changeReason: 'Poprawiono tekst' }, 'u1');

    expect(db.documentTemplateHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          templateId: TEMPLATE.id,
          content: TEMPLATE.content,
          version: TEMPLATE.version,
          changeReason: 'Poprawiono tekst',
        }),
      })
    );
  });

  it('increments version counter on each update', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE); // version: 1
    db.documentTemplateHistory.create.mockResolvedValue({ id: 'h1' });
    const updated = { ...TEMPLATE, content: 'New Content', version: 2 };
    db.documentTemplate.update.mockResolvedValue(updated);

    const result = await svc.update('email-confirmation', { content: 'New Content' }, 'u1');

    expect(result.version).toBe(2);
    expect(db.documentTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2 }),
      })
    );
  });

  it('uses default changeReason "Wersja N" when not provided', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE); // version: 1
    db.documentTemplateHistory.create.mockResolvedValue({ id: 'h1' });
    db.documentTemplate.update.mockResolvedValue({ ...TEMPLATE, version: 2 });

    await svc.update('email-confirmation', { content: 'New' }, 'u1');

    expect(db.documentTemplateHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changeReason: 'Wersja 1',
        }),
      })
    );
  });

  it('updates optional fields (name, description, availableVars)', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.create.mockResolvedValue({ id: 'h1' });
    db.documentTemplate.update.mockResolvedValue({ ...TEMPLATE, name: 'Nowa Nazwa', version: 2 });

    await svc.update(
      'email-confirmation',
      {
        content: 'New content',
        name: 'Nowa Nazwa',
        description: 'Nowy opis',
        availableVars: ['a', 'b', 'c'],
      },
      'u1'
    );

    expect(db.documentTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Nowa Nazwa',
          description: 'Nowy opis',
          availableVars: ['a', 'b', 'c'],
        }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════
// delete()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — delete()', () => {
  it('throws when template not found', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);

    await expect(svc.delete('missing', 'u1')).rejects.toThrow();
  });

  it('throws when template has isRequired=true (system template)', async () => {
    db.documentTemplate.findUnique.mockResolvedValue({ ...TEMPLATE, isRequired: true });

    await expect(svc.delete('email-confirmation', 'u1')).rejects.toThrow('wymagany przez system');
  });

  it('deletes history records before deleting template', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.deleteMany.mockResolvedValue({ count: 3 });
    db.documentTemplate.delete.mockResolvedValue(TEMPLATE);

    await svc.delete('email-confirmation', 'u1');

    expect(db.documentTemplateHistory.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { templateId: TEMPLATE.id } })
    );
    expect(db.documentTemplate.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'email-confirmation' } })
    );
  });

  it('returns { deleted: true, slug, name } on success', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.deleteMany.mockResolvedValue({ count: 0 });
    db.documentTemplate.delete.mockResolvedValue(TEMPLATE);

    const result = await svc.delete('email-confirmation', 'u1');

    expect(result).toMatchObject({
      deleted: true,
      slug: TEMPLATE.slug,
      name: TEMPLATE.name,
    });
  });
});

// ═══════════════════════════════════════════════════════
// restore()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — restore()', () => {
  it('throws when template not found', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);

    await expect(svc.restore('missing', 1, 'u1')).rejects.toThrow();
  });

  it('throws when specified version not found in history', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.findFirst.mockResolvedValue(null);

    await expect(svc.restore('email-confirmation', 99, 'u1')).rejects.toThrow();
  });

  it('archives current version before restoring', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    const historyEntry = { id: 'h1', content: 'Old Content v1', version: 1 };
    db.documentTemplateHistory.findFirst.mockResolvedValue(historyEntry);
    db.documentTemplateHistory.create.mockResolvedValue({ id: 'h2' });
    db.documentTemplate.update.mockResolvedValue({ ...TEMPLATE, content: 'Old Content v1', version: 2 });

    await svc.restore('email-confirmation', 1, 'u1');

    expect(db.documentTemplateHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changeReason: 'Przed przywróceniem wersji 1',
          content: TEMPLATE.content,
        }),
      })
    );
  });

  it('sets content from history and bumps version counter', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE); // version: 1
    db.documentTemplateHistory.findFirst.mockResolvedValue({ id: 'h1', content: 'Stara treść', version: 1 });
    db.documentTemplateHistory.create.mockResolvedValue({ id: 'h2' });
    const restored = { ...TEMPLATE, content: 'Stara treść', version: 2 };
    db.documentTemplate.update.mockResolvedValue(restored);

    const result = await svc.restore('email-confirmation', 1, 'u1');

    expect(db.documentTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: 'Stara treść', version: 2 }),
      })
    );
    expect(result.version).toBe(2);
    expect(result.content).toBe('Stara treść');
  });
});

// ═══════════════════════════════════════════════════════
// preview()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — preview()', () => {
  it('throws when template not found', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);

    await expect(svc.preview('missing', {})).rejects.toThrow();
  });

  it('substitutes all provided variables in content', async () => {
    db.documentTemplate.findUnique.mockResolvedValue({
      ...TEMPLATE,
      content: 'Cześć {{name}}, rezerwacja na {{date}} w sali {{hall}}.',
    });

    const result = await svc.preview('email-confirmation', {
      name: 'Jan Kowalski',
      date: '2026-06-15',
      hall: 'Złota',
    });

    expect(result.content).toBe('Cześć Jan Kowalski, rezerwacja na 2026-06-15 w sali Złota.');
    expect(result.unfilledVars).toHaveLength(0);
  });

  it('detects and returns list of unfilled variables', async () => {
    db.documentTemplate.findUnique.mockResolvedValue({
      ...TEMPLATE,
      content: 'Hej {{name}}, data: {{date}}, godzina: {{time}}.',
    });

    const result = await svc.preview('email-confirmation', { name: 'Anna' });

    expect(result.content).toContain('Anna');
    expect(result.unfilledVars).toContain('date');
    expect(result.unfilledVars).toContain('time');
    expect(result.unfilledVars).toHaveLength(2);
  });

  it('deduplicates repeated unfilled variables', async () => {
    db.documentTemplate.findUnique.mockResolvedValue({
      ...TEMPLATE,
      content: '{{name}} i jeszcze raz {{name}} oraz {{date}}',
    });

    const result = await svc.preview('email-confirmation', {});

    expect(result.unfilledVars).toHaveLength(2); // name + date, unique
    expect(result.unfilledVars).toContain('name');
    expect(result.unfilledVars).toContain('date');
  });

  it('returns templateName and templateSlug in result', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);

    const result = await svc.preview('email-confirmation', { name: 'X', date: 'Y' });

    expect(result.templateName).toBe(TEMPLATE.name);
    expect(result.templateSlug).toBe(TEMPLATE.slug);
  });

  it('handles template with no variables — returns empty unfilledVars', async () => {
    db.documentTemplate.findUnique.mockResolvedValue({
      ...TEMPLATE,
      content: 'Stała treść bez żadnych zmiennych.',
    });

    const result = await svc.preview('email-confirmation', {});

    expect(result.content).toBe('Stała treść bez żadnych zmiennych.');
    expect(result.unfilledVars).toHaveLength(0);
  });

  it('replaces multiple occurrences of the same variable', async () => {
    db.documentTemplate.findUnique.mockResolvedValue({
      ...TEMPLATE,
      content: 'Drogi {{name}}, pozdrawia {{name}}.',
    });

    const result = await svc.preview('email-confirmation', { name: 'Marek' });

    expect(result.content).toBe('Drogi Marek, pozdrawia Marek.');
    expect(result.unfilledVars).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════
// getHistory()
// ═══════════════════════════════════════════════════════

describe('DocumentTemplateService — getHistory()', () => {
  it('throws when template not found', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(null);

    await expect(svc.getHistory('missing')).rejects.toThrow();
  });

  it('returns paginated history with correct metadata', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.findMany.mockResolvedValue([
      { id: 'h1', version: 1 },
      { id: 'h2', version: 2 },
    ]);
    db.documentTemplateHistory.count.mockResolvedValue(15);

    const result = await svc.getHistory('email-confirmation', 1, 10);

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(15);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(2); // ceil(15/10)
  });

  it('uses default pagination (page=1, limit=20) when not specified', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.findMany.mockResolvedValue([]);
    db.documentTemplateHistory.count.mockResolvedValue(0);

    const result = await svc.getHistory('email-confirmation');

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(0);
  });

  it('calculates totalPages correctly for exact division', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.findMany.mockResolvedValue([]);
    db.documentTemplateHistory.count.mockResolvedValue(20);

    const result = await svc.getHistory('email-confirmation', 1, 10);

    expect(result.totalPages).toBe(2); // ceil(20/10) = 2
  });

  it('passes correct skip/take to findMany for page 2', async () => {
    db.documentTemplate.findUnique.mockResolvedValue(TEMPLATE);
    db.documentTemplateHistory.findMany.mockResolvedValue([]);
    db.documentTemplateHistory.count.mockResolvedValue(25);

    await svc.getHistory('email-confirmation', 2, 10);

    expect(db.documentTemplateHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });
});
