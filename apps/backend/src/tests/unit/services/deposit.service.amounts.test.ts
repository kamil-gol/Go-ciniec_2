/**
 * Unit tests for deposit amount validation logic
 *
 * Covers:
 * - deposit.amount > 0 (reject <= 0)
 * - existingDeposits + newDeposit > fullPrice -> rejected
 * - existingDeposits + newDeposit = fullPrice -> accepted (boundary)
 * - update: new amount doesn't exceed remaining capacity
 * - getFullReservationPrice = totalPrice + extrasTotalPrice
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    reservation: {
      findUnique: jest.fn(),
    },
    deposit: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../services/deposits/deposit-notifications.service', () => ({
  depositNotificationsService: {
    checkAndAutoConfirmReservation: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../services/deposits/deposit-stats.service', () => ({
  depositStatsService: {},
}));

import depositService from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';
import { getFullReservationPrice } from '../../../services/deposits/deposit.helpers';

const mockPrisma = prisma as any;

const USER_ID = 'user-1';

function makeReservation(overrides: {
  id?: string;
  totalPrice?: number;
  extrasTotalPrice?: number;
  deposits?: Array<{ id: string; amount: number; status: string }>;
} = {}) {
  return {
    id: overrides.id ?? 'res-1',
    totalPrice: overrides.totalPrice ?? 10000,
    extrasTotalPrice: overrides.extrasTotalPrice ?? 0,
    client: { firstName: 'Jan', lastName: 'Kowalski' },
    deposits: (overrides.deposits ?? []).map((d) => ({
      ...d,
      amount: d.amount,
    })),
  };
}

function makeDeposit(overrides: {
  id?: string;
  reservationId?: string;
  amount?: number;
  paid?: boolean;
  status?: string;
} = {}) {
  return {
    id: overrides.id ?? 'dep-1',
    reservationId: overrides.reservationId ?? 'res-1',
    amount: overrides.amount ?? 1000,
    remainingAmount: overrides.amount ?? 1000,
    paidAmount: 0,
    paid: overrides.paid ?? false,
    status: overrides.status ?? 'PENDING',
    dueDate: '2027-06-01',
    createdAt: new Date(),
    updatedAt: new Date(),
    paymentMethod: null,
    paidAt: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getFullReservationPrice (pure function)
// ---------------------------------------------------------------------------
describe('getFullReservationPrice', () => {
  it('returns totalPrice + extrasTotalPrice', () => {
    expect(getFullReservationPrice({ totalPrice: 8000, extrasTotalPrice: 2000 })).toBe(10000);
  });

  it('returns only totalPrice when extras are missing', () => {
    expect(getFullReservationPrice({ totalPrice: 5000 })).toBe(5000);
  });

  it('returns only extrasTotalPrice when totalPrice is missing', () => {
    expect(getFullReservationPrice({ extrasTotalPrice: 1500 })).toBe(1500);
  });

  it('returns 0 when both are missing', () => {
    expect(getFullReservationPrice({})).toBe(0);
  });

  it('handles string numeric values (Prisma Decimal)', () => {
    expect(getFullReservationPrice({ totalPrice: '3000', extrasTotalPrice: '750' })).toBe(3750);
  });
});

// ---------------------------------------------------------------------------
// depositService.create — amount validation
// ---------------------------------------------------------------------------
describe('depositService.create — amount validation', () => {
  const baseInput = {
    reservationId: 'res-1',
    amount: 1000,
    dueDate: '2027-06-01',
  };

  it('rejects amount = 0', async () => {
    const reservation = makeReservation({ totalPrice: 10000 });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    await expect(
      depositService.create({ ...baseInput, amount: 0 }, USER_ID)
    ).rejects.toThrow(/musi by/i); // "Kwota zaliczki musi być większa od 0"
  });

  it('rejects negative amount', async () => {
    const reservation = makeReservation({ totalPrice: 10000 });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    await expect(
      depositService.create({ ...baseInput, amount: -500 }, USER_ID)
    ).rejects.toThrow();
  });

  it('rejects when existingDeposits + newDeposit > fullPrice', async () => {
    const reservation = makeReservation({
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-existing', amount: 8000, status: 'PENDING' },
      ],
    });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    await expect(
      depositService.create({ ...baseInput, amount: 3000 }, USER_ID)
    ).rejects.toThrow(/przekracza|suma/i); // EXCEEDS_PRICE message
  });

  it('accepts when existingDeposits + newDeposit = fullPrice (boundary)', async () => {
    const reservation = makeReservation({
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-existing', amount: 7000, status: 'PENDING' },
      ],
    });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    const insertResult = [{ id: 'dep-new' }];
    mockPrisma.$queryRaw.mockResolvedValue(insertResult);

    const createdDeposit = makeDeposit({ id: 'dep-new', amount: 3000 });
    mockPrisma.deposit.findUnique.mockResolvedValue(createdDeposit);

    const result = await depositService.create({ ...baseInput, amount: 3000 }, USER_ID);
    expect(result).toBeDefined();
    expect(result!.id).toBe('dep-new');
  });

  it('accepts when no existing deposits and amount < fullPrice', async () => {
    const reservation = makeReservation({
      totalPrice: 10000,
      extrasTotalPrice: 2000,
      deposits: [],
    });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    const insertResult = [{ id: 'dep-new' }];
    mockPrisma.$queryRaw.mockResolvedValue(insertResult);

    const createdDeposit = makeDeposit({ id: 'dep-new', amount: 5000 });
    mockPrisma.deposit.findUnique.mockResolvedValue(createdDeposit);

    const result = await depositService.create({ ...baseInput, amount: 5000 }, USER_ID);
    expect(result).toBeDefined();
  });

  it('ignores CANCELLED deposits when summing existing deposits', async () => {
    const reservation = makeReservation({
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-cancelled', amount: 9000, status: 'CANCELLED' },
        { id: 'dep-active', amount: 2000, status: 'PENDING' },
      ],
    });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    const insertResult = [{ id: 'dep-new' }];
    mockPrisma.$queryRaw.mockResolvedValue(insertResult);

    const createdDeposit = makeDeposit({ id: 'dep-new', amount: 7000 });
    mockPrisma.deposit.findUnique.mockResolvedValue(createdDeposit);

    // 2000 existing + 7000 new = 9000 <= 10000 -> should pass
    const result = await depositService.create({ ...baseInput, amount: 7000 }, USER_ID);
    expect(result).toBeDefined();
  });

  it('includes extrasTotalPrice in the ceiling', async () => {
    const reservation = makeReservation({
      totalPrice: 8000,
      extrasTotalPrice: 2000, // fullPrice = 10000
      deposits: [
        { id: 'dep-existing', amount: 9000, status: 'PENDING' },
      ],
    });
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    // 9000 + 1500 = 10500 > 10000 -> should reject
    await expect(
      depositService.create({ ...baseInput, amount: 1500 }, USER_ID)
    ).rejects.toThrow();
  });

  it('throws not found for non-existent reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null);

    await expect(
      depositService.create(baseInput, USER_ID)
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// depositService.update — amount validation
// ---------------------------------------------------------------------------
describe('depositService.update — amount validation', () => {
  it('rejects amount = 0 on update', async () => {
    const deposit = makeDeposit({ id: 'dep-1', amount: 1000 });
    mockPrisma.deposit.findUnique.mockResolvedValue(deposit);

    await expect(
      depositService.update('dep-1', { amount: 0 }, USER_ID)
    ).rejects.toThrow(/musi by/i);
  });

  it('rejects negative amount on update', async () => {
    const deposit = makeDeposit({ id: 'dep-1', amount: 1000 });
    mockPrisma.deposit.findUnique.mockResolvedValue(deposit);

    await expect(
      depositService.update('dep-1', { amount: -100 }, USER_ID)
    ).rejects.toThrow();
  });

  it('rejects update when new amount exceeds remaining capacity', async () => {
    const deposit = makeDeposit({ id: 'dep-1', reservationId: 'res-1', amount: 1000 });
    mockPrisma.deposit.findUnique.mockResolvedValue(deposit);

    const reservation = {
      id: 'res-1',
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-1', amount: 1000, status: 'PENDING' },
        { id: 'dep-2', amount: 8000, status: 'PENDING' },
      ],
    };
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);

    // otherDepositsSum = 8000 (dep-2), new amount = 3000, 8000 + 3000 = 11000 > 10000
    await expect(
      depositService.update('dep-1', { amount: 3000 }, USER_ID)
    ).rejects.toThrow();
  });

  it('accepts update when new amount fits remaining capacity', async () => {
    const deposit = makeDeposit({ id: 'dep-1', reservationId: 'res-1', amount: 1000 });
    mockPrisma.deposit.findUnique
      .mockResolvedValueOnce(deposit) // first call: find deposit to update
      .mockResolvedValueOnce({ ...deposit, amount: 2000 }); // after update: return updated

    const reservation = {
      id: 'res-1',
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-1', amount: 1000, status: 'PENDING' },
        { id: 'dep-2', amount: 5000, status: 'PENDING' },
      ],
    };
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    // otherDepositsSum = 5000, new amount = 2000, 5000 + 2000 = 7000 <= 10000
    const result = await depositService.update('dep-1', { amount: 2000 }, USER_ID);
    expect(result).toBeDefined();
  });

  it('accepts update when new amount = fullPrice - otherDeposits (boundary)', async () => {
    const deposit = makeDeposit({ id: 'dep-1', reservationId: 'res-1', amount: 1000 });
    mockPrisma.deposit.findUnique
      .mockResolvedValueOnce(deposit)
      .mockResolvedValueOnce({ ...deposit, amount: 4000 });

    const reservation = {
      id: 'res-1',
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-1', amount: 1000, status: 'PENDING' },
        { id: 'dep-2', amount: 6000, status: 'PENDING' },
      ],
    };
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    // otherDepositsSum = 6000, new amount = 4000, 6000 + 4000 = 10000 = fullPrice
    const result = await depositService.update('dep-1', { amount: 4000 }, USER_ID);
    expect(result).toBeDefined();
  });

  it('excludes CANCELLED deposits from otherDepositsSum on update', async () => {
    const deposit = makeDeposit({ id: 'dep-1', reservationId: 'res-1', amount: 1000 });
    mockPrisma.deposit.findUnique
      .mockResolvedValueOnce(deposit)
      .mockResolvedValueOnce({ ...deposit, amount: 9000 });

    const reservation = {
      id: 'res-1',
      totalPrice: 10000,
      extrasTotalPrice: 0,
      deposits: [
        { id: 'dep-1', amount: 1000, status: 'PENDING' },
        { id: 'dep-cancelled', amount: 8000, status: 'CANCELLED' },
      ],
    };
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    // otherDepositsSum = 0 (cancelled excluded), new amount = 9000, 0 + 9000 <= 10000
    const result = await depositService.update('dep-1', { amount: 9000 }, USER_ID);
    expect(result).toBeDefined();
  });

  it('rejects update on paid deposit', async () => {
    const deposit = makeDeposit({ id: 'dep-1', paid: true, status: 'PAID' });
    mockPrisma.deposit.findUnique.mockResolvedValue(deposit);

    await expect(
      depositService.update('dep-1', { amount: 2000 }, USER_ID)
    ).rejects.toThrow(/opłacon/i); // CANNOT_EDIT_PAID
  });
});
