import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatTime,
  formatCurrency,
  formatDateLong,
  formatDateShort,
  calculateTotalPrice,
  calculateDuration,
  getStatusColor,
  getStatusLabel,
  debounce,
  isPastDate,
  generateId,
} from '../../lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('should merge Tailwind conflicts', () => {
      const result = cn('p-4', 'p-2');
      expect(result).toBe('p-2');
    });
  });

  describe('formatDate', () => {
    it('should format date to dd.MM.yyyy by default', () => {
      const result = formatDate('2027-03-15');
      expect(result).toMatch(/15\.03\.2027/);
    });

    it('should accept Date objects', () => {
      const result = formatDate(new Date('2027-06-01'));
      expect(result).toMatch(/01\.06\.2027/);
    });
  });

  describe('formatTime', () => {
    it('should format time to HH:MM', () => {
      expect(formatTime('14:30:00')).toBe('14:30');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as PLN', () => {
      const result = formatCurrency(1500);
      expect(result).toContain('1');
      expect(result).toContain('500');
    });

    it('should handle null/undefined', () => {
      expect(formatCurrency(null)).toBeDefined();
      expect(formatCurrency(undefined)).toBeDefined();
    });

    it('should handle string input', () => {
      expect(formatCurrency('2500')).toBeDefined();
    });
  });

  describe('formatDateLong', () => {
    it('should format to long Polish date', () => {
      const result = formatDateLong('2027-03-15');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null', () => {
      const result = formatDateLong(null);
      expect(result).toBeDefined();
    });
  });

  describe('formatDateShort', () => {
    it('should format to short date', () => {
      const result = formatDateShort('2027-03-15');
      expect(result).toBeDefined();
    });
  });

  describe('calculateTotalPrice', () => {
    it('should multiply guests by price', () => {
      expect(calculateTotalPrice(50, 200)).toBe(10000);
    });

    it('should handle string price', () => {
      expect(calculateTotalPrice(10, '100')).toBe(1000);
    });

    it('should handle zero', () => {
      expect(calculateTotalPrice(0, 200)).toBe(0);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate hours between times', () => {
      expect(calculateDuration('14:00', '20:00')).toBe(6);
    });
  });

  describe('getStatusColor', () => {
    it('should return color class for known statuses', () => {
      expect(getStatusColor('CONFIRMED')).toBeDefined();
      expect(getStatusColor('PENDING')).toBeDefined();
      expect(getStatusColor('CANCELLED')).toBeDefined();
    });
  });

  describe('getStatusLabel', () => {
    it('should return Polish label for known statuses', () => {
      const label = getStatusLabel('CONFIRMED');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let count = 0;
      const fn = debounce(() => count++, 50);

      fn();
      fn();
      fn();

      expect(count).toBe(0);
      await new Promise((r) => setTimeout(r, 100));
      expect(count).toBe(1);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      expect(isPastDate('2020-01-01')).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isPastDate('2099-01-01')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });
});
