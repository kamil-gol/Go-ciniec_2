jest.mock('@prisma/client', () => {
    const _mockFindUnique = jest.fn();
    return {
        PrismaClient: jest.fn(() => ({
            menuPackage: { findUnique: _mockFindUnique },
        })),
        __mockFindUnique: _mockFindUnique,
    };
});
import { getPackageCategories } from '../../../controllers/menu-package-categories.controller';
const { __mockFindUnique: mockFindUnique } = jest.requireMock('@prisma/client');
function mockReq(params = {}) {
    return { params };
}
function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});
describe('menu-package-categories.controller', () => {
    describe('getPackageCategories', () => {
        it('should return 404 when package not found', async () => {
            mockFindUnique.mockResolvedValue(null);
            const req = mockReq({ packageId: 'abc' });
            const res = mockRes();
            await getPackageCategories(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Package not found' });
        });
        it('should return categories with dishes', async () => {
            mockFindUnique.mockResolvedValue({
                id: 'pkg-1',
                name: 'Pakiet A',
                categorySettings: [
                    {
                        id: 's-1',
                        categoryId: 'cat-1',
                        category: {
                            name: 'Zupy',
                            slug: 'ZUPY',
                            icon: null,
                            color: null,
                            dishes: [
                                { id: 'd-1', name: 'Pomidorowa', description: null, allergens: [], displayOrder: 0 },
                            ],
                        },
                        minSelect: '1.0',
                        maxSelect: '3.0',
                        isRequired: true,
                        customLabel: null,
                        displayOrder: 0,
                    },
                ],
            });
            const req = mockReq({ packageId: 'pkg-1' });
            const res = mockRes();
            await getPackageCategories(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    packageId: 'pkg-1',
                    packageName: 'Pakiet A',
                    categories: expect.arrayContaining([
                        expect.objectContaining({
                            categoryName: 'Zupy',
                            minSelect: 1,
                            maxSelect: 3,
                            dishes: expect.arrayContaining([
                                expect.objectContaining({ name: 'Pomidorowa' }),
                            ]),
                        }),
                    ]),
                }),
            }));
        });
        it('should return 500 on error', async () => {
            mockFindUnique.mockRejectedValue(new Error('DB down'));
            const req = mockReq({ packageId: 'x' });
            const res = mockRes();
            await getPackageCategories(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB down' });
        });
        it('should return 500 with fallback message when error has no message', async () => {
            mockFindUnique.mockRejectedValue({});
            const req = mockReq({ packageId: 'x' });
            const res = mockRes();
            await getPackageCategories(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
        it('should handle package with empty categorySettings', async () => {
            mockFindUnique.mockResolvedValue({
                id: 'pkg-2',
                name: 'Pakiet Empty',
                categorySettings: [],
            });
            const req = mockReq({ packageId: 'pkg-2' });
            const res = mockRes();
            await getPackageCategories(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    categories: [],
                }),
            }));
        });
    });
});
//# sourceMappingURL=menu-package-categories.controller.test.js.map