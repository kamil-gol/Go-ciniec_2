/**
 * MenuOptionController — Unit Tests
 */
jest.mock('../../../services/menu.service', () => ({
    menuService: {
        getOptions: jest.fn(),
        getOptionById: jest.fn(),
        createOption: jest.fn(),
        updateOption: jest.fn(),
        deleteOption: jest.fn(),
    },
}));
jest.mock('../../../utils/logger', () => ({
    info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import { menuOptionController } from '../../../controllers/menuOption.controller';
import { menuService } from '../../../services/menu.service';
const svc = menuService;
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {}, user: { id: 1 },
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
describe('MenuOptionController', () => {
    describe('list()', () => {
        it('should return options with count', async () => {
            svc.getOptions.mockResolvedValue([{ id: 'o-1' }]);
            const response = res();
            await menuOptionController.list(req({ query: { category: 'DRINK', isActive: 'true' } }), response, next);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
        });
    });
    describe('getById()', () => {
        it('should return 200', async () => {
            svc.getOptionById.mockResolvedValue({ id: 'o-1', name: 'Cola' });
            const response = res();
            await menuOptionController.getById(req({ params: { id: 'o-1' } }), response, next);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
        it('should return 404', async () => {
            svc.getOptionById.mockRejectedValue(new Error('Option not found'));
            const response = res();
            await menuOptionController.getById(req({ params: { id: 'x' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
    });
    describe('create()', () => {
        it('should forward 401 to next', async () => {
            await menuOptionController.create(req({ user: undefined, body: { name: 'O', category: 'DRINK', priceType: 'FLAT' } }), res(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });
        it('should return 400 when fields missing', async () => {
            const response = res();
            await menuOptionController.create(req({ body: {} }), response, next);
            expect(response.status).toHaveBeenCalledWith(400);
        });
        it('should return 400 on invalid category', async () => {
            const response = res();
            await menuOptionController.create(req({ body: { name: 'O', category: 'INVALID', priceType: 'FLAT' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(400);
        });
        it('should return 201 on success', async () => {
            svc.createOption.mockResolvedValue({ id: 'o-new', name: 'Cola' });
            const response = res();
            await menuOptionController.create(req({ body: { name: 'Cola', category: 'DRINK', priceType: 'PER_PERSON' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(201);
        });
    });
    describe('update()', () => {
        it('should forward 401 to next', async () => {
            await menuOptionController.update(req({ user: undefined, params: { id: 'o-1' }, body: {} }), res(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });
        it('should return 400 on invalid category', async () => {
            const response = res();
            await menuOptionController.update(req({ params: { id: 'o-1' }, body: { category: 'BAD' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(400);
        });
        it('should return 404', async () => {
            svc.updateOption.mockRejectedValue(new Error('Option not found'));
            const response = res();
            await menuOptionController.update(req({ params: { id: 'x' }, body: { name: 'U' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
        it('should return 200 on success', async () => {
            svc.updateOption.mockResolvedValue({ id: 'o-1' });
            const response = res();
            await menuOptionController.update(req({ params: { id: 'o-1' }, body: { name: 'Updated' } }), response, next);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    describe('delete()', () => {
        it('should forward 401 to next', async () => {
            await menuOptionController.delete(req({ user: undefined, params: { id: 'o-1' } }), res(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });
        it('should return 404', async () => {
            svc.deleteOption.mockRejectedValue(new Error('Option not found'));
            const response = res();
            await menuOptionController.delete(req({ params: { id: 'x' } }), response, next);
            expect(response.status).toHaveBeenCalledWith(404);
        });
        it('should return 200', async () => {
            svc.deleteOption.mockResolvedValue(undefined);
            const response = res();
            await menuOptionController.delete(req({ params: { id: 'o-1' } }), response, next);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
//# sourceMappingURL=menuOption.controller.test.js.map