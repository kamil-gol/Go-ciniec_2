import {
  calculateTotalGuests,
  calculateTotalPrice,
  calculateDuration,
  validateConfirmationDeadline,
  validateCustomEventFields,
  detectReservationChanges,
  formatChangesSummary,
  calculateExtrasTotalPrice,
} from '../../../utils/reservation.utils';

describe('reservation.utils — extra coverage', () => {
  describe('calculateTotalGuests', () => {
    it('should sum all guest types', () => {
      expect(calculateTotalGuests(50, 10, 5)).toBe(65);
    });

    it('should handle zero values', () => {
      expect(calculateTotalGuests(0, 0, 0)).toBe(0);
    });

    it('should handle missing toddlers', () => {
      expect(calculateTotalGuests(50, 10)).toBe(60);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate per-person pricing', () => {
      expect(calculateTotalPrice(50, 10, 200, 100)).toBe(50 * 200 + 10 * 100);
    });

    it('should include toddler pricing', () => {
      expect(calculateTotalPrice(50, 10, 200, 100, 5, 50)).toBe(50 * 200 + 10 * 100 + 5 * 50);
    });

    it('should handle zero guests', () => {
      expect(calculateTotalPrice(0, 0, 200, 100)).toBe(0);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate hours between two times', () => {
      const start = new Date('2027-01-01T14:00:00Z');
      const end = new Date('2027-01-01T20:00:00Z');
      expect(calculateDuration(start, end)).toBe(6);
    });
  });

  describe('validateConfirmationDeadline', () => {
    it('should return true if deadline is before event', () => {
      const deadline = new Date('2027-01-10');
      const eventStart = new Date('2027-01-15T14:00:00Z');
      expect(validateConfirmationDeadline(deadline, eventStart)).toBe(true);
    });

    it('should return false if deadline is same day as event', () => {
      const date = new Date('2027-01-15T14:00:00Z');
      expect(validateConfirmationDeadline(date, date)).toBe(false);
    });
  });

  describe('validateCustomEventFields', () => {
    it('should validate Rocznica requires anniversaryYear', () => {
      const result = validateCustomEventFields('Rocznica', { anniversaryYear: 25 } as any);
      expect(result.valid).toBe(true);
    });

    it('should fail Rocznica without required fields', () => {
      const result = validateCustomEventFields('Rocznica', {} as any);
      expect(result.valid).toBe(false);
    });

    it('should validate Inne requires customEventType', () => {
      const result = validateCustomEventFields('Inne', { customEventType: 'Gala' } as any);
      expect(result.valid).toBe(true);
    });

    it('should pass standard event types without extra fields', () => {
      const result = validateCustomEventFields('Wesele', {} as any);
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateExtrasTotalPrice', () => {
    it('should calculate FLAT extras', () => {
      const extras = [
        { quantity: 2, customPrice: null, serviceItem: { basePrice: 100, priceType: 'FLAT' } },
      ];
      expect(calculateExtrasTotalPrice(extras, 50)).toBe(200);
    });

    it('should calculate PER_PERSON extras', () => {
      const extras = [
        { quantity: 1, customPrice: null, serviceItem: { basePrice: 50, priceType: 'PER_PERSON' } },
      ];
      expect(calculateExtrasTotalPrice(extras, 60)).toBe(3000);
    });

    it('should handle FREE extras', () => {
      const extras = [
        { quantity: 1, customPrice: null, serviceItem: { basePrice: 0, priceType: 'FREE' } },
      ];
      expect(calculateExtrasTotalPrice(extras, 50)).toBe(0);
    });

    it('should use customPrice when provided', () => {
      const extras = [
        { quantity: 1, customPrice: 75, serviceItem: { basePrice: 50, priceType: 'FLAT' } },
      ];
      expect(calculateExtrasTotalPrice(extras, 50)).toBe(75);
    });
  });

  describe('detectReservationChanges', () => {
    it('should detect field changes', () => {
      const old = { adults: 50, children: 10 };
      const updated = { adults: 60, children: 10 };
      const changes = detectReservationChanges(old, updated);
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some(c => c.field === 'adults')).toBe(true);
    });

    it('should return empty for no changes', () => {
      const data = { adults: 50 };
      const changes = detectReservationChanges(data, data as any);
      expect(changes).toHaveLength(0);
    });
  });

  describe('formatChangesSummary', () => {
    it('should format changes as bullet points', () => {
      const changes = [
        { field: 'adults', oldValue: '50', newValue: '60', label: 'Dorośli' },
      ];
      const summary = formatChangesSummary(changes);
      expect(summary).toContain('Dorośli');
      expect(summary).toContain('50');
      expect(summary).toContain('60');
    });
  });
});
