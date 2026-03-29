// jest globals (describe, it, expect) are available via jest config
import {
  groupRevenueByDay,
  groupRevenueByPeriod,
  getWeekNumber,
} from '@/services/reports/revenue-grouping';

// ---------------------------------------------------------------------------
// Mock reservation factory
// ---------------------------------------------------------------------------

interface MockReservation {
  date: string | null;
  startDateTime: Date | string | null;
  totalPrice: number;
}

function makeReservation(
  overrides: Partial<MockReservation> & { date: string; totalPrice: number },
): MockReservation {
  return {
    date: overrides.date,
    startDateTime: overrides.startDateTime ?? null,
    totalPrice: overrides.totalPrice,
  };
}

// ---------------------------------------------------------------------------
// groupRevenueByDay
// ---------------------------------------------------------------------------

describe('groupRevenueByDay', () => {
  it('sums totalPrice per day for given reservations', () => {
    const reservations = [
      makeReservation({ date: '2026-03-01', totalPrice: 1000 }),
      makeReservation({ date: '2026-03-01', totalPrice: 2500 }),
      makeReservation({ date: '2026-03-02', totalPrice: 800 }),
    ];

    const result = groupRevenueByDay(reservations);

    const day1 = result.find(r => r.period === '2026-03-01');
    const day2 = result.find(r => r.period === '2026-03-02');

    expect(day1).toBeDefined();
    expect(day1!.revenue).toBe(3500);
    expect(day1!.count).toBe(2);

    expect(day2).toBeDefined();
    expect(day2!.revenue).toBe(800);
    expect(day2!.count).toBe(1);
  });

  it('computes avgRevenue = revenue / count rounded to 2 decimals', () => {
    const reservations = [
      makeReservation({ date: '2026-06-10', totalPrice: 100 }),
      makeReservation({ date: '2026-06-10', totalPrice: 200 }),
      makeReservation({ date: '2026-06-10', totalPrice: 300 }),
    ];

    const result = groupRevenueByDay(reservations);
    const day = result.find(r => r.period === '2026-06-10');

    expect(day).toBeDefined();
    expect(day!.revenue).toBe(600);
    expect(day!.count).toBe(3);
    expect(day!.avgRevenue).toBe(200);
  });

  it('rounds avgRevenue to 2 decimal places for non-trivial division', () => {
    const reservations = [
      makeReservation({ date: '2026-01-15', totalPrice: 100 }),
      makeReservation({ date: '2026-01-15', totalPrice: 200 }),
      makeReservation({ date: '2026-01-15', totalPrice: 50 }),
    ];

    const result = groupRevenueByDay(reservations);
    const day = result.find(r => r.period === '2026-01-15');

    // 350 / 3 = 116.666... -> rounded to 116.67
    expect(day!.avgRevenue).toBe(116.67);
  });

  it('handles a single reservation per day', () => {
    const reservations = [
      makeReservation({ date: '2026-05-20', totalPrice: 4500.5 }),
    ];

    const result = groupRevenueByDay(reservations);

    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2026-05-20');
    expect(result[0].revenue).toBe(4500.5);
    expect(result[0].count).toBe(1);
    expect(result[0].avgRevenue).toBe(4500.5);
  });

  it('handles multiple reservations on the same day', () => {
    const reservations = [
      makeReservation({ date: '2026-12-25', totalPrice: 1000 }),
      makeReservation({ date: '2026-12-25', totalPrice: 2000 }),
      makeReservation({ date: '2026-12-25', totalPrice: 3000 }),
      makeReservation({ date: '2026-12-25', totalPrice: 4000 }),
    ];

    const result = groupRevenueByDay(reservations);

    expect(result).toHaveLength(1);
    expect(result[0].revenue).toBe(10000);
    expect(result[0].count).toBe(4);
    expect(result[0].avgRevenue).toBe(2500);
  });

  it('returns empty array for empty input', () => {
    const result = groupRevenueByDay([]);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// groupRevenueByPeriod
// ---------------------------------------------------------------------------

describe('groupRevenueByPeriod', () => {
  describe('week grouping', () => {
    it('produces correct YYYY-W## format', () => {
      const reservations = [
        makeReservation({ date: '2026-01-05', totalPrice: 500 }), // week 2
        makeReservation({ date: '2026-01-06', totalPrice: 300 }), // week 2
        makeReservation({ date: '2026-01-12', totalPrice: 700 }), // week 3
      ];

      const result = groupRevenueByPeriod(reservations, 'week');

      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach(item => {
        expect(item.period).toMatch(/^\d{4}-W\d{2}$/);
      });
    });

    it('groups reservations from the same week together', () => {
      // 2026-03-02 (Mon) and 2026-03-06 (Fri) are both in ISO week 10
      const reservations = [
        makeReservation({ date: '2026-03-02', totalPrice: 400 }),
        makeReservation({ date: '2026-03-06', totalPrice: 600 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'week');

      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(1000);
      expect(result[0].count).toBe(2);
    });
  });

  describe('month grouping', () => {
    it('produces correct YYYY-MM format', () => {
      const reservations = [
        makeReservation({ date: '2026-03-15', totalPrice: 1000 }),
        makeReservation({ date: '2026-04-10', totalPrice: 2000 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'month');

      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2026-03');
      expect(result[1].period).toBe('2026-04');
    });

    it('zero-pads single-digit months', () => {
      const reservations = [
        makeReservation({ date: '2026-01-15', totalPrice: 500 }),
        makeReservation({ date: '2026-09-20', totalPrice: 800 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'month');

      const periods = result.map(r => r.period);
      expect(periods).toContain('2026-01');
      expect(periods).toContain('2026-09');
    });

    it('sums revenue within the same month', () => {
      const reservations = [
        makeReservation({ date: '2026-07-01', totalPrice: 100 }),
        makeReservation({ date: '2026-07-15', totalPrice: 200 }),
        makeReservation({ date: '2026-07-31', totalPrice: 300 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'month');

      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2026-07');
      expect(result[0].revenue).toBe(600);
      expect(result[0].count).toBe(3);
    });
  });

  describe('year grouping', () => {
    it('produces correct YYYY format', () => {
      const reservations = [
        makeReservation({ date: '2025-06-15', totalPrice: 1000 }),
        makeReservation({ date: '2026-03-10', totalPrice: 2000 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'year');

      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2025');
      expect(result[1].period).toBe('2026');
    });

    it('sums revenue within the same year', () => {
      const reservations = [
        makeReservation({ date: '2026-01-01', totalPrice: 500 }),
        makeReservation({ date: '2026-06-15', totalPrice: 700 }),
        makeReservation({ date: '2026-12-31', totalPrice: 800 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'year');

      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2026');
      expect(result[0].revenue).toBe(2000);
      expect(result[0].count).toBe(3);
    });
  });

  describe('day grouping (pass-through)', () => {
    it('behaves like groupRevenueByDay for day period', () => {
      const reservations = [
        makeReservation({ date: '2026-02-14', totalPrice: 500 }),
        makeReservation({ date: '2026-02-14', totalPrice: 300 }),
      ];

      const result = groupRevenueByPeriod(reservations, 'day');

      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2026-02-14');
      expect(result[0].revenue).toBe(800);
      expect(result[0].count).toBe(2);
    });
  });

  it('returns empty array for empty input', () => {
    const result = groupRevenueByPeriod([], 'month');
    expect(result).toEqual([]);
  });

  it('sorts results by period ascending', () => {
    const reservations = [
      makeReservation({ date: '2026-12-01', totalPrice: 100 }),
      makeReservation({ date: '2026-01-15', totalPrice: 200 }),
      makeReservation({ date: '2026-06-10', totalPrice: 300 }),
    ];

    const result = groupRevenueByPeriod(reservations, 'month');
    const periods = result.map(r => r.period);

    expect(periods).toEqual(['2026-01', '2026-06', '2026-12']);
  });
});

// ---------------------------------------------------------------------------
// getWeekNumber (helper used internally)
// ---------------------------------------------------------------------------

describe('getWeekNumber', () => {
  it('returns 1 for early January dates in week 1', () => {
    // 2026-01-01 is Thursday -> ISO week 1
    expect(getWeekNumber(new Date('2026-01-01'))).toBe(1);
  });

  it('returns 53 for late December dates when applicable', () => {
    // 2015-12-31 is Thursday -> ISO week 53
    expect(getWeekNumber(new Date('2015-12-31'))).toBe(53);
  });
});
