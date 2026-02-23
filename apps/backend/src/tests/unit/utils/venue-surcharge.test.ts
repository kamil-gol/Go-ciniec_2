import { calculateVenueSurcharge, VenueSurchargeResult } from '../../../utils/venue-surcharge';
import { VENUE_SURCHARGE } from '../../../i18n/pl';

describe('calculateVenueSurcharge', () => {
  // ─── Non-whole-venue (isWholeVenue = false) ───
  describe('when hall is NOT whole venue', () => {
    it('should return null amount and null label', () => {
      const result = calculateVenueSurcharge(false, 25);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should return nulls even with 0 guests', () => {
      const result = calculateVenueSurcharge(false, 0);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should return nulls even with large guest count', () => {
      const result = calculateVenueSurcharge(false, 500);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });
  });

  // ─── Whole venue, under 30 guests ───
  describe('when whole venue with < 30 guests', () => {
    it('should return 3000 PLN for 1 guest', () => {
      const result = calculateVenueSurcharge(true, 1);
      expect(result.amount).toBe(3000);
    });

    it('should return 3000 PLN for 25 guests', () => {
      const result = calculateVenueSurcharge(true, 25);
      expect(result.amount).toBe(3000);
    });

    it('should return 3000 PLN for 29 guests (boundary)', () => {
      const result = calculateVenueSurcharge(true, 29);
      expect(result.amount).toBe(3000);
    });

    it('should use LABEL_UNDER_30 from i18n', () => {
      const result = calculateVenueSurcharge(true, 20);
      expect(result.label).toBe(VENUE_SURCHARGE.LABEL_UNDER_30);
      expect(result.label).toContain('poniżej 30');
    });
  });

  // ─── Whole venue, 30+ guests ───
  describe('when whole venue with >= 30 guests', () => {
    it('should return 2000 PLN for exactly 30 guests (boundary)', () => {
      const result = calculateVenueSurcharge(true, 30);
      expect(result.amount).toBe(2000);
    });

    it('should return 2000 PLN for 31 guests', () => {
      const result = calculateVenueSurcharge(true, 31);
      expect(result.amount).toBe(2000);
    });

    it('should return 2000 PLN for 100 guests', () => {
      const result = calculateVenueSurcharge(true, 100);
      expect(result.amount).toBe(2000);
    });

    it('should use LABEL_30_PLUS from i18n', () => {
      const result = calculateVenueSurcharge(true, 50);
      expect(result.label).toBe(VENUE_SURCHARGE.LABEL_30_PLUS);
      expect(result.label).toContain('30+');
    });
  });

  // ─── Return type structure ───
  describe('return type', () => {
    it('should always return an object with amount and label keys', () => {
      const resultA: VenueSurchargeResult = calculateVenueSurcharge(false, 10);
      expect(resultA).toHaveProperty('amount');
      expect(resultA).toHaveProperty('label');

      const resultB: VenueSurchargeResult = calculateVenueSurcharge(true, 10);
      expect(resultB).toHaveProperty('amount');
      expect(resultB).toHaveProperty('label');
    });
  });

  // ─── i18n constants consistency ───
  describe('i18n constants', () => {
    it('should use threshold from VENUE_SURCHARGE.THRESHOLD_GUESTS', () => {
      expect(VENUE_SURCHARGE.THRESHOLD_GUESTS).toBe(30);

      // Just below threshold → higher surcharge
      const below = calculateVenueSurcharge(true, VENUE_SURCHARGE.THRESHOLD_GUESTS - 1);
      expect(below.amount).toBe(VENUE_SURCHARGE.AMOUNT_UNDER_30);

      // At threshold → lower surcharge
      const atThreshold = calculateVenueSurcharge(true, VENUE_SURCHARGE.THRESHOLD_GUESTS);
      expect(atThreshold.amount).toBe(VENUE_SURCHARGE.AMOUNT_30_PLUS);
    });

    it('AMOUNT_UNDER_30 should be greater than AMOUNT_30_PLUS (incentive for more guests)', () => {
      expect(VENUE_SURCHARGE.AMOUNT_UNDER_30).toBeGreaterThan(VENUE_SURCHARGE.AMOUNT_30_PLUS);
    });
  });
});
