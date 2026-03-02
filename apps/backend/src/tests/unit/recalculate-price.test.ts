import {
  calculateExtraHoursCost,
  STANDARD_HOURS,
  DEFAULT_EXTRA_HOUR_RATE,
} from '@utils/recalculate-price';

/** Helper: create Date offset by `hours` from a base date */
function hoursFromNow(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

const BASE = new Date('2026-06-15T14:00:00Z');

describe('calculateExtraHoursCost', () => {
  // ── Null / missing dates ────────────────────────────
  describe('when dates are missing', () => {
    it('returns 0 when both dates are null', () => {
      expect(calculateExtraHoursCost(null, null)).toBe(0);
    });

    it('returns 0 when startDateTime is null', () => {
      expect(calculateExtraHoursCost(null, BASE)).toBe(0);
    });

    it('returns 0 when endDateTime is null', () => {
      expect(calculateExtraHoursCost(BASE, null)).toBe(0);
    });
  });

  // ── Invalid ranges ─────────────────────────────────
  describe('when range is invalid', () => {
    it('returns 0 when end is before start', () => {
      const end = new Date(BASE.getTime() - 3600_000);
      expect(calculateExtraHoursCost(BASE, end)).toBe(0);
    });

    it('returns 0 when start equals end (0h duration)', () => {
      expect(calculateExtraHoursCost(BASE, BASE)).toBe(0);
    });
  });

  // ── Within standard hours (default 6h) ─────────────
  describe('within standard hours (no extra cost)', () => {
    it('returns 0 for 1h event', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 1))).toBe(0);
    });

    it('returns 0 for 5h event', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 5))).toBe(0);
    });

    it('returns 0 for exactly 6h (boundary)', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 6))).toBe(0);
    });
  });

  // ── Beyond standard hours (default rate 500 PLN) ───
  describe('beyond standard hours with defaults', () => {
    it('charges 1 extra hour for 6h 1min event (ceil)', () => {
      const end = new Date(BASE.getTime() + (6 * 60 + 1) * 60 * 1000);
      expect(calculateExtraHoursCost(BASE, end)).toBe(500);
    });

    it('charges 1 extra hour for 7h event', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 7))).toBe(500);
    });

    it('charges 2 extra hours for 8h event', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 8))).toBe(1000);
    });

    it('charges 4 extra hours for 10h event', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 10))).toBe(2000);
    });

    it('charges 1 extra hour for 7.5h event (ceil rounds up)', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 7.5))).toBe(1000);
    });
  });

  // ── Custom extraHourRate ───────────────────────────
  describe('with custom extraHourRate', () => {
    it('uses custom rate of 300 PLN/h', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 8), 300)).toBe(600);
    });

    it('returns 0 extra cost when rate is 0', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 10), 0)).toBe(0);
    });

    it('uses rate of 1000 PLN/h for premium events', () => {
      expect(calculateExtraHoursCost(BASE, hoursFromNow(BASE, 9), 1000)).toBe(3000);
    });
  });

  // ── Custom standardHours ──────────────────────────
  describe('with custom standardHours', () => {
    it('4h standard: 6h event = 2 extra hours at default rate', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 6), DEFAULT_EXTRA_HOUR_RATE, 4)
      ).toBe(1000);
    });

    it('8h standard: 8h event = 0 extra hours', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 8), DEFAULT_EXTRA_HOUR_RATE, 8)
      ).toBe(0);
    });

    it('8h standard: 10h event = 2 extra hours', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 10), DEFAULT_EXTRA_HOUR_RATE, 8)
      ).toBe(1000);
    });

    it('3h standard: 5h event = 2 extra hours', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 5), DEFAULT_EXTRA_HOUR_RATE, 3)
      ).toBe(1000);
    });
  });

  // ── Custom standardHours + custom rate ─────────────
  describe('with both custom standardHours and extraHourRate', () => {
    it('4h standard, 800 PLN/h: 7h event = 3 extra × 800 = 2400', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 7), 800, 4)
      ).toBe(2400);
    });

    it('10h standard, 200 PLN/h: 12h event = 2 extra × 200 = 400', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 12), 200, 10)
      ).toBe(400);
    });

    it('boundary: exactly at custom standard = 0 cost', () => {
      expect(
        calculateExtraHoursCost(BASE, hoursFromNow(BASE, 4), 999, 4)
      ).toBe(0);
    });
  });

  // ── Defaults match exported constants ──────────────
  describe('exported constants', () => {
    it('STANDARD_HOURS equals 6', () => {
      expect(STANDARD_HOURS).toBe(6);
    });

    it('DEFAULT_EXTRA_HOUR_RATE equals 500', () => {
      expect(DEFAULT_EXTRA_HOUR_RATE).toBe(500);
    });
  });
});
