/**
 * DiscountController — Unit Tests
 */
jest.mock('../../../services/discount.service', () => ({
    __esModule: true,
    default: {
        applyDiscount: jest.fn(),
        removeDiscount: jest.fn(),
    },
}));
import { DiscountController } from '../../../controllers/discount.controller';
import discountService from '../../../services/discount.service';
const controller = new DiscountController();
const svc = discountService;
const req = (overrides = {}) => ({
    body: {}, params: { id: 'r-1' }, query: {}, user: { id: 1 },
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('DiscountController', () => {
    describe('applyDiscount()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.applyDiscount(req({ user: undefined, body: { type: 'PERCENTAGE', value: 10, reason: 'VIP' } }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 when fields missing', async () => {
            await expect(controller.applyDiscount(req({ body: { type: 'PERCENTAGE' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 200 on valid discount', async () => {
            svc.applyDiscount.mockResolvedValue({ id: 'r-1', discountType: 'PERCENTAGE', discountValue: 10 });
            const response = res();
            await controller.applyDiscount(req({ body: { type: 'PERCENTAGE', value: 10, reason: 'VIP client' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(svc.applyDiscount).toHaveBeenCalledWith('r-1', { type: 'PERCENTAGE', value: 10, reason: 'VIP client' }, 1);
        });
    });
    describe('removeDiscount()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.removeDiscount(req({ user: undefined }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 on success', async () => {
            svc.removeDiscount.mockResolvedValue({ id: 'r-1', discountType: null });
            const response = res();
            await controller.removeDiscount(req(), response);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Discount removed successfully' }));
        });
    });
});
//# sourceMappingURL=discount.controller.test.js.map