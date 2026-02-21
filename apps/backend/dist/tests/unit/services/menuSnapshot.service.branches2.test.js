/**
 * MenuSnapshotService — Branch Coverage
 * Lines 47-53: empty dishIds/categoryIds ternary ([] branches)
 * Line 226: null aggregate averages (?? 0)
 * Line 239: duplicate option counting (if already exists)
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        menuPackage: { findUnique: jest.fn() },
        menuOption: { findMany: jest.fn() },
        menuCourse: { findMany: jest.fn() },
        dish: { findMany: jest.fn() },
        dishCategory: { findMany: jest.fn() },
        reservationMenuSnapshot: {
            create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(),
            count: jest.fn(), aggregate: jest.fn(), findMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));
import { MenuSnapshotService } from '../../../services/menuSnapshot.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma;
let service;
beforeEach(() => {
    jest.resetAllMocks();
    service = new MenuSnapshotService();
});
describe('MenuSnapshotService — createSnapshot empty dish/category arrays (lines 47-53)', () => {
    it('should handle dishSelections with empty dish arrays ([] branch)', async () => {
        const mockPkg = {
            id: 'pkg1', name: 'Gold', description: 'Premium', color: '#FFD700', icon: '🌟',
            menuTemplateId: 'tpl1', includedItems: ['item1'],
            pricePerAdult: { toNumber: () => 150 },
            pricePerChild: { toNumber: () => 80 },
            pricePerToddler: { toNumber: () => 0 },
            menuTemplate: { name: 'Template', variant: 'A', eventType: { name: 'Wesele' } },
        };
        mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
        mockPrisma.menuOption.findMany.mockResolvedValue([]);
        // dishSelections with categories but NO dishes → allDishIds will be empty
        mockPrisma.dish.findMany.mockResolvedValue([]);
        mockPrisma.dishCategory.findMany.mockResolvedValue([
            { id: 'cat1', name: 'Zupy', icon: '🍜' },
        ]);
        mockPrisma.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap1' });
        const result = await service.createSnapshot({
            reservationId: 'r1',
            packageId: 'pkg1',
            selectedOptions: [],
            adultsCount: 10,
            childrenCount: 5,
            toddlersCount: 2,
            dishSelections: [
                { categoryId: 'cat1', dishes: [] }, // empty dishes array
            ],
        });
        expect(result).toBeDefined();
    });
    it('should handle dishSelections with no categories (empty categoryIds)', async () => {
        const mockPkg = {
            id: 'pkg1', name: 'Gold', description: null, color: null, icon: null,
            menuTemplateId: 'tpl1', includedItems: [],
            pricePerAdult: { toNumber: () => 100 },
            pricePerChild: { toNumber: () => 50 },
            pricePerToddler: { toNumber: () => 0 },
            menuTemplate: { name: 'Template', variant: 'B', eventType: { name: 'Komunia' } },
        };
        mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
        mockPrisma.menuOption.findMany.mockResolvedValue([]);
        mockPrisma.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap2' });
        // No dishSelections at all → enrichedDishSelections stays []
        const result = await service.createSnapshot({
            reservationId: 'r2',
            packageId: 'pkg1',
            selectedOptions: [],
            adultsCount: 8,
            childrenCount: 0,
            toddlersCount: 0,
        });
        expect(result).toBeDefined();
    });
});
describe('MenuSnapshotService — getSnapshotStatistics null aggregates (line 226)', () => {
    it('should return 0 for all averages when no snapshots exist', async () => {
        mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
        mockPrisma.reservationMenuSnapshot.aggregate.mockResolvedValue({
            _avg: { totalMenuPrice: null, packagePrice: null, optionsPrice: null },
        });
        const result = await service.getSnapshotStatistics();
        expect(result.totalSnapshots).toBe(0);
        expect(result.averageMenuPrice).toBe(0);
        expect(result.averagePackagePrice).toBe(0);
        expect(result.averageOptionsPrice).toBe(0);
    });
    it('should return actual averages when snapshots exist', async () => {
        mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(5);
        mockPrisma.reservationMenuSnapshot.aggregate.mockResolvedValue({
            _avg: {
                totalMenuPrice: { toNumber: () => 2500 },
                packagePrice: { toNumber: () => 2000 },
                optionsPrice: { toNumber: () => 500 },
            },
        });
        const result = await service.getSnapshotStatistics();
        expect(result.totalSnapshots).toBe(5);
        expect(result.averageMenuPrice).toBe(2500);
        expect(result.averagePackagePrice).toBe(2000);
        expect(result.averageOptionsPrice).toBe(500);
    });
});
describe('MenuSnapshotService — getPopularOptions duplicate counting (line 239)', () => {
    it('should correctly count options appearing in multiple snapshots', async () => {
        mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
            {
                menuData: {
                    selectedOptions: [
                        { optionId: 'o1', name: 'DJ' },
                        { optionId: 'o2', name: 'Fotograf' },
                    ],
                },
            },
            {
                menuData: {
                    selectedOptions: [
                        { optionId: 'o1', name: 'DJ' }, // duplicate → increment
                        { optionId: 'o3', name: 'Dekoracje' },
                    ],
                },
            },
        ]);
        const result = await service.getPopularOptions(10);
        expect(result).toHaveLength(3);
        const dj = result.find((r) => r.optionId === 'o1');
        expect(dj.count).toBe(2); // appeared in both snapshots
    });
});
describe('MenuSnapshotService — getPopularPackages duplicate counting', () => {
    it('should count packages across multiple snapshots', async () => {
        mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
            { menuData: { packageId: 'p1', packageName: 'Gold', selectedOptions: [] } },
            { menuData: { packageId: 'p1', packageName: 'Gold', selectedOptions: [] } },
            { menuData: { packageId: 'p2', packageName: 'Silver', selectedOptions: [] } },
        ]);
        const result = await service.getPopularPackages(10);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Gold');
        expect(result[0].count).toBe(2);
    });
});
describe('MenuSnapshotService — calculatePriceBreakdown FREE option', () => {
    it('should handle FREE priceType options (total = 0)', () => {
        const menuData = {
            pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
            selectedOptions: [
                { name: 'Free drink', priceType: 'FREE', priceAmount: 0, quantity: 1, optionId: 'o1', icon: null },
            ],
        };
        const result = service.calculatePriceBreakdown(menuData, 10, 5, 2);
        const freeOption = result.optionsCost.find(o => o.option === 'Free drink');
        expect(freeOption.total).toBe(0);
        expect(result.optionsSubtotal).toBe(0);
    });
});
//# sourceMappingURL=menuSnapshot.service.branches2.test.js.map