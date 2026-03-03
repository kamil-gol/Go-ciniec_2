/**
 * reservation.utils — Unit Tests
 * Tests: validateTimeRange, calculateEventDuration, formatGuestCount
 */

import { 
  validateTimeRange,
  calculateEventDuration,
  formatGuestCount 
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
      expect(() => validateTimeRange(start, end)).toThrow(/zakończenia|end/i);
    });

    it('should throw when start time is in the past', () => {
      const start = new Date('2020-01-01T10:00:00');
      const end = new Date('2020-01-01T18:00:00');
      expect(() => validateTimeRange(start, end)).toThrow(/przeszłości|past/i);
    });
  });

  describe('calculateEventDuration', () => {
    it('should calculate duration in hours', () => {
      const start = new Date('2024-01-01T10:00:00');
      const end = new Date('2024-01-01T18:00:00');
      const duration = calculateEventDuration(start, end);
      expect(duration).toBe(8);
    });
  });

  describe('formatGuestCount', () => {
    it('should format guest count', () => {
      const formatted = formatGuestCount(50, 10, 5);
      expect(formatted).toMatch(/50.*10.*5/);
    });
  });
});
