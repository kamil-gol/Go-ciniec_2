import {
  validateTimeRange,
  validateGuestCount,
  calculateTotalGuests,
  validatePricing,
} from '../../../utils/reservation.utils';

describe('reservation.utils', () => {
  describe('validateTimeRange', () => {
    it('should pass for valid time range', () => {
      const start = new Date('2024-01-01T10:00:00');
      const end = new Date('2024-01-01T18:00:00');
      expect(() => validateTimeRange(start, end)).not.toThrow();
    });

    it('should throw when end time is before start time', () => {
      const start = new Date('2024-01-01T18:00:00');
      const end = new Date('2024-01-01T10:00:00');
      expect(() => validateTimeRange(start, end)).toThrow(/zakończenia/);
    });

    it('should throw when start time is in the past', () => {
      const start = new Date('2020-01-01T10:00:00');
      const end = new Date('2024-01-01T18:00:00');
      expect(() => validateTimeRange(start, end)).toThrow(/przyszłości/);
    });

    it('should throw when times are equal', () => {
      const start = new Date('2024-01-01T10:00:00');
      const end = new Date('2024-01-01T10:00:00');
      expect(() => validateTimeRange(start, end)).toThrow(/zakończenia/);
    });
  });

  describe('validateGuestCount', () => {
    it('should pass for valid guest counts', () => {
      expect(() => validateGuestCount(50, 10, 5, 100)).not.toThrow();
    });

    it('should throw when adults is negative', () => {
      expect(() => validateGuestCount(-1, 10, 5, 100)).toThrow(/dorosłych/);
    });

    it('should throw when children is negative', () => {
      expect(() => validateGuestCount(50, -1, 5, 100)).toThrow(/dzieci/);
    });

    it('should throw when toddlers is negative', () => {
      expect(() => validateGuestCount(50, 10, -1, 100)).toThrow(/niemowląt/);
    });

    it('should throw when total exceeds capacity', () => {
      expect(() => validateGuestCount(60, 30, 20, 100)).toThrow(/przekracza/);
    });

    it('should throw when no adults', () => {
      expect(() => validateGuestCount(0, 10, 5, 100)).toThrow(/przynajmniej/);
    });
  });

  describe('calculateTotalGuests', () => {
    it('should calculate total correctly', () => {
      expect(calculateTotalGuests(50, 10, 5)).toBe(65);
    });

    it('should handle zero values', () => {
      expect(calculateTotalGuests(50, 0, 0)).toBe(50);
    });

    it('should handle all zero', () => {
      expect(calculateTotalGuests(0, 0, 0)).toBe(0);
    });
  });

  describe('validatePricing', () => {
    it('should pass for valid pricing', () => {
      expect(() => validatePricing(200, 100, 50)).not.toThrow();
    });

    it('should throw when adult price is negative', () => {
      expect(() => validatePricing(-1, 100, 50)).toThrow(/dorosłego/);
    });

    it('should throw when child price is negative', () => {
      expect(() => validatePricing(200, -1, 50)).toThrow(/dziecko/);
    });

    it('should throw when toddler price is negative', () => {
      expect(() => validatePricing(200, 100, -1)).toThrow(/niemowlę/);
    });

    it('should allow zero prices', () => {
      expect(() => validatePricing(0, 0, 0)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      expect(calculateTotalGuests(1000, 500, 250)).toBe(1750);
    });

    it('should validate capacity with exact match', () => {
      expect(() => validateGuestCount(50, 30, 20, 100)).not.toThrow();
    });

    it('should handle Date objects correctly in time validation', () => {
      const future1 = new Date(Date.now() + 86400000);
      const future2 = new Date(Date.now() + 172800000);
      expect(() => validateTimeRange(future1, future2)).not.toThrow();
    });
  });
});
