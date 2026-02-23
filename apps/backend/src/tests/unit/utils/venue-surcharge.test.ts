/**
 * Unit tests for venue surcharge calculator — #137
 *
 * Business rules:
 *   isWholeVenue === false → null (no surcharge)
 *   isWholeVenue && guests < 30  → 3 000 PLN
 *   isWholeVenue && guests >= 30 → 2 000 PLN
 */

import { calculateVenueSurcharge, VenueSurchargeResult } from '@utils/venue-surcharge';
import { VENUE_SURCHARGE } from '@/i18n/pl';

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

const expectNull = (result: VenueSurchargeResult) => {
  expect(result.amount).toBeNull();
  expect(result.label).toBeNull();
};

const expectSurcharge = (result: VenueSurchargeResult, amount: number, label: string) => {
  expect(result.amount).toBe(amount);
  expect(result.label).toBe(label);
};

// ═══════════════════════════════════════
// Tests
// ═══════════════════════════════════════

describe('calculateVenueSurcharge', () => {

  // ─────────────────────────────────────
  // Sala NIE jest "Cały Obiekt" → brak dopłaty
  // ─────────────────────────────────────
  describe('when hall is NOT whole venue (isWholeVenue = false)', () => {
    it('returns null for any guest count', () => {
      expectNull(calculateVenueSurcharge(false, 1));
      expectNull(calculateVenueSurcharge(false, 25));
      expectNull(calculateVenueSurcharge(false, 30));
      expectNull(calculateVenueSurcharge(false, 100));
    });

    it('returns null for zero guests', () => {
      expectNull(calculateVenueSurcharge(false, 0));
    });
  });

  // ─────────────────────────────────────
  // Whole venue, goście < 30 → 3000 PLN
  // ─────────────────────────────────────
  describe('when whole venue AND guests < 30', () => {
    it('returns 3000 PLN for 1 guest', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 1),
        3000,
        VENUE_SURCHARGE.LABEL_UNDER_30,
      );
    });

    it('returns 3000 PLN for 25 guests', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 25),
        3000,
        VENUE_SURCHARGE.LABEL_UNDER_30,
      );
    });

    it('returns 3000 PLN for 29 guests (boundary - 1)', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 29),
        3000,
        VENUE_SURCHARGE.LABEL_UNDER_30,
      );
    });

    it('returns 3000 PLN for 0 guests (edge case)', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 0),
        3000,
        VENUE_SURCHARGE.LABEL_UNDER_30,
      );
    });
  });

  // ─────────────────────────────────────
  // Whole venue, goście >= 30 → 2000 PLN
  // ─────────────────────────────────────
  describe('when whole venue AND guests >= 30', () => {
    it('returns 2000 PLN for 30 guests (boundary)', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 30),
        2000,
        VENUE_SURCHARGE.LABEL_30_PLUS,
      );
    });

    it('returns 2000 PLN for 31 guests', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 31),
        2000,
        VENUE_SURCHARGE.LABEL_30_PLUS,
      );
    });

    it('returns 2000 PLN for 100 guests', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 100),
        2000,
        VENUE_SURCHARGE.LABEL_30_PLUS,
      );
    });

    it('returns 2000 PLN for very large guest count (500)', () => {
      expectSurcharge(
        calculateVenueSurcharge(true, 500),
        2000,
        VENUE_SURCHARGE.LABEL_30_PLUS,
      );
    });
  });

  // ─────────────────────────────────────
  // Stałe i18n — spójność
  // ─────────────────────────────────────
  describe('i18n constants consistency', () => {
    it('threshold is 30', () => {
      expect(VENUE_SURCHARGE.THRESHOLD_GUESTS).toBe(30);
    });

    it('amounts match business rules', () => {
      expect(VENUE_SURCHARGE.AMOUNT_UNDER_30).toBe(3000);
      expect(VENUE_SURCHARGE.AMOUNT_30_PLUS).toBe(2000);
    });

    it('labels are non-empty Polish strings', () => {
      expect(VENUE_SURCHARGE.LABEL_UNDER_30).toBeTruthy();
      expect(VENUE_SURCHARGE.LABEL_30_PLUS).toBeTruthy();
      expect(VENUE_SURCHARGE.LABEL_UNDER_30).toContain('obiekt');
      expect(VENUE_SURCHARGE.LABEL_30_PLUS).toContain('obiekt');
    });
  });

  // ─────────────────────────────────────
  // Return type contract
  // ─────────────────────────────────────
  describe('return type contract', () => {
    it('always returns an object with amount and label keys', () => {
      const result = calculateVenueSurcharge(true, 10);
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('label');
    });

    it('amount is number when surcharge applies', () => {
      const result = calculateVenueSurcharge(true, 10);
      expect(typeof result.amount).toBe('number');
    });

    it('amount is null when surcharge does not apply', () => {
      const result = calculateVenueSurcharge(false, 10);
      expect(result.amount).toBeNull();
    });
  });
});
