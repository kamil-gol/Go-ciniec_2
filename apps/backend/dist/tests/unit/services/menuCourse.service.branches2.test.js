/**
 * MenuCourseService — Branch Coverage (lines 144-150: getForSelection + reorderDishes)
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        menuCourse: {
            findMany: jest.fn(), findUnique: jest.fn(),
            create: jest.fn(), update: jest.fn(), delete: jest.fn(),
        },
        menuCourseOption: {
            findFirst: jest.fn(), deleteMany: jest.fn(),
            createMany: jest.fn(), updateMany: jest.fn(),
            delete: jest.fn(),
        },
        menuPackage: { findUnique: jest.fn() },
        $transaction: jest.fn((fns) => Promise.all(fns)),
    },
}));
jest.mock('../../../services/dish.service', () => ({
    dishService: {
        getByIds: jest.fn().mockResolvedValue([]),
    },
}));
import { menuCourseService } from '../../../services/menuCourse.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma;
beforeEach(() => jest.resetAllMocks());
describe('MenuCourseService — getForSelection', () => {
    it('should return course with filtered active dishes', async () => {
        mockPrisma.menuCourse.findUnique.mockResolvedValue({
            id: 'c1', name: 'Appetizer', packageId: 'p1',
            minSelect: 1, maxSelect: 2, isRequired: true,
            options: [
                {
                    id: 'co1', dishId: 'd1', isRecommended: true, isDefault: false, displayOrder: 0,
                    dish: { id: 'd1', name: 'Soup', description: 'Hot soup', category: 'SOUP',
                        allergens: [], priceModifier: 0, imageUrl: null, thumbnailUrl: null },
                },
            ],
        });
        const result = await menuCourseService.getForSelection('c1');
        expect(result.options).toHaveLength(1);
        expect(result.options[0].dish.name).toBe('Soup');
    });
    it('should throw when course not found in getForSelection', async () => {
        mockPrisma.menuCourse.findUnique.mockResolvedValue(null);
        await expect(menuCourseService.getForSelection('bad-id'))
            .rejects.toThrow('Course not found');
    });
});
describe('MenuCourseService — reorderDishes', () => {
    it('should reorder dishes and return updated course', async () => {
        // getById is called first (via this.getById)
        mockPrisma.menuCourse.findUnique
            .mockResolvedValueOnce({ id: 'c1', name: 'Main', options: [] }) // getById check
            .mockResolvedValueOnce({ id: 'c1', name: 'Main', options: [] }); // return after reorder
        mockPrisma.menuCourseOption.updateMany.mockResolvedValue({ count: 1 });
        const result = await menuCourseService.reorderDishes('c1', [
            { dishId: 'd1', displayOrder: 2 },
            { dishId: 'd2', displayOrder: 1 },
        ]);
        expect(result).toBeDefined();
        expect(mockPrisma.menuCourseOption.updateMany).toHaveBeenCalledTimes(2);
    });
    it('should throw when course not found for reorder', async () => {
        mockPrisma.menuCourse.findUnique.mockResolvedValue(null);
        await expect(menuCourseService.reorderDishes('bad', []))
            .rejects.toThrow('Course not found');
    });
});
//# sourceMappingURL=menuCourse.service.branches2.test.js.map