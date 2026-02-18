/**
 * MenuService — Unit Tests: Options + Relationships
 * Część 2/2 testów modułu Menu
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    menuTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    menuPackage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    menuOption: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuPackageOption: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    menuPriceHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    reservationMenuSnapshot: {
      count: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

import { MenuService } from '../../../services/menu.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const TEST_USER = 'user-001';

const OPTION = {
  id: 'opt-001',
  name: 'Bar Premium',
  description: 'Opis baru',
  shortDescription: 'Premium bar',
  category: 'BAR',
  priceType: 'PER_PERSON',
  priceAmount: { toNumber: () => 50 },
  allowMultiple: false,
  maxQuantity: null,
  icon: 'glass',
  imageUrl: null,
  displayOrder: 0,
  isActive: true,
};

const PACKAGE_WITH_OPTIONS = {
  id: 'pkg-001',
  name: 'Z\u0142oty',
  menuTemplate: { id: 'tpl-001', name: 'Wesele' },
  packageOptions: [{ option: OPTION }],
  categorySettings: [],
};

let service: MenuService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new MenuService();

  mockPrisma.menuOption.findMany.mockResolvedValue([OPTION]);
  mockPrisma.menuOption.findUnique.mockResolvedValue(OPTION);
  mockPrisma.menuOption.create.mockResolvedValue(OPTION);
  mockPrisma.menuOption.update.mockResolvedValue(OPTION);
  mockPrisma.menuOption.delete.mockResolvedValue(OPTION);

  mockPrisma.menuPackage.findMany.mockResolvedValue([PACKAGE_WITH_OPTIONS]);
  mockPrisma.menuPackage.findUnique.mockResolvedValue(PACKAGE_WITH_OPTIONS);

  mockPrisma.menuTemplate.findMany.mockResolvedValue([{ id: 'tpl-001' }]);
  mockPrisma.menuTemplate.findUnique.mockResolvedValue({ id: 'tpl-001' });

  mockPrisma.menuPackageOption.createMany.mockResolvedValue({ count: 2 });
  mockPrisma.menuPackageOption.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.menuPriceHistory.create.mockResolvedValue({});
  mockPrisma.menuPriceHistory.findMany.mockResolvedValue([]);
  mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
});

describe('MenuService', () => {

  // ═══ OPTIONS ═══

  describe('getOptions()', () => {
    it('should return all options', async () => {
      const result = await service.getOptions();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bar Premium');
    });

    it('should apply category and isActive filters', async () => {
      await service.getOptions({ category: 'BAR', isActive: true });
      const call = mockPrisma.menuOption.findMany.mock.calls[0][0];
      expect(call.where.category).toBe('BAR');
      expect(call.where.isActive).toBe(true);
    });

    it('should apply search filter on name and description', async () => {
      await service.getOptions({ search: 'premium' });
      const call = mockPrisma.menuOption.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(2);
      expect(call.where.OR[0].name.contains).toBe('premium');
    });
  });

  describe('getOptionById()', () => {
    it('should return option', async () => {
      const result = await service.getOptionById('opt-001');
      expect(result.id).toBe('opt-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.menuOption.findUnique.mockResolvedValue(null);
      await expect(service.getOptionById('nonexistent')).rejects.toThrow('Option not found');
    });
  });

  describe('createOption()', () => {
    it('should create option and audit', async () => {
      await service.createOption({
        name: 'Nowa', category: 'DECOR', priceAmount: 30, priceType: 'FLAT',
      } as any, TEST_USER);

      expect(mockPrisma.menuOption.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'MENU_OPTION' })
      );
    });

    it('should use defaults for allowMultiple, displayOrder, isActive', async () => {
      await service.createOption({
        name: 'Test', category: 'BAR', priceAmount: 10, priceType: 'PER_PERSON',
      } as any, TEST_USER);

      const data = mockPrisma.menuOption.create.mock.calls[0][0].data;
      expect(data.allowMultiple).toBe(false);
      expect(data.displayOrder).toBe(0);
      expect(data.isActive).toBe(true);
    });
  });

  describe('updateOption()', () => {
    it('should update option and audit', async () => {
      await service.updateOption('opt-001', { name: 'Updated' } as any, TEST_USER);

      expect(mockPrisma.menuOption.update).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entityType: 'MENU_OPTION' })
      );
    });

    it('should create price history when price changes', async () => {
      await service.updateOption('opt-001', {
        priceAmount: 75, // changed from 50
      } as any, TEST_USER);

      expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledTimes(1);
      const historyData = mockPrisma.menuPriceHistory.create.mock.calls[0][0].data;
      expect(historyData.oldValue).toBe(50);
      expect(historyData.newValue).toBe(75);
      expect(historyData.fieldName).toBe('priceAmount');
    });

    it('should throw when not found', async () => {
      mockPrisma.menuOption.findUnique.mockResolvedValue(null);
      await expect(service.updateOption('nonexistent', {} as any, TEST_USER))
        .rejects.toThrow('Option not found');
    });
  });

  describe('deleteOption()', () => {
    it('should delete option, clean up package links, and audit', async () => {
      await service.deleteOption('opt-001', TEST_USER);

      expect(mockPrisma.menuPackageOption.deleteMany).toHaveBeenCalledWith({ where: { optionId: 'opt-001' } });
      expect(mockPrisma.menuOption.delete).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', entityType: 'MENU_OPTION' })
      );
    });

    it('should throw when not found', async () => {
      mockPrisma.menuOption.findUnique.mockResolvedValue(null);
      await expect(service.deleteOption('nonexistent', TEST_USER))
        .rejects.toThrow('Option not found');
    });

    it('should throw when option is used in reservations', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(2);
      await expect(service.deleteOption('opt-001', TEST_USER))
        .rejects.toThrow(/Cannot delete.*2 reservation/);
    });
  });

  // ═══ PACKAGE-OPTION RELATIONSHIPS ═══

  describe('assignOptionsToPackage()', () => {
    it('should replace all options for a package', async () => {
      await service.assignOptionsToPackage('pkg-001', {
        options: [
          { optionId: 'opt-001', isRequired: true, isDefault: false },
          { optionId: 'opt-002', customPrice: 30 },
        ],
      } as any);

      expect(mockPrisma.menuPackageOption.deleteMany).toHaveBeenCalledWith({ where: { packageId: 'pkg-001' } });
      expect(mockPrisma.menuPackageOption.createMany).toHaveBeenCalledTimes(1);
      const createData = mockPrisma.menuPackageOption.createMany.mock.calls[0][0].data;
      expect(createData).toHaveLength(2);
      expect(createData[0].isRequired).toBe(true);
      expect(createData[1].displayOrder).toBe(1); // auto-index
    });

    it('should handle empty options array', async () => {
      await service.assignOptionsToPackage('pkg-001', { options: [] } as any);

      expect(mockPrisma.menuPackageOption.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.menuPackageOption.createMany).toHaveBeenCalledWith({ data: [] });
    });
  });

  // ═══ PRICE HISTORY ═══

  describe('getPriceHistory()', () => {
    it('should return history for entity', async () => {
      mockPrisma.menuPriceHistory.findMany.mockResolvedValue([
        { id: 'ph-1', entityType: 'PACKAGE', entityId: 'pkg-001', oldValue: 200, newValue: 250 },
      ]);

      const result = await service.getPriceHistory('PACKAGE', 'pkg-001');
      expect(result).toHaveLength(1);
      const call = mockPrisma.menuPriceHistory.findMany.mock.calls[0][0];
      expect(call.where.entityType).toBe('PACKAGE');
      expect(call.orderBy.effectiveFrom).toBe('desc');
    });
  });

  // ═══ PACKAGE QUERIES ═══

  describe('getPackagesByTemplateId()', () => {
    it('should return packages for template', async () => {
      const result = await service.getPackagesByTemplateId('tpl-001');
      expect(result).toHaveLength(1);
      const call = mockPrisma.menuPackage.findMany.mock.calls[0][0];
      expect(call.where.menuTemplateId).toBe('tpl-001');
    });
  });

  describe('getPackagesByEventType()', () => {
    it('should return packages for active templates of event type', async () => {
      const result = await service.getPackagesByEventType('et-001');
      expect(result).toHaveLength(1);
      expect(mockPrisma.menuTemplate.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.menuPackage.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty when no active templates', async () => {
      mockPrisma.menuTemplate.findMany.mockResolvedValue([]);
      const result = await service.getPackagesByEventType('et-999');
      expect(result).toEqual([]);
    });
  });

  describe('getAllPackages()', () => {
    it('should return all packages with template and options', async () => {
      const result = await service.getAllPackages();
      expect(result).toHaveLength(1);
    });
  });
});
