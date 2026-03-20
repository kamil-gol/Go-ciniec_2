/**
 * Unit tests for #216: categoryExtras in price recalculation
 * Tests that categoryExtrasTotal is included in basePrice and totalPrice.
 */
import {
  computeReservationBasePrice,
  recalculateReservationTotalPrice,
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

function makeDate(isoDate: string, time: string): Date {
  return new Date(`${isoDate}T${time}:00.000Z`);
}

function buildReservation(overrides: Record<string, any> = {}) {
  return {
    id: 'res-1',
    startDateTime: makeDate('2026-06-15', '14:00'),
    endDateTime: makeDate('2026-06-15', '20:00'),
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
    categoryExtras: [],
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════
// categoryExtras in computeReservationBasePrice
// ═════════════════════════════════════════════════════════════════
describe('computeReservationBasePrice — categoryExtras (#216)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns categoryExtrasTotal = 0 when no category extras', async () => {
    mockFindUnique.mockResolvedValue(buildReservation());

    const result = await computeReservationBasePrice('res-1');

    expect(result.categoryExtrasTotal).toBe(0);
    expect(result.basePrice).toBe(8300); // menu only
  });

  it('sums categoryExtras totalPrice into basePrice', async () => {
    const reservation = buildReservation({
      categoryExtras: [
        { totalPrice: 1020, quantity: 2, pricePerItem: 20, guestCount: 51, portionTarget: 'ALL' },
      ],
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.categoryExtrasTotal).toBe(1020);
    expect(result.basePrice).toBe(8300 + 1020);
    expect(result.totalPrice).toBe(9320);
  });

  it('sums multiple category extras', async () => {
    const reservation = buildReservation({
      categoryExtras: [
        { totalPrice: 500, quantity: 1, pricePerItem: 10, guestCount: 50, portionTarget: 'ADULTS_ONLY' },
        { totalPrice: 300, quantity: 3, pricePerItem: 10, guestCount: 10, portionTarget: 'CHILDREN_ONLY' },
      ],
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.categoryExtrasTotal).toBe(800);
    expect(result.basePrice).toBe(8300 + 800);
    expect(result.totalPrice).toBe(9100);
  });

  it('includes categoryExtras in discount calculation', async () => {
    const reservation = buildReservation({
      discountType: 'PERCENTAGE',
      discountValue: 10,
      categoryExtras: [
        { totalPrice: 1000, quantity: 2, pricePerItem: 20, guestCount: 25, portionTarget: 'ALL' },
      ],
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    // base = 8300 + 1000 = 9300
    // discount = 10% of 9300 = 930
    // total = 9300 - 930 = 8370
    expect(result.basePrice).toBe(9300);
    expect(result.discountAmount).toBe(930);
    expect(result.totalPrice).toBe(8370);
  });

  it('full scenario: extras + categoryExtras + surcharge + extra hours + discount', async () => {
    const reservation = buildReservation({
      endDateTime: makeDate('2026-06-15', '22:00'), // 8h → 2 extra
      eventType: { standardHours: 6, extraHourRate: 500 },
      venueSurcharge: 1000,
      extras: [
        { totalPrice: 400, status: 'PENDING', serviceItem: { basePrice: 400, priceType: 'FLAT' } },
      ],
      categoryExtras: [
        { totalPrice: 2040, quantity: 2, pricePerItem: 20, guestCount: 51, portionTarget: 'ALL' },
      ],
      discountType: 'PERCENTAGE',
      discountValue: 5,
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    // menu: 8300, extras: 400, categoryExtras: 2040, surcharge: 1000, extraHours: 2*500=1000
    // base = 8300 + 400 + 2040 + 1000 + 1000 = 12740
    // discount = 5% of 12740 = 637
    // total = 12740 - 637 = 12103
    expect(result.menuPrice).toBe(8300);
    expect(result.extrasTotal).toBe(400);
    expect(result.categoryExtrasTotal).toBe(2040);
    expect(result.surcharge).toBe(1000);
    expect(result.extraHoursCost).toBe(1000);
    expect(result.basePrice).toBe(12740);
    expect(result.discountAmount).toBe(637);
    expect(result.totalPrice).toBe(12103);
  });

  it('handles categoryExtras with Decimal-like totalPrice', async () => {
    const reservation = buildReservation({
      categoryExtras: [
        { totalPrice: '1530.00', quantity: 3, pricePerItem: 10, guestCount: 51 },
      ],
    });
    mockFindUnique.mockResolvedValue(reservation);

    const result = await computeReservationBasePrice('res-1');

    expect(result.categoryExtrasTotal).toBe(1530);
    expect(result.basePrice).toBe(8300 + 1530);
  });
});

// ═════════════════════════════════════════════════════════════════
// recalculateReservationTotalPrice with categoryExtras
// ═════════════════════════════════════════════════════════════════
describe('recalculateReservationTotalPrice — categoryExtras (#216)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists totalPrice including categoryExtras', async () => {
    const reservation = buildReservation({
      categoryExtras: [
        { totalPrice: 1020, quantity: 2, pricePerItem: 20, guestCount: 51, portionTarget: 'ALL' },
      ],
    });
    mockFindUnique.mockResolvedValue(reservation);
    mockUpdate.mockResolvedValue({});

    const totalPrice = await recalculateReservationTotalPrice('res-1');

    expect(totalPrice).toBe(9320); // 8300 + 1020

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({
        totalPrice: 9320,
      }),
    });
  });
});
