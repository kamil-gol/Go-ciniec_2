/**
 * AddonGroupController — Unit Tests
 * Uses try/catch + next + Zod validation.
 */
jest.mock('../../../services/addonGroup.service', () => ({
    addonGroupService: {
        list: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        assignDishes: jest.fn(),
        removeDish: jest.fn(),
    },
}));
import { AddonGroupController } from '../../../controllers/addonGroup.controller';
import { addonGroupService } from '../../../services/addonGroup.service';
const controller = new AddonGroupController();
const svc = addonGroupService;
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
const next = jest.fn();
beforeEach(() => jest.clearAllMocks());
describe('AddonGroupController', () => {
    describe('list()', () => {
        it('should return groups with count', async () => {
            svc.list.mockResolvedValue([{ id: 'g-1' }]);
            const response = res();
            await controller.list(req({ query: { isActive: 'true' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
        });
    });
    describe('getById()', () => {
        it('should return group', async () => {
            svc.getById.mockResolvedValue({ id: 'g-1', name: 'Dodatki' });
            const response = res();
            await controller.getById(req({ params: { id: 'g-1' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(200);
        });
        it('should return 404 when not found', async () => {
            svc.getById.mockRejectedValue(new Error('Addon group not found'));
            const response = res();
            await controller.getById(req({ params: { id: 'x' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
    });
    describe('create()', () => {
        it('should return 400 on Zod validation error', async () => {
            const response = res();
            await controller.create(req({ body: { name: '' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(400);
        });
        it('should return 201 on success', async () => {
            svc.create.mockResolvedValue({ id: 'g-new', name: 'Napoje' });
            const response = res();
            await controller.create(req({ body: { name: 'Napoje', priceType: 'FREE' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(201);
        });
    });
    describe('update()', () => {
        it('should return 404 when not found', async () => {
            svc.update.mockRejectedValue(new Error('Addon group not found'));
            const response = res();
            await controller.update(req({ params: { id: 'x' }, body: { name: 'Updated' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
        it('should return 200 on success', async () => {
            svc.update.mockResolvedValue({ id: 'g-1', name: 'Updated' });
            const response = res();
            await controller.update(req({ params: { id: 'g-1' }, body: { name: 'Updated' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    describe('delete()', () => {
        it('should return 404 when not found', async () => {
            svc.delete.mockRejectedValue(new Error('Addon group not found'));
            const response = res();
            await controller.delete(req({ params: { id: 'x' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
        it('should return 200 on success', async () => {
            svc.delete.mockResolvedValue(undefined);
            const response = res();
            await controller.delete(req({ params: { id: 'g-1' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    describe('assignDishes()', () => {
        it('should return 400 on Zod error (bad dishes)', async () => {
            const response = res();
            await controller.assignDishes(req({ params: { id: 'g-1' }, body: { dishes: 'not-array' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(400);
        });
        it('should return 200 on success', async () => {
            svc.assignDishes.mockResolvedValue([{ dishId: 'd-1' }]);
            const response = res();
            await controller.assignDishes(req({ params: { id: 'g-1' }, body: { dishes: [{ dishId: '550e8400-e29b-41d4-a716-446655440000' }] } }), response, next);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    describe('removeDish()', () => {
        it('should return 404 when dish not in group', async () => {
            svc.removeDish.mockRejectedValue(new Error('Dish not found in addon group'));
            const response = res();
            await controller.removeDish(req({ params: { groupId: 'g-1', dishId: 'd-x' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
        it('should return 200 on success', async () => {
            svc.removeDish.mockResolvedValue(undefined);
            const response = res();
            await controller.removeDish(req({ params: { groupId: 'g-1', dishId: 'd-1' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=addonGroup.controller.test.js.map