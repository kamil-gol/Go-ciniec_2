/**
 * ServiceExtraService — Reservation Extras & Price Calculation Branches
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: {
      findUnique: jest.fn(),
    },
    serviceItem: {
      findUnique: jest.fn(),
    },
    reservationExtra: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ status: 'changed' }),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

import { ServiceExtraService } from '../../../services/serviceExtra.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new ServiceExtraService();

const RESERVATION = { id: 'r1', adults: 10, children: 2 };

const ITEM_FLAT = {
  id: 'i1',
  name: 'Dekoracje',
  priceType: 'FLAT',
  basePrice: 500,
  isActive: true,
  requiresNote: false,
  categoryId: 'cat1',
  category: { id: 'cat1', name: 'Dekoracje', isExclusive: false },
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════
// getReservationExtras
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — getReservationExtras()', () => {
  it('throws when reservation not found', async () => {
    db.reservation.findUnique.mockResolvedValue(null);

    await expect(svc.getReservationExtras('missing')).rejects.toThrow('Nie znaleziono rezerwacji');
  });

  it('returns extras with correct totalExtrasPrice and count', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.reservationExtra.findMany.mockResolvedValue([
      { totalPrice: 100 },
      { totalPrice: 250 },
    ]);

    const result = await svc.getReservationExtras('r1');

    expect(result.totalExtrasPrice).toBe(350);
    expect(result.count).toBe(2);
    expect(result.extras).toHaveLength(2);
  });

  it('returns zero total when reservation has no extras', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.reservationExtra.findMany.mockResolvedValue([]);

    const result = await svc.getReservationExtras('r1');

    expect(result.totalExtrasPrice).toBe(0);
    expect(result.count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════
// assignExtra
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — assignExtra()', () => {
  it('throws when reservation not found', async () => {
    db.reservation.findUnique.mockResolvedValue(null);

    await expect(
      svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1')
    ).rejects.toThrow('Nie znaleziono rezerwacji');
  });

  it('throws when service item not found', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(null);

    await expect(
      svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1')
    ).rejects.toThrow('Nie znaleziono pozycji usługi');
  });

  it('throws when item is inactive', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue({ ...ITEM_FLAT, isActive: false });

    await expect(
      svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1')
    ).rejects.toThrow('Pozycja usługi jest nieaktywna');
  });

  it('throws when note is required but not provided', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue({
      ...ITEM_FLAT,
      requiresNote: true,
      noteLabel: 'Treść na torcie',
    });

    await expect(
      svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1')
    ).rejects.toThrow('jest wymagane');
  });

  it('throws for PER_UNIT without quantity >= 1', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue({ ...ITEM_FLAT, priceType: 'PER_UNIT' });

    await expect(
      svc.assignExtra('r1', { serviceItemId: 'i1', quantity: 0 } as any, 'u1')
    ).rejects.toThrow('wymagane jest podanie ilości');
  });

  it('throws when extra is already assigned to reservation', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(ITEM_FLAT);
    db.reservationExtra.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1')
    ).rejects.toThrow('już dodana do rezerwacji');
  });

  it('assigns FLAT extra — totalPrice = unitPrice * quantity', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(ITEM_FLAT);
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 500 });

    const result = await svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1');

    expect(result).toMatchObject({ id: 'e1' });
    expect(db.reservationExtra.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ priceType: 'FLAT', totalPrice: 500 }),
      })
    );
  });

  it('assigns PER_PERSON — totalPrice = unitPrice * (adults + children)', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION); // adults=10, children=2
    db.serviceItem.findUnique.mockResolvedValue({ ...ITEM_FLAT, priceType: 'PER_PERSON', basePrice: 50 });
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 600 });

    await svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1');

    expect(db.reservationExtra.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 600 }), // 50 * 12
      })
    );
  });

  it('assigns PER_UNIT — totalPrice = unitPrice * quantity', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue({ ...ITEM_FLAT, priceType: 'PER_UNIT', basePrice: 100 });
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 300 });

    await svc.assignExtra('r1', { serviceItemId: 'i1', quantity: 3 } as any, 'u1');

    expect(db.reservationExtra.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 300 }), // 100 * 3
      })
    );
  });

  it('assigns FREE extra — totalPrice forced to 0', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue({ ...ITEM_FLAT, priceType: 'FREE', basePrice: 0 });
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 0 });

    await svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1');

    expect(db.reservationExtra.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 0 }),
      })
    );
  });

  it('uses customPrice when provided instead of basePrice', async () => {
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(ITEM_FLAT);
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 999 });

    await svc.assignExtra('r1', { serviceItemId: 'i1', customPrice: 999 } as any, 'u1');

    expect(db.reservationExtra.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ unitPrice: 999 }),
      })
    );
  });

  it('auto-replaces existing extra in exclusive category', async () => {
    const exclusiveItem = {
      ...ITEM_FLAT,
      category: { id: 'cat1', name: 'Wyłączna', isExclusive: true },
    };
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(exclusiveItem);
    db.reservationExtra.findMany.mockResolvedValue([
      { id: 'old-e1', serviceItem: { name: 'Stary tort' } },
    ]);
    db.reservationExtra.deleteMany.mockResolvedValue({ count: 1 });
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'new-e1', totalPrice: 500 });

    await svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1');

    expect(db.reservationExtra.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['old-e1'] } } })
    );
    expect(db.reservationExtra.create).toHaveBeenCalled();
  });

  it('skips deleteMany when exclusive category has no existing extra', async () => {
    const exclusiveItem = {
      ...ITEM_FLAT,
      category: { id: 'cat1', name: 'Wyłączna', isExclusive: true },
    };
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(exclusiveItem);
    db.reservationExtra.findMany.mockResolvedValue([]);
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'new-e1', totalPrice: 500 });

    await svc.assignExtra('r1', { serviceItemId: 'i1' } as any, 'u1');

    expect(db.reservationExtra.deleteMany).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════
// updateReservationExtra
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — updateReservationExtra()', () => {
  const existing = {
    id: 'e1',
    reservationId: 'r1',
    priceType: 'FLAT',
    quantity: 1,
    unitPrice: 500,
    serviceItem: { id: 'i1', name: 'Dekoracje', basePrice: 500 },
  };

  it('throws when extra not found', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(null);

    await expect(
      svc.updateReservationExtra('r1', 'missing', {} as any, 'u1')
    ).rejects.toThrow('Nie znaleziono dodatku rezerwacji');
  });

  it('throws when reservation not found', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(existing);
    db.reservation.findUnique.mockResolvedValue(null);

    await expect(
      svc.updateReservationExtra('r1', 'e1', {} as any, 'u1')
    ).rejects.toThrow('Nie znaleziono rezerwacji');
  });

  it('throws when status is invalid', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(existing);
    db.reservation.findUnique.mockResolvedValue(RESERVATION);

    await expect(
      svc.updateReservationExtra('r1', 'e1', { status: 'INVALID' } as any, 'u1')
    ).rejects.toThrow('Nieprawidłowy status');
  });

  it('throws for PER_UNIT when quantity is less than 1', async () => {
    db.reservationExtra.findFirst.mockResolvedValue({ ...existing, priceType: 'PER_UNIT' });
    db.reservation.findUnique.mockResolvedValue(RESERVATION);

    await expect(
      svc.updateReservationExtra('r1', 'e1', { quantity: 0 } as any, 'u1')
    ).rejects.toThrow('ilość musi wynosić min. 1');
  });

  it('updates status to CONFIRMED successfully', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(existing);
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    const updated = { ...existing, status: 'CONFIRMED' };
    db.reservationExtra.update.mockResolvedValue(updated);

    const result = await svc.updateReservationExtra(
      'r1',
      'e1',
      { status: 'CONFIRMED' } as any,
      'u1'
    );

    expect(result).toEqual(updated);
    expect(db.reservationExtra.update).toHaveBeenCalled();
  });

  it('recalculates FLAT totalPrice when quantity changes', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(existing); // unitPrice=500
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.reservationExtra.update.mockResolvedValue({ ...existing, quantity: 3, totalPrice: 1500 });

    await svc.updateReservationExtra('r1', 'e1', { quantity: 3 } as any, 'u1');

    expect(db.reservationExtra.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 1500 }), // 500 * 3
      })
    );
  });

  it('recalculates totalPrice when customPrice changes', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(existing);
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.reservationExtra.update.mockResolvedValue({ ...existing, unitPrice: 800, totalPrice: 800 });

    await svc.updateReservationExtra('r1', 'e1', { customPrice: 800 } as any, 'u1');

    expect(db.reservationExtra.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ unitPrice: 800 }),
      })
    );
  });

  it('accepts CANCELLED as valid status', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(existing);
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.reservationExtra.update.mockResolvedValue({ ...existing, status: 'CANCELLED' });

    await expect(
      svc.updateReservationExtra('r1', 'e1', { status: 'CANCELLED' } as any, 'u1')
    ).resolves.toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
// removeReservationExtra
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — removeReservationExtra()', () => {
  it('throws when extra not found', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(null);

    await expect(
      svc.removeReservationExtra('r1', 'missing', 'u1')
    ).rejects.toThrow('Nie znaleziono dodatku rezerwacji');
  });

  it('removes extra and triggers recalculation', async () => {
    db.reservationExtra.findFirst.mockResolvedValue({
      id: 'e1',
      serviceItem: { name: 'Tort weselny' },
      totalPrice: 300,
    });
    db.reservationExtra.delete.mockResolvedValue({ id: 'e1' });

    await svc.removeReservationExtra('r1', 'e1', 'u1');

    expect(db.reservationExtra.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
  });
});

// ═══════════════════════════════════════════════════════
// bulkAssignExtras
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — bulkAssignExtras()', () => {
  it('deletes all existing extras then assigns new ones', async () => {
    db.reservationExtra.deleteMany.mockResolvedValue({ count: 2 });
    // Setup for assignExtra inner call
    db.reservation.findUnique.mockResolvedValue(RESERVATION);
    db.serviceItem.findUnique.mockResolvedValue(ITEM_FLAT);
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 500 });
    // For getReservationExtras call at the end
    db.reservationExtra.findMany.mockResolvedValue([{ totalPrice: 500 }]);

    const result = await svc.bulkAssignExtras(
      'r1',
      { extras: [{ serviceItemId: 'i1' }] } as any,
      'u1'
    );

    expect(db.reservationExtra.deleteMany).toHaveBeenCalledWith({ where: { reservationId: 'r1' } });
    expect(db.reservationExtra.create).toHaveBeenCalled();
    expect(result.count).toBe(1);
  });
});
