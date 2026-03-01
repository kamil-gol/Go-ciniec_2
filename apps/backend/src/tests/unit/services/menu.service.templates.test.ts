/**
 * MenuService — Unit Tests: Templates + Packages
 * Część 1/2 testów modułu Menu
 * NOTE: MenuPackageOption removed — mock and related assertions cleaned up
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    menuTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuPackage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuPriceHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    reservationMenuSnapshot: {
      count: jest.fn(),
    },
    $transaction: jest.fn((arr: any[]) => Promise.all(arr)),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ name: { old: 'A', new: 'B' } }),
}));

import { MenuService } from '../../../services/menu.service';
import { prisma } from '../../../lib/prisma';
import { logChange, diffObjects } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const TEST_USER = 'user-001';

const TEMPLATE = {
  id: 'tpl-001',
  name: 'Wesele Standard',
  description: 'Opis',
  eventTypeId: 'et-001',
  variant: '2026',
  isActive: true,
  validFrom: new Date('2026-01-01'),
  validTo: null,
  displayOrder: 0,
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  eventType: { id: 'et-001', name: 'Wesele', color: '#fff' },
  packages: [],
};

const PACKAGE = {
  id: 'pkg-001',
  menuTemplateId: 'tpl-001',
  name: 'Złoty',
  description: 'Pakiet premium',
  shortDescription: 'Premium',
  pricePerAdult: { toNumber: () => 250 },
  pricePerChild: { toNumber: () => 120 },
  pricePerToddler: { toNumber: () => 0 },
  includedItems: [],
  minGuests: 50,
  maxGuests: 200,
  color: '#gold',
  icon: 'star',
  badgeText: 'Popular',
  imageUrl: null,
  displayOrder: 0,
  isPopular: true,
  isRecommended: false,
  menuTemplate: TEMPLATE,
  categorySettings: [],
};

let service: MenuService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new MenuService();

  mockPrisma.menuTemplate.findMany.mockResolvedValue([TEMPLATE]);
  mockPrisma.menuTemplate.findUnique.mockResolvedValue(TEMPLATE);
  mockPrisma.menuTemplate.findFirst.mockResolvedValue(TEMPLATE);
  mockPrisma.menuTemplate.create.mockResolvedValue(TEMPLATE);
  mockPrisma.menuTemplate.update.mockResolvedValue(TEMPLATE);
  mockPrisma.menuTemplate.delete.mockResolvedValue(TEMPLATE);

  mockPrisma.menuPackage.findMany.mockResolvedValue([PACKAGE]);
  mockPrisma.menuPackage.findUnique.mockResolvedValue(PACKAGE);
  mockPrisma.menuPackage.create.mockResolvedValue(PACKAGE);
  mockPrisma.menuPackage.update.mockResolvedValue(PACKAGE);
  mockPrisma.menuPackage.delete.mockResolvedValue(PACKAGE);

  mockPrisma.menuPriceHistory.create.mockResolvedValue({});
  mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
});

describe('MenuService', () => {

  // ═══ TEMPLATES ═══

  describe('getMenuTemplates()', () => {
    it('should return templates with event type and packages', async () => {
      const result = await service.getMenuTemplates();
      expect(result).toHaveLength(1);
      expect(mockPrisma.menuTemplate.findMany).toHaveBeenCalledTimes(1);
    });

    it('should apply filters (eventTypeId, isActive, date)', async () => {
      await service.getMenuTemplates({ eventTypeId: 'et-001', isActive: true, date: new Date('2026-06-15') });
      const call = mockPrisma.menuTemplate.findMany.mock.calls[0][0];
      expect(call.where.eventTypeId).toBe('et-001');
      expect(call.where.isActive).toBe(true);
      expect(call.where.AND).toBeDefined();
    });
  });

  describe('getMenuTemplateById()', () => {
    it('should return template with packages', async () => {
      const result = await service.getMenuTemplateById('tpl-001');
      expect(result.id).toBe('tpl-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.menuTemplate.findUnique.mockResolvedValue(null);
      await expect(service.getMenuTemplateById('nonexistent')).rejects.toThrow('Nie znaleziono szablonu menu');
    });
  });

  describe('getActiveMenuForEventType()', () => {
    it('should return active template for event type', async () => {
      const result = await service.getActiveMenuForEventType('et-001');
      expect(result.id).toBe('tpl-001');
    });

    it('should throw when no active menu found', async () => {
      mockPrisma.menuTemplate.findFirst.mockResolvedValue(null);
      await expect(service.getActiveMenuForEventType('et-999')).rejects.toThrow(/No active menu found/);
    });
  });

  describe('createMenuTemplate()', () => {
    it('should create template and audit', async () => {
      const result = await service.createMenuTemplate({
        eventTypeId: 'et-001', name: 'Nowy', validFrom: new Date(),
      } as any, TEST_USER);

      expect(result.id).toBe('tpl-001');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'MENU_TEMPLATE' }));
    });

    it('should pass all fields to prisma create', async () => {
      await service.createMenuTemplate({
        eventTypeId: 'et-001', name: 'Test', description: 'Desc',
        variant: '2026', validFrom: new Date(), isActive: false, displayOrder: 5,
      } as any, TEST_USER);

      const data = mockPrisma.menuTemplate.create.mock.calls[0][0].data;
      expect(data.isActive).toBe(false);
      expect(data.displayOrder).toBe(5);
    });
  });

  describe('updateMenuTemplate()', () => {
    it('should update and audit when changes detected', async () => {
      const result = await service.updateMenuTemplate('tpl-001', { name: 'Updated' } as any, TEST_USER);
      expect(result).toBeDefined();
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityType: 'MENU_TEMPLATE' }));
    });

    it('should NOT audit when no changes', async () => {
      (diffObjects as jest.Mock).mockReturnValue({});
      await service.updateMenuTemplate('tpl-001', { name: 'Same' } as any, TEST_USER);
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should throw when not found', async () => {
      mockPrisma.menuTemplate.findUnique.mockResolvedValue(null);
      await expect(service.updateMenuTemplate('nonexistent', {} as any, TEST_USER)).rejects.toThrow('Nie znaleziono szablonu menu');
    });
  });

  describe('deleteMenuTemplate()', () => {
    it('should delete and audit', async () => {
      await service.deleteMenuTemplate('tpl-001', TEST_USER);
      expect(mockPrisma.menuTemplate.delete).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE', entityType: 'MENU_TEMPLATE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.menuTemplate.findUnique.mockResolvedValue(null);
      await expect(service.deleteMenuTemplate('nonexistent', TEST_USER)).rejects.toThrow('Nie znaleziono szablonu menu');
    });

    it('should throw when template is used in reservations', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(3);
      await expect(service.deleteMenuTemplate('tpl-001', TEST_USER)).rejects.toThrow(/Cannot delete.*3 reservation/);
    });
  });

  describe('duplicateMenuTemplate()', () => {
    it('should create copy with packages (no packageOptions)', async () => {
      // Original has packages — no packageOptions in new schema
      mockPrisma.menuTemplate.findUnique.mockResolvedValue({
        ...TEMPLATE,
        packages: [PACKAGE],
      });
      mockPrisma.menuPackage.create.mockResolvedValue({ id: 'pkg-new' });

      // After duplication, getMenuTemplateById is called
      mockPrisma.menuTemplate.findUnique
        .mockResolvedValueOnce({ ...TEMPLATE, packages: [PACKAGE] })
        .mockResolvedValueOnce({ ...TEMPLATE, id: 'tpl-new', name: 'Kopia', packages: [] });

      const result = await service.duplicateMenuTemplate('tpl-001', {
        name: 'Kopia', validFrom: new Date(),
      }, TEST_USER);

      expect(mockPrisma.menuTemplate.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.menuPackage.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DUPLICATE' }));
    });
  });

  // ═══ PACKAGES ═══

  describe('getPackageById()', () => {
    it('should return package', async () => {
      const result = await service.getPackageById('pkg-001');
      expect(result.id).toBe('pkg-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(service.getPackageById('nonexistent')).rejects.toThrow('Nie znaleziono pakietu menu');
    });
  });

  describe('createPackage()', () => {
    it('should create package and audit', async () => {
      await service.createPackage({
        menuTemplateId: 'tpl-001', name: 'Nowy Pakiet', pricePerAdult: 200,
      } as any, TEST_USER);

      expect(mockPrisma.menuPackage.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'MENU_PACKAGE' }));
    });
  });

  describe('updatePackage()', () => {
    it('should update and track price changes', async () => {
      await service.updatePackage('pkg-001', {
        pricePerAdult: 300, // changed from 250
      } as any, TEST_USER);

      expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityType: 'MENU_PACKAGE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(service.updatePackage('nonexistent', {} as any, TEST_USER)).rejects.toThrow('Nie znaleziono pakietu menu');
    });
  });

  describe('deletePackage()', () => {
    it('should delete and audit', async () => {
      await service.deletePackage('pkg-001', TEST_USER);
      expect(mockPrisma.menuPackage.delete).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE', entityType: 'MENU_PACKAGE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(service.deletePackage('nonexistent', TEST_USER)).rejects.toThrow('Nie znaleziono pakietu menu');
    });

    it('should throw when package is used in reservations', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(5);
      await expect(service.deletePackage('pkg-001', TEST_USER)).rejects.toThrow(/Cannot delete.*5 reservation/);
    });
  });

  describe('reorderPackages()', () => {
    it('should batch update display orders in transaction', async () => {
      const result = await service.reorderPackages([
        { packageId: 'pkg-001', displayOrder: 2 },
        { packageId: 'pkg-002', displayOrder: 1 },
      ]);

      expect(result.success).toBe(true);
      expect(result.updated).toBe(2);
    });
  });
});
