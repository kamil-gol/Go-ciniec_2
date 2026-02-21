/**
 * DiscountService — Branch Coverage
 * applyDiscount: cancelled, invalid type/value/reason, percentage>100, fixed>price,
 * editing existing discount, null client, ternary format strings
 * removeDiscount: no discount, priceBeforeDiscount fallback, null client
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        reservation: { findUnique: jest.fn(), update: jest.fn() },
        reservationHistory: { create: jest.fn() },
    },
}));
jest.mock('../../../utils/audit-logger', () => ({
    logChange: jest.fn().mockResolvedValue(undefined),
}));
import discountService from '../../../services/discount.service';
import { prisma } from '../../../lib/prisma';
const db = prisma;
const makeReservation = (o = {}) => ({
    id: 'r-1', status: 'PENDING', totalPrice: 1000,
    priceBeforeDiscount: null, discountType: null,
    discountValue: null, discountAmount: null, discountReason: null,
    client: { firstName: 'Jan', lastName: 'K', email: 'j@k.pl', phone: '123' },
    hall: { id: 'h-1', name: 'Sala A', capacity: 100, isWholeVenue: true },
    eventType: { id: 'e-1', name: 'Wesele' },
    createdBy: { id: 'u-1', email: 'a@b.pl' },
    ...o,
});
const setupApply = (resOverrides = {}) => {
    db.user.findUnique.mockResolvedValue({ id: 'u-1' });
    db.reservation.findUnique.mockResolvedValue(makeReservation(resOverrides));
    db.reservation.update.mockResolvedValue(makeReservation(resOverrides));
    db.reservationHistory.create.mockResolvedValue({});
};
beforeEach(() => jest.resetAllMocks());
describe('DiscountService — branches', () => {
    // ═══ applyDiscount ═══
    describe('applyDiscount()', () => {
        it('should throw when user not found', async () => {
            db.user.findUnique.mockResolvedValue(null);
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: 'Test rabat' }, 'bad'))
                .rejects.toThrow('użytkownik');
        });
        it('should throw when reservation not found', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(null);
            await expect(discountService.applyDiscount('bad', { type: 'FIXED', value: 100, reason: 'Test rabat' }, 'u-1'))
                .rejects.toThrow('not found');
        });
        it('should throw when reservation is cancelled', async () => {
            setupApply({ status: 'CANCELLED' });
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: 'Test rabat' }, 'u-1'))
                .rejects.toThrow('anulowanej');
        });
        it('should throw when type is invalid', async () => {
            setupApply();
            await expect(discountService.applyDiscount('r-1', { type: 'INVALID', value: 100, reason: 'Test rabat' }, 'u-1'))
                .rejects.toThrow('PERCENTAGE lub FIXED');
        });
        it('should throw when value is 0', async () => {
            setupApply();
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: 0, reason: 'Test rabat' }, 'u-1'))
                .rejects.toThrow('większa od 0');
        });
        it('should throw when value is negative', async () => {
            setupApply();
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: -5, reason: 'Test rabat' }, 'u-1'))
                .rejects.toThrow('większa od 0');
        });
        it('should throw when reason is too short', async () => {
            setupApply();
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: 'AB' }, 'u-1'))
                .rejects.toThrow('3 znaki');
        });
        it('should throw when reason is empty', async () => {
            setupApply();
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: '' }, 'u-1'))
                .rejects.toThrow();
        });
        it('should throw when percentage > 100', async () => {
            setupApply();
            await expect(discountService.applyDiscount('r-1', { type: 'PERCENTAGE', value: 150, reason: 'Za dużo' }, 'u-1'))
                .rejects.toThrow('100%');
        });
        it('should throw when fixed exceeds price', async () => {
            setupApply({ totalPrice: 500 });
            await expect(discountService.applyDiscount('r-1', { type: 'FIXED', value: 600, reason: 'Za dużo' }, 'u-1'))
                .rejects.toThrow('przekroczyć');
        });
        it('should apply PERCENTAGE discount', async () => {
            setupApply({ totalPrice: 1000 });
            await discountService.applyDiscount('r-1', { type: 'PERCENTAGE', value: 10, reason: 'Rabat 10%' }, 'u-1');
            expect(db.reservation.update).toHaveBeenCalled();
        });
        it('should apply FIXED discount', async () => {
            setupApply({ totalPrice: 1000 });
            await discountService.applyDiscount('r-1', { type: 'FIXED', value: 200, reason: 'Stały rabat' }, 'u-1');
            expect(db.reservation.update).toHaveBeenCalled();
        });
        it('should use priceBeforeDiscount when editing existing discount', async () => {
            setupApply({
                totalPrice: 800, priceBeforeDiscount: 1000,
                discountType: 'FIXED', discountValue: 200, discountAmount: 200,
            });
            await discountService.applyDiscount('r-1', { type: 'PERCENTAGE', value: 15, reason: 'Zmiana rabatu' }, 'u-1');
            // Should use priceBeforeDiscount (1000), not totalPrice (800)
            expect(db.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ priceBeforeDiscount: 1000 }),
            }));
        });
        it('should handle null client (N/A)', async () => {
            setupApply({ client: null });
            await discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: 'Bez klienta' }, 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('N/A'),
                }),
            }));
        });
        it('should log "dodany" for new discount', async () => {
            setupApply({ discountType: null });
            await discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: 'Nowy rabat' }, 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('dodany'),
                }),
            }));
        });
        it('should log "zmieniony" for existing discount', async () => {
            setupApply({ discountType: 'FIXED', discountValue: 50, discountAmount: 50 });
            await discountService.applyDiscount('r-1', { type: 'FIXED', value: 100, reason: 'Zmiana' }, 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('zmieniony'),
                    oldDiscount: expect.objectContaining({ type: 'FIXED' }),
                }),
            }));
        });
    });
    // ═══ removeDiscount ═══
    describe('removeDiscount()', () => {
        it('should throw when user not found', async () => {
            db.user.findUnique.mockResolvedValue(null);
            await expect(discountService.removeDiscount('r-1', 'bad'))
                .rejects.toThrow('użytkownik');
        });
        it('should throw when reservation not found', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(null);
            await expect(discountService.removeDiscount('bad', 'u-1'))
                .rejects.toThrow('not found');
        });
        it('should throw when no discount exists', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(makeReservation({ discountType: null }));
            await expect(discountService.removeDiscount('r-1', 'u-1'))
                .rejects.toThrow('nie ma rabatu');
        });
        it('should remove discount and restore price from priceBeforeDiscount', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(makeReservation({
                discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 100,
                discountReason: 'Rabat', priceBeforeDiscount: 1000, totalPrice: 900,
            }));
            db.reservation.update.mockResolvedValue(makeReservation({ totalPrice: 1000 }));
            db.reservationHistory.create.mockResolvedValue({});
            await discountService.removeDiscount('r-1', 'u-1');
            expect(db.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ totalPrice: 1000, discountType: null }),
            }));
        });
        it('should fallback to totalPrice when priceBeforeDiscount is null', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(makeReservation({
                discountType: 'FIXED', discountValue: 50, discountAmount: 50,
                discountReason: 'Test', priceBeforeDiscount: null, totalPrice: 950,
            }));
            db.reservation.update.mockResolvedValue(makeReservation());
            db.reservationHistory.create.mockResolvedValue({});
            await discountService.removeDiscount('r-1', 'u-1');
            expect(db.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ totalPrice: 950 }),
            }));
        });
        it('should handle null client in remove (N/A)', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(makeReservation({
                discountType: 'FIXED', discountValue: 100, discountAmount: 100,
                discountReason: 'X', client: null, priceBeforeDiscount: 1000,
            }));
            db.reservation.update.mockResolvedValue(makeReservation());
            db.reservationHistory.create.mockResolvedValue({});
            await discountService.removeDiscount('r-1', 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('N/A'),
                }),
            }));
        });
        it('should format PERCENTAGE in remove log', async () => {
            db.user.findUnique.mockResolvedValue({ id: 'u-1' });
            db.reservation.findUnique.mockResolvedValue(makeReservation({
                discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 100,
                discountReason: 'X', priceBeforeDiscount: 1000,
            }));
            db.reservation.update.mockResolvedValue(makeReservation());
            db.reservationHistory.create.mockResolvedValue({});
            await discountService.removeDiscount('r-1', 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('%'),
                }),
            }));
        });
    });
});
//# sourceMappingURL=discount.service.branches.test.js.map