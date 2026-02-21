/**
 * ReservationMenuController — Unit Tests
 * Uses prisma singleton + AppError + Zod.
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        reservation: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));
jest.mock('../../../services/menuSnapshot.service', () => ({
    menuSnapshotService: {
        hasSnapshot: jest.fn(),
        createSnapshot: jest.fn(),
        getSnapshotByReservationId: jest.fn(),
        replaceSnapshot: jest.fn(),
        deleteSnapshot: jest.fn(),
    },
}));
jest.mock('../../../validation/menu.validation', () => ({
    selectMenuSchema: { parse: jest.fn((d) => d) },
}));
import { ReservationMenuController } from '../../../controllers/reservationMenu.controller';
import { prisma } from '../../../lib/prisma';
import { menuSnapshotService } from '../../../services/menuSnapshot.service';
const controller = new ReservationMenuController();
const db = prisma.reservation;
const snapSvc = menuSnapshotService;
const mockPriceBreakdown = {
    packageCost: {
        adults: { priceEach: 200 },
        children: { priceEach: 100 },
        toddlers: { priceEach: 0 },
    },
    totalMenuPrice: 12000,
};
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {},
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('ReservationMenuController', () => {
    describe('selectMenu()', () => {
        it('should throw 404 when reservation not found', async () => {
            db.findUnique.mockResolvedValue(null);
            await expect(controller.selectMenu(req({ params: { id: 'x' }, body: { packageId: 'p-1' } }), res())).rejects.toMatchObject({ statusCode: 404 });
        });
        it('should throw 409 when menu already selected', async () => {
            db.findUnique.mockResolvedValue({ id: 'r-1', adults: 50, children: 10, toddlers: 5 });
            snapSvc.hasSnapshot.mockResolvedValue(true);
            await expect(controller.selectMenu(req({ params: { id: 'r-1' }, body: { packageId: 'p-1' } }), res())).rejects.toMatchObject({ statusCode: 409 });
        });
        it('should return 201 on success', async () => {
            db.findUnique.mockResolvedValue({ id: 'r-1', adults: 50, children: 10, toddlers: 5 });
            snapSvc.hasSnapshot.mockResolvedValue(false);
            snapSvc.createSnapshot.mockResolvedValue({ priceBreakdown: mockPriceBreakdown });
            db.update.mockResolvedValue({});
            const response = res();
            await controller.selectMenu(req({ params: { id: 'r-1' }, body: { packageId: 'p-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(db.update).toHaveBeenCalled();
        });
        it('should default children/toddlers to 0 when null', async () => {
            db.findUnique.mockResolvedValue({ id: 'r-2', adults: 30, children: null, toddlers: null });
            snapSvc.hasSnapshot.mockResolvedValue(false);
            snapSvc.createSnapshot.mockResolvedValue({ priceBreakdown: mockPriceBreakdown });
            db.update.mockResolvedValue({});
            const response = res();
            await controller.selectMenu(req({ params: { id: 'r-2' }, body: { packageId: 'p-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(snapSvc.createSnapshot).toHaveBeenCalledWith(expect.objectContaining({ childrenCount: 0, toddlersCount: 0 }));
        });
    });
    describe('getMenu()', () => {
        it('should return 200', async () => {
            snapSvc.getSnapshotByReservationId.mockResolvedValue({ packageName: 'Gold' });
            const response = res();
            await controller.getMenu(req({ params: { id: 'r-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    describe('updateMenu()', () => {
        it('should throw 404', async () => {
            db.findUnique.mockResolvedValue(null);
            await expect(controller.updateMenu(req({ params: { id: 'x' }, body: { packageId: 'p-1' } }), res())).rejects.toMatchObject({ statusCode: 404 });
        });
        it('should return 200 on success', async () => {
            db.findUnique.mockResolvedValue({ id: 'r-1', adults: 50, children: 10, toddlers: 5 });
            snapSvc.replaceSnapshot.mockResolvedValue({ priceBreakdown: mockPriceBreakdown });
            db.update.mockResolvedValue({});
            const response = res();
            await controller.updateMenu(req({ params: { id: 'r-1' }, body: { packageId: 'p-2' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
        it('should default children/toddlers to 0 when null', async () => {
            db.findUnique.mockResolvedValue({ id: 'r-3', adults: 20, children: null, toddlers: null });
            snapSvc.replaceSnapshot.mockResolvedValue({ priceBreakdown: mockPriceBreakdown });
            db.update.mockResolvedValue({});
            const response = res();
            await controller.updateMenu(req({ params: { id: 'r-3' }, body: { packageId: 'p-2' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(snapSvc.replaceSnapshot).toHaveBeenCalledWith(expect.objectContaining({ childrenCount: 0, toddlersCount: 0 }));
        });
    });
    describe('deleteMenu()', () => {
        it('should throw 404', async () => {
            db.findUnique.mockResolvedValue(null);
            await expect(controller.deleteMenu(req({ params: { id: 'x' } }), res())).rejects.toMatchObject({ statusCode: 404 });
        });
        it('should return 200 and recalculate total', async () => {
            db.findUnique.mockResolvedValue({
                id: 'r-1', adults: 50, children: 10, toddlers: 5,
                pricePerAdult: { toNumber: () => 200 },
                pricePerChild: { toNumber: () => 100 },
                pricePerToddler: { toNumber: () => 0 },
            });
            snapSvc.deleteSnapshot.mockResolvedValue(undefined);
            db.update.mockResolvedValue({});
            const response = res();
            await controller.deleteMenu(req({ params: { id: 'r-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ totalPrice: 11000 }),
            }));
        });
        it('should default children/toddlers to 0 when null and recalculate', async () => {
            db.findUnique.mockResolvedValue({
                id: 'r-4', adults: 40, children: null, toddlers: null,
                pricePerAdult: { toNumber: () => 150 },
                pricePerChild: { toNumber: () => 80 },
                pricePerToddler: { toNumber: () => 0 },
            });
            snapSvc.deleteSnapshot.mockResolvedValue(undefined);
            db.update.mockResolvedValue({});
            const response = res();
            await controller.deleteMenu(req({ params: { id: 'r-4' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
            // total = 40*150 + 0*80 + 0*0 = 6000
            expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ totalPrice: 6000 }),
            }));
        });
    });
});
//# sourceMappingURL=reservationMenu.controller.test.js.map