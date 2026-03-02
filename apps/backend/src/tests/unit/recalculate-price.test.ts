/**
 * Unit tests for extra hours pricing per EventType (#176)
 * Tests: calculateExtraHoursCost, computeReservationBasePrice, recalculateReservationTotalPrice
 */
import {
  calculateExtraHoursCost,
  computeReservationBasePrice,
  recalculateReservationTotalPrice,
  STANDARD_HOURS,
  DEFAULT_EXTRA_HOUR_RATE,
} from '@/utils/recalculate-price';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockFindUnique = prisma.reservation.findUnique as jest.Mock;
const mockUpdate = prisma.reservation.update as jest.Mock;

// ─── Helper ───────────────────────────────────────────────────────
function makeDate(isoDate: string, time: string): Date {
  return new Date(`${isoDate}T${time}:00.000Z`);
}

function buildReservation(overrides: Record<string, any> = {}) {
  return {
    id: 'res-1',
    startDateTime: makeDate('2026-06-15', '14:00'),
    endDateTime: makeDate('2026-06-15', '20:00'), // 6h = standard
    adults: 50,
    children: 10,
    toddlers: 5,
    pricePerAdult: 150,
    pricePerChild: 80,
    pricePerToddler: 0,
    venueSurcharge: 0,
    discountType: null,
    discountValue: null,
    menuSnapshot: null,
    eventType: { standardHours: null, extraHourRate: null },
    extras: [],
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════
// calculateExtraHoursCost
// ═════════════════════════════════════════════════════════════════
describe('calculateExtraHoursCost', () => {
  it('returns 0 when start is null', () => {
    expect(calculateExtraHoursCost(null, new Date())).toBe(0);
  });

  it('returns 0 when end is null', () => {
    expect(calculateExtraHoursCost(new Date(), null)).toBe(0);
  });

  it('returns 0 when both are null', () => {
    expect(calculateExtraHoursCost(null, null)).toBe(0);
  });

  it('returns 0 when end <= start (zero duration)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '14:00');
    expect(calculateExtraHoursCost(start, end)).toBe(0);
  });

  it('returns 0 when end < start (negative duration)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '12:00');
    expect(calculateExtraHoursCost(start, end)).toBe(0);
  });

  it('returns 0 when duration equals standard hours (6h default)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '20:00'); // 6h
    expect(calculateExtraHoursCost(start, end)).toBe(0);
  });

  it('returns 0 when duration is less than standard hours', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '18:00'); // 4h
    expect(calculateExtraHoursCost(start, end)).toBe(0);
  });

  it('charges for extra hours beyond standard (8h = 2 extra)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '22:00'); // 8h
    expect(calculateExtraHoursCost(start, end)).toBe(2 * DEFAULT_EXTRA_HOUR_RATE); // 1000
  });

  it('ceils fractional extra hours (6h30m = 1 extra hour)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '20:30'); // 6.5h
    expect(calculateExtraHoursCost(start, end)).toBe(1 * DEFAULT_EXTRA_HOUR_RATE); // 500
  });

  it('ceils fractional extra hours (7h15m = 2 extra hours)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '21:15'); // 7.25h
    expect(calculateExtraHoursCost(start, end)).toBe(2 * DEFAULT_EXTRA_HOUR_RATE); // 1000
  });

  it('uses custom extraHourRate', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '22:00'); // 8h, 2 extra
    expect(calculateExtraHoursCost(start, end, 700)).toBe(2 * 700); // 1400
  });

  it('returns 0 when extraHourRate = 0 (exempt)', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '23:00'); // 9h, 3 extra
    expect(calculateExtraHoursCost(start, end, 0)).toBe(0);
  });

  it('uses custom standardHours', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '22:00'); // 8h, with standardHours=8 → 0 extra
    expect(calculateExtraHoursCost(start, end, DEFAULT_EXTRA_HOUR_RATE, 8)).toBe(0);
  });

  it('standardHours=0 means all hours are extra', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '17:00'); // 3h
    expect(calculateExtraHoursCost(start, end, DEFAULT_EXTRA_HOUR_RATE, 0)).toBe(3 * DEFAULT_EXTRA_HOUR_RATE); // 1500
  });

  it('standardHours=10, duration=8h → 0 extra', () => {
    const start = makeDate('2026-06-15', '14:00');
    const end = makeDate('2026-06-15', '22:00'); // 8h
    expect(calculateExtraHoursCost(start, end, DEFAULT_EXTRA_HOUR_RATE, 10)).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// computeReservationBasePrice
// ═════════════════════════════════════════════════════════════════
describe('computeReservationBasePrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when reservation not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(computeReservationBasePrice('nonexistent')).rejects.toThrow('Nie znaleziono rezerwacji');
  });

  it('uses default fallbacks when eventType fields are null', async () => {
    const reservation = buildReservation();
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    // menuPrice: 50*150 + 10*80 + 5*0 = 8300
    // extras: 0, surcharge: 0, extraHours: 0 (6h = standard)
    expect(result.menuPrice).toBe(8300);
    expect(result.extraHoursCost).toBe(0);
    expect(result.extrasTotal).toBe(0);
    expect(result.surcharge).toBe(0);
    expect(result.basePrice).toBe(8300);
    expect(result.hasDiscount).toBe(false);
    expect(result.discountAmount).toBe(0);
    expect(result.totalPrice).toBe(8300);
  });

  it('uses eventType.standardHours and extraHourRate overrides', async () => {
    const reservation = buildReservation({
      endDateTime: makeDate('2026-06-15', '23:00'), // 9h
      eventType: { standardHours: 8, extraHourRate: 700 },
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    // 9h - 8h standard = 1 extra hour * 700 = 700
    expect(result.extraHoursCost).toBe(700);
    expect(result.basePrice).toBe(8300 + 700);
  });

  it('extraHourRate = 0 → exempt (no extra hours cost)', async () => {
    const reservation = buildReservation({
      endDateTime: makeDate('2026-06-16', '02:00'), // 12h
      eventType: { standardHours: 6, extraHourRate: 0 },
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.extraHoursCost).toBe(0);
    expect(result.basePrice).toBe(8300);
  });

  it('applies PERCENTAGE discount correctly', async () => {
    const reservation = buildReservation({
      discountType: 'PERCENTAGE',
      discountValue: 10, // 10%
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.hasDiscount).toBe(true);
    expect(result.basePrice).toBe(8300);
    expect(result.discountAmount).toBe(830); // 10% of 8300
    expect(result.totalPrice).toBe(7470);
  });

  it('applies AMOUNT discount correctly (capped at basePrice)', async () => {
    const reservation = buildReservation({
      discountType: 'AMOUNT',
      discountValue: 500,
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(500);
    expect(result.totalPrice).toBe(7800);
  });

  it('AMOUNT discount capped at basePrice (no negative total)', async () => {
    const reservation = buildReservation({
      adults: 1, children: 0, toddlers: 0,
      pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
      discountType: 'AMOUNT',
      discountValue: 9999,
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    // basePrice = 100, discount capped at 100
    expect(result.discountAmount).toBe(100);
    expect(result.totalPrice).toBe(0);
  });

  it('includes extras total from non-cancelled extras', async () => {
    const reservation = buildReservation({
      extras: [
        { totalPrice: 200, status: 'PENDING', serviceItem: { basePrice: 200, priceType: 'FLAT' } },
        { totalPrice: 300, status: 'CONFIRMED', serviceItem: { basePrice: 300, priceType: 'FLAT' } },
      ],
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.extrasTotal).toBe(500);
    expect(result.basePrice).toBe(8300 + 500);
    expect(result.totalPrice).toBe(8800);
  });

  it('includes venueSurcharge in basePrice', async () => {
    const reservation = buildReservation({
      venueSurcharge: 1500,
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.surcharge).toBe(1500);
    expect(result.basePrice).toBe(8300 + 1500);
  });

  it('uses menuSnapshot.totalMenuPrice when snapshot exists', async () => {
    const reservation = buildReservation({
      menuSnapshot: { totalMenuPrice: 12000 },
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.menuPrice).toBe(12000);
    expect(result.basePrice).toBe(12000);
  });

  it('full scenario: extras + surcharge + extra hours + discount', async () => {
    const reservation = buildReservation({
      endDateTime: makeDate('2026-06-15', '22:00'), // 8h → 2 extra
      eventType: { standardHours: 6, extraHourRate: 500 },
      venueSurcharge: 1000,
      extras: [
        { totalPrice: 400, status: 'PENDING', serviceItem: { basePrice: 400, priceType: 'FLAT' } },
      ],
      discountType: 'PERCENTAGE',
      discountValue: 5,
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    // menu: 8300, extras: 400, surcharge: 1000, extraHours: 2*500=1000
    // base = 8300 + 400 + 1000 + 1000 = 10700
    // discount = 5% of 10700 = 535
    // total = 10700 - 535 = 10165
    expect(result.menuPrice).toBe(8300);
    expect(result.extrasTotal).toBe(400);
    expect(result.surcharge).toBe(1000);
    expect(result.extraHoursCost).toBe(1000);
    expect(result.basePrice).toBe(10700);
    expect(result.discountAmount).toBe(535);
    expect(result.totalPrice).toBe(10165);
  });
});

// ═════════════════════════════════════════════════════════════════
// recalculateReservationTotalPrice
// ═════════════════════════════════════════════════════════════════
describe('recalculateReservationTotalPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists totalPrice, extrasTotalPrice, extraHoursCost', async () => {
    const reservation = buildReservation({
      endDateTime: makeDate('2026-06-15', '22:00'), // 8h → 2 extra
      eventType: { standardHours: null, extraHourRate: null }, // defaults: 6h, 500
    });
    mockFindUnique.mockResolvedValue(reservation);
    mockUpdate.mockResolvedValue({});

    const totalPrice = await recalculateReservationTotalPrice('res-1');

    // menu: 8300 + extraHours: 2*500=1000 = 9300
    expect(totalPrice).toBe(9300);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({
        totalPrice: 9300,
        priceBeforeDiscount: null,
        discountAmount: null,
      }),
    });
  });

  it('persists discount fields when discount is active', async () => {
    const reservation = buildReservation({
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });
    mockFindUnique.mockResolvedValue(reservation);
    mockUpdate.mockResolvedValue({});

    const totalPrice = await recalculateReservationTotalPrice('res-1');

    // base: 8300, discount: 830, total: 7470
    expect(totalPrice).toBe(7470);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({
        totalPrice: 7470,
        priceBeforeDiscount: 8300,
        discountAmount: 830,
      }),
    });
  });

  it('clears discount fields when no discount', async () => {
    const reservation = buildReservation();
    mockFindUnique.mockResolvedValue(reservation);
    mockUpdate.mockResolvedValue({});

    await recalculateReservationTotalPrice('res-1');

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({
        priceBeforeDiscount: null,
        discountAmount: null,
      }),
    });
  });

  it('returns totalPrice as number', async () => {
    const reservation = buildReservation();
    mockFindUnique.mockResolvedValue(reservation);
    mockUpdate.mockResolvedValue({});

    const result = await recalculateReservationTotalPrice('res-1');

    expect(typeof result).toBe('number');
    expect(result).toBe(8300);
  });
});
