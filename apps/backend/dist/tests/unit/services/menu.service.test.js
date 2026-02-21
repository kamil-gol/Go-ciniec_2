/**
 * Unit tests for menu.service.ts
 * Covers: Templates CRUD, Packages CRUD, Options CRUD,
 *         duplicateTemplate, assignOptionsToPackage, reorderPackages, priceHistory
 * Issue: #98
 */
const mockPrisma = {
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
    menuOption: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    menuPackageOption: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
    },
    menuPriceHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    reservationMenuSnapshot: {
        count: jest.fn(),
    },
    $transaction: jest.fn((fns) => Promise.all(fns.map((fn) => (typeof fn === 'function' ? fn() : fn)))),
};
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@utils/audit-logger', () => ({ logChange: jest.fn(), diffObjects: jest.fn().mockReturnValue({ name: { old: 'A', new: 'B' } }) }));
import { menuService } from '@services/menu.service';
import { logChange } from '@utils/audit-logger';
const userId = 'user-1';
const mockEventType = { id: 'evt-1', name: 'Wesele', color: '#ff0000' };
const mockTemplate = {
    id: 'tmpl-1', name: 'Menu Wesele 2026', description: 'Opis', variant: 'standard',
    eventTypeId: 'evt-1', isActive: true, displayOrder: 0, validFrom: new Date('2026-01-01'),
    validTo: null, imageUrl: null, createdAt: new Date(), updatedAt: new Date(),
    eventType: mockEventType, packages: [],
};
const mockPackage = {
    id: 'pkg-1', menuTemplateId: 'tmpl-1', name: 'Pakiet Gold', description: 'Opis',
    shortDescription: 'Gold', pricePerAdult: { toNumber: () => 250 },
    pricePerChild: { toNumber: () => 150 }, pricePerToddler: { toNumber: () => 0 },
    includedItems: ['Zupa', 'Drugie'], minGuests: 50, maxGuests: 200,
    color: '#gold', icon: 'star', badgeText: 'Popularny', imageUrl: null,
    displayOrder: 0, isPopular: true, isRecommended: false,
    menuTemplate: mockTemplate, packageOptions: [], categorySettings: [],
};
const mockOption = {
    id: 'opt-1', name: 'Bar otwarty', description: 'Open bar', shortDescription: 'Bar',
    category: 'DRINKS', priceType: 'PER_PERSON',
    priceAmount: { toNumber: () => 50 }, allowMultiple: false, maxQuantity: 1,
    icon: 'wine', imageUrl: null, displayOrder: 0, isActive: true,
};
describe('MenuService', () => {
    beforeEach(() => jest.clearAllMocks());
    // ═══════════ TEMPLATES ═══════════
    describe('getMenuTemplates', () => {
        it('should return templates with filters', async () => {
            mockPrisma.menuTemplate.findMany.mockResolvedValue([mockTemplate]);
            const result = await menuService.getMenuTemplates({ eventTypeId: 'evt-1', isActive: true });
            expect(result).toHaveLength(1);
            expect(mockPrisma.menuTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ eventTypeId: 'evt-1', isActive: true }) }));
        });
        it('should apply date filter with AND/OR conditions', async () => {
            mockPrisma.menuTemplate.findMany.mockResolvedValue([]);
            const date = new Date('2026-06-15');
            await menuService.getMenuTemplates({ date });
            expect(mockPrisma.menuTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ AND: expect.any(Array) }) }));
        });
    });
    describe('getMenuTemplateById', () => {
        it('should return template with packages and options', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(mockTemplate);
            const result = await menuService.getMenuTemplateById('tmpl-1');
            expect(result.id).toBe('tmpl-1');
        });
        it('should throw when template not found', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(null);
            await expect(menuService.getMenuTemplateById('x')).rejects.toThrow('Menu template not found');
        });
    });
    describe('getActiveMenuForEventType', () => {
        it('should return active template for event type and date', async () => {
            mockPrisma.menuTemplate.findFirst.mockResolvedValue(mockTemplate);
            const result = await menuService.getActiveMenuForEventType('evt-1');
            expect(result.id).toBe('tmpl-1');
        });
        it('should throw when no active menu found', async () => {
            mockPrisma.menuTemplate.findFirst.mockResolvedValue(null);
            await expect(menuService.getActiveMenuForEventType('evt-1')).rejects.toThrow(/No active menu/);
        });
    });
    describe('createMenuTemplate', () => {
        it('should create template and log activity', async () => {
            mockPrisma.menuTemplate.create.mockResolvedValue(mockTemplate);
            const result = await menuService.createMenuTemplate({
                eventTypeId: 'evt-1', name: 'Menu Wesele 2026', validFrom: new Date(),
            }, userId);
            expect(result.id).toBe('tmpl-1');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'MENU_TEMPLATE' }));
        });
    });
    describe('updateMenuTemplate', () => {
        it('should update and log changes', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(mockTemplate);
            mockPrisma.menuTemplate.update.mockResolvedValue({ ...mockTemplate, name: 'Updated' });
            await menuService.updateMenuTemplate('tmpl-1', { name: 'Updated' }, userId);
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityType: 'MENU_TEMPLATE' }));
        });
        it('should throw when template not found', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(null);
            await expect(menuService.updateMenuTemplate('x', { name: 'Y' }, userId))
                .rejects.toThrow('Menu template not found');
        });
    });
    describe('deleteMenuTemplate', () => {
        it('should delete unused template and log', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(mockTemplate);
            mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
            mockPrisma.menuTemplate.delete.mockResolvedValue(undefined);
            await menuService.deleteMenuTemplate('tmpl-1', userId);
            expect(mockPrisma.menuTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tmpl-1' } });
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE', entityType: 'MENU_TEMPLATE' }));
        });
        it('should throw when template is used in reservations', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(mockTemplate);
            mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(3);
            await expect(menuService.deleteMenuTemplate('tmpl-1', userId))
                .rejects.toThrow(/Cannot delete.*3 reservation/);
        });
        it('should throw when template not found', async () => {
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(null);
            await expect(menuService.deleteMenuTemplate('x', userId)).rejects.toThrow('Menu template not found');
        });
    });
    describe('duplicateMenuTemplate', () => {
        it('should duplicate template with packages and options', async () => {
            const originalWithPkgs = {
                ...mockTemplate,
                packages: [{ ...mockPackage, packageOptions: [{ optionId: 'opt-1', customPrice: null, isRequired: false, isDefault: false, displayOrder: 0 }] }],
            };
            mockPrisma.menuTemplate.findUnique.mockResolvedValue(originalWithPkgs);
            mockPrisma.menuTemplate.create.mockResolvedValue({ ...mockTemplate, id: 'tmpl-2', name: 'Kopia' });
            mockPrisma.menuPackage.create.mockResolvedValue({ ...mockPackage, id: 'pkg-2' });
            mockPrisma.menuPackageOption.create = jest.fn().mockResolvedValue({});
            // getMenuTemplateById after duplication
            mockPrisma.menuTemplate.findUnique
                .mockResolvedValueOnce(originalWithPkgs)
                .mockResolvedValueOnce({ ...mockTemplate, id: 'tmpl-2', name: 'Kopia', packages: [] });
            const result = await menuService.duplicateMenuTemplate('tmpl-1', {
                name: 'Kopia', validFrom: new Date(),
            }, userId);
            expect(mockPrisma.menuTemplate.create).toHaveBeenCalled();
            expect(mockPrisma.menuPackage.create).toHaveBeenCalled();
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DUPLICATE', entityType: 'MENU_TEMPLATE' }));
        });
    });
    // ═══════════ PACKAGES ═══════════
    describe('getAllPackages', () => {
        it('should return all packages', async () => {
            mockPrisma.menuPackage.findMany.mockResolvedValue([mockPackage]);
            const result = await menuService.getAllPackages();
            expect(result).toHaveLength(1);
        });
    });
    describe('getPackagesByTemplateId', () => {
        it('should return packages for template', async () => {
            mockPrisma.menuPackage.findMany.mockResolvedValue([mockPackage]);
            const result = await menuService.getPackagesByTemplateId('tmpl-1');
            expect(result).toHaveLength(1);
        });
    });
    describe('getPackagesByEventType', () => {
        it('should return packages for active templates of event type', async () => {
            mockPrisma.menuTemplate.findMany.mockResolvedValue([{ id: 'tmpl-1' }]);
            mockPrisma.menuPackage.findMany.mockResolvedValue([mockPackage]);
            const result = await menuService.getPackagesByEventType('evt-1');
            expect(result).toHaveLength(1);
        });
        it('should return empty when no templates found', async () => {
            mockPrisma.menuTemplate.findMany.mockResolvedValue([]);
            const result = await menuService.getPackagesByEventType('evt-1');
            expect(result).toEqual([]);
        });
    });
    describe('getPackageById', () => {
        it('should return package', async () => {
            mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPackage);
            const result = await menuService.getPackageById('pkg-1');
            expect(result.id).toBe('pkg-1');
        });
        it('should throw when not found', async () => {
            mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
            await expect(menuService.getPackageById('x')).rejects.toThrow('Package not found');
        });
    });
    describe('createPackage', () => {
        it('should create package and log activity', async () => {
            mockPrisma.menuPackage.create.mockResolvedValue(mockPackage);
            const result = await menuService.createPackage({
                menuTemplateId: 'tmpl-1', name: 'Pakiet Gold', pricePerAdult: 250,
                pricePerChild: 150, pricePerToddler: 0,
            }, userId);
            expect(result.id).toBe('pkg-1');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'MENU_PACKAGE' }));
        });
    });
    describe('updatePackage', () => {
        it('should update and track price changes in history', async () => {
            mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPackage);
            mockPrisma.menuPackage.update.mockResolvedValue({ ...mockPackage, pricePerAdult: { toNumber: () => 300 } });
            mockPrisma.menuPriceHistory.create.mockResolvedValue({});
            await menuService.updatePackage('pkg-1', { pricePerAdult: 300 }, userId);
            expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ fieldName: 'pricePerAdult', oldValue: 250, newValue: 300 })
            }));
        });
        it('should throw when package not found', async () => {
            mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
            await expect(menuService.updatePackage('x', { name: 'Y' }, userId))
                .rejects.toThrow('Package not found');
        });
    });
    describe('deletePackage', () => {
        it('should delete unused package', async () => {
            mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPackage);
            mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
            mockPrisma.menuPackage.delete.mockResolvedValue(undefined);
            await menuService.deletePackage('pkg-1', userId);
            expect(mockPrisma.menuPackage.delete).toHaveBeenCalled();
        });
        it('should throw when package is in use', async () => {
            mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPackage);
            mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(5);
            await expect(menuService.deletePackage('pkg-1', userId)).rejects.toThrow(/Cannot delete.*5 reservation/);
        });
    });
    describe('reorderPackages', () => {
        it('should reorder packages via $transaction', async () => {
            mockPrisma.menuPackage.update.mockResolvedValue({});
            const result = await menuService.reorderPackages([
                { packageId: 'pkg-1', displayOrder: 0 },
                { packageId: 'pkg-2', displayOrder: 1 },
            ]);
            expect(result.success).toBe(true);
            expect(result.updated).toBe(2);
        });
    });
    // ═══════════ OPTIONS ═══════════
    describe('getOptions', () => {
        it('should return filtered options', async () => {
            mockPrisma.menuOption.findMany.mockResolvedValue([mockOption]);
            const result = await menuService.getOptions({ category: 'DRINKS', isActive: true });
            expect(result).toHaveLength(1);
        });
        it('should apply search filter', async () => {
            mockPrisma.menuOption.findMany.mockResolvedValue([]);
            await menuService.getOptions({ search: 'bar' });
            expect(mockPrisma.menuOption.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }));
        });
    });
    describe('getOptionById', () => {
        it('should return option', async () => {
            mockPrisma.menuOption.findUnique.mockResolvedValue(mockOption);
            const result = await menuService.getOptionById('opt-1');
            expect(result.id).toBe('opt-1');
        });
        it('should throw when not found', async () => {
            mockPrisma.menuOption.findUnique.mockResolvedValue(null);
            await expect(menuService.getOptionById('x')).rejects.toThrow('Option not found');
        });
    });
    describe('createOption', () => {
        it('should create option and log', async () => {
            mockPrisma.menuOption.create.mockResolvedValue(mockOption);
            await menuService.createOption({
                name: 'Bar otwarty', category: 'DRINKS', priceType: 'PER_PERSON', priceAmount: 50,
            }, userId);
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'MENU_OPTION' }));
        });
    });
    describe('updateOption', () => {
        it('should update and track price change', async () => {
            mockPrisma.menuOption.findUnique.mockResolvedValue(mockOption);
            mockPrisma.menuOption.update.mockResolvedValue({ ...mockOption, priceAmount: { toNumber: () => 75 } });
            await menuService.updateOption('opt-1', { priceAmount: 75 }, userId);
            expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ fieldName: 'priceAmount', oldValue: 50, newValue: 75 })
            }));
        });
        it('should throw when option not found', async () => {
            mockPrisma.menuOption.findUnique.mockResolvedValue(null);
            await expect(menuService.updateOption('x', { name: 'Y' }, userId)).rejects.toThrow('Option not found');
        });
    });
    describe('deleteOption', () => {
        it('should delete unused option and cleanup packageOptions', async () => {
            mockPrisma.menuOption.findUnique.mockResolvedValue(mockOption);
            mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
            mockPrisma.menuPackageOption.deleteMany.mockResolvedValue({});
            mockPrisma.menuOption.delete.mockResolvedValue(undefined);
            await menuService.deleteOption('opt-1', userId);
            expect(mockPrisma.menuPackageOption.deleteMany).toHaveBeenCalledWith({ where: { optionId: 'opt-1' } });
            expect(mockPrisma.menuOption.delete).toHaveBeenCalled();
        });
        it('should throw when option is in use', async () => {
            mockPrisma.menuOption.findUnique.mockResolvedValue(mockOption);
            mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(2);
            await expect(menuService.deleteOption('opt-1', userId)).rejects.toThrow(/Cannot delete.*2 reservation/);
        });
    });
    // ═══════════ PACKAGE-OPTION RELATIONSHIPS ═══════════
    describe('assignOptionsToPackage', () => {
        it('should replace all options for package', async () => {
            mockPrisma.menuPackageOption.deleteMany.mockResolvedValue({});
            mockPrisma.menuPackageOption.createMany.mockResolvedValue({ count: 2 });
            mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPackage);
            await menuService.assignOptionsToPackage('pkg-1', {
                options: [
                    { optionId: 'opt-1', isRequired: true },
                    { optionId: 'opt-2' },
                ],
            });
            expect(mockPrisma.menuPackageOption.deleteMany).toHaveBeenCalledWith({ where: { packageId: 'pkg-1' } });
            expect(mockPrisma.menuPackageOption.createMany).toHaveBeenCalled();
        });
    });
    describe('getPriceHistory', () => {
        it('should return price history for entity', async () => {
            mockPrisma.menuPriceHistory.findMany.mockResolvedValue([{ id: 'ph-1' }]);
            const result = await menuService.getPriceHistory('PACKAGE', 'pkg-1');
            expect(result).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=menu.service.test.js.map