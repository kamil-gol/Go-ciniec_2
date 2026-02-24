/**
 * Unit tests for discount.service.ts
 * Covers: applyDiscount (PERCENTAGE, FIXED, validation, cancelled, editing existing),
 *         removeDiscount (no discount guard, price restore)
 * Issue: #98
 */

const mockPrisma = {
  user: { findUnique: jest.fn() },
  reservation: { findUnique: jest.fn(), update: jest.fn() },
  reservationHistory: { create: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@utils/audit-logger', () => ({ logChange: jest.fn() }));

import discountService from '@services/discount.service';
import { logChange } from '@utils/audit-logger';

const userId = 'user-1';
const mockUser = { id: userId, email: 'admin@test.pl' };

const mockReservation = {
  id: 'res-1', status: 'CONFIRMED',
  totalPrice: 25000, priceBeforeDiscount: null,
  discountType: null, discountValue: null, discountAmount: null, discountReason: null,
  client: { firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', phone: '+48111222333' },
  hall: { id: 'h-1', name: 'Sala', capacity: 150, isWholeVenue: true },
  eventType: { id: 'evt-1', name: 'Wesele' },
  createdBy: { id: userId, email: 'admin@test.pl' },
};

describe('DiscountService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ═══════════════ applyDiscount ═══════════════
  describe('applyDiscount', () => {
    it('should apply PERCENTAGE discount correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrisma.reservation.update.mockResolvedValue({ ...mockReservation, discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 2500, totalPrice: 22500, priceBeforeDiscount: 25000 });
      mockPrisma.reservationHistory.create.mockResolvedValue({});

      const result = await discountService.applyDiscount('res-1', {
        type: 'PERCENTAGE', value: 10, reason: 'Rabat stały klient',
      }, userId);

      expect(result.discountAmount).toBe(2500);
      expect(result.totalPrice).toBe(22500);
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 2500,
            priceBeforeDiscount: 25000, totalPrice: 22500,
          })
        })
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DISCOUNT_APPLIED', entityType: 'RESERVATION' })
      );
    });

    it('should apply FIXED discount correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrisma.reservation.update.mockResolvedValue({ ...mockReservation, discountType: 'FIXED', discountAmount: 3000, totalPrice: 22000 });
      mockPrisma.reservationHistory.create.mockResolvedValue({});

      await discountService.applyDiscount('res-1', {
        type: 'FIXED', value: 3000, reason: 'Rabat za polecenie',
      }, userId);

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discountAmount: 3000, totalPrice: 22000 })
        })
      );
    });

    it('should use priceBeforeDiscount when editing existing discount', async () => {
      const resWithDiscount = {
        ...mockReservation, priceBeforeDiscount: 25000, totalPrice: 22500,
        discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 2500,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithDiscount);
      mockPrisma.reservation.update.mockResolvedValue({});
      mockPrisma.reservationHistory.create.mockResolvedValue({});

      await discountService.applyDiscount('res-1', {
        type: 'PERCENTAGE', value: 20, reason: 'Zmiana rabatu',
      }, userId);

      // Should base on priceBeforeDiscount (25000), not current totalPrice (22500)
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discountAmount: 5000, totalPrice: 20000 })
        })
      );
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(discountService.applyDiscount('res-1', { type: 'PERCENTAGE', value: 10, reason: 'Test' }, 'x'))
        .rejects.toThrow(/wygasła/);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(discountService.applyDiscount('x', { type: 'PERCENTAGE', value: 10, reason: 'Test' }, userId))
        .rejects.toThrow(/Nie znaleziono rezerwacji/);
    });

    it('should throw for cancelled reservation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue({ ...mockReservation, status: 'CANCELLED' });
      await expect(discountService.applyDiscount('res-1', { type: 'PERCENTAGE', value: 10, reason: 'Test' }, userId))
        .rejects.toThrow(/anulowanej/);
    });

    it('should throw when percentage > 100', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      await expect(discountService.applyDiscount('res-1', { type: 'PERCENTAGE', value: 150, reason: 'Test' }, userId))
        .rejects.toThrow(/100%/);
    });

    it('should throw when fixed discount exceeds price', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      await expect(discountService.applyDiscount('res-1', { type: 'FIXED', value: 30000, reason: 'Test' }, userId))
        .rejects.toThrow(/nie może przekroczyć/);
    });

    it('should throw when value is 0 or negative', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      await expect(discountService.applyDiscount('res-1', { type: 'FIXED', value: 0, reason: 'Test' }, userId))
        .rejects.toThrow(/większa od 0/);
    });

    it('should throw when reason is too short', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      await expect(discountService.applyDiscount('res-1', { type: 'FIXED', value: 100, reason: 'ab' }, userId))
        .rejects.toThrow(/min. 3 znaki/);
    });
  });

  // ═══════════════ removeDiscount ═══════════════
  describe('removeDiscount', () => {
    it('should remove discount and restore original price', async () => {
      const resWithDiscount = {
        ...mockReservation, priceBeforeDiscount: 25000, totalPrice: 22500,
        discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 2500,
        discountReason: 'Rabat',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithDiscount);
      mockPrisma.reservation.update.mockResolvedValue({ ...mockReservation, totalPrice: 25000 });
      mockPrisma.reservationHistory.create.mockResolvedValue({});

      const result = await discountService.removeDiscount('res-1', userId);

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountType: null, discountValue: null, discountAmount: null,
            discountReason: null, priceBeforeDiscount: null, totalPrice: 25000,
          })
        })
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DISCOUNT_REMOVED' })
      );
    });

    it('should throw when reservation has no discount', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      await expect(discountService.removeDiscount('res-1', userId))
        .rejects.toThrow(/nie ma rabatu/);
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(discountService.removeDiscount('res-1', 'x')).rejects.toThrow(/wygasła/);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(discountService.removeDiscount('x', userId)).rejects.toThrow(/Nie znaleziono rezerwacji/);
    });
  });
});
