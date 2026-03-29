jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import prisma from '../../../lib/prisma';
import { recalculateReservationTotal } from '../../../utils/recalculate-total';

const mockFindUnique = prisma.reservation.findUnique as jest.Mock;
const mockUpdate = prisma.reservation.update as jest.Mock;

describe('recalculateReservationTotal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseReservation = {
    id: 'res-001',
    adults: 50,
    children: 10,
    toddlers: 5,
    pricePerAdult: 200,
    pricePerChild: 100,
    pricePerToddler: 0,
    discountPercentage: null,
    discountAmount: null,
    venueSurcharge: 0,
    reservationExtras: [],
  };

  it('should calculate base pricing without extras or discount', async () => {
    mockFindUnique.mockResolvedValue({ ...baseReservation });
    mockUpdate.mockResolvedValue({});

    const result = await recalculateReservationTotal('res-001');

    expect(result.basePricing).toBe(50 * 200 + 10 * 100); // 11000
    expect(result.extrasTotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.totalPrice).toBe(11000);
  });

  it('should include non-cancelled extras in total', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseReservation,
      reservationExtras: [
        { status: 'ACTIVE', totalPrice: 500 },
        { status: 'ACTIVE', totalPrice: 300 },
        { status: 'CANCELLED', totalPrice: 200 },
      ],
    });
    mockUpdate.mockResolvedValue({});

    const result = await recalculateReservationTotal('res-001');

    expect(result.extrasTotal).toBe(800);
    expect(result.totalPrice).toBe(11000 + 800);
  });

  it('should apply venue surcharge', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseReservation,
      venueSurcharge: 2000,
    });
    mockUpdate.mockResolvedValue({});

    const result = await recalculateReservationTotal('res-001');

    expect(result.venueSurcharge).toBe(2000);
    expect(result.totalPrice).toBe(11000 + 2000);
  });

  it('should apply percentage discount', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseReservation,
      discountPercentage: 10,
    });
    mockUpdate.mockResolvedValue({});

    const result = await recalculateReservationTotal('res-001');

    expect(result.discountAmount).toBe(1100); // 10% of 11000
    expect(result.totalPrice).toBe(11000 - 1100);
  });

  it('should persist updated prices to database', async () => {
    mockFindUnique.mockResolvedValue({ ...baseReservation });
    mockUpdate.mockResolvedValue({});

    await recalculateReservationTotal('res-001');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'res-001' },
        data: expect.objectContaining({
          totalPrice: expect.any(Number),
        }),
      })
    );
  });
});
