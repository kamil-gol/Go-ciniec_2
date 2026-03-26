/**
 * Unit tests for service-extras/reservation-extras.service.ts
 * Covers: getReservationExtras, assignExtra, updateReservationExtra, removeReservationExtra
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    reservation: { findUnique: jest.fn() },
    reservationExtra: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    serviceItem: { findUnique: jest.fn() },
  },
}));

jest.mock('../../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ quantity: 'changed' }),
}));

jest.mock('../../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

import {
  getReservationExtras,
  assignExtra,
  updateReservationExtra,
  removeReservationExtra,
} from '../../../../services/service-extras/reservation-extras.service';
import { prisma } from '../../../../lib/prisma';
import { logChange } from '../../../../utils/audit-logger';
import { recalculateReservationTotalPrice } from '../../../../utils/recalculate-price';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// getReservationExtras
// ===============================================================

describe('getReservationExtras', () => {
  it('returns extras with total price', async () => {
    db.reservation.findUnique.mockResolvedValue({ id: 'r1' });
    db.reservationExtra.findMany.mockResolvedValue([
      { id: 'e1', totalPrice: 500 },
      { id: 'e2', totalPrice: 300 },
    ]);

    const result = await getReservationExtras('r1');

    expect(result.count).toBe(2);
    expect(result.totalExtrasPrice).toBe(800);
  });

  it('throws when reservation not found', async () => {
    db.reservation.findUnique.mockResolvedValue(null);

    await expect(getReservationExtras('r-missing')).rejects.toThrow('Nie znaleziono rezerwacji');
  });
});

// ===============================================================
// assignExtra
// ===============================================================

describe('assignExtra', () => {
  const mockReservation = { id: 'r1', adults: 80, children: 20 };
  const mockItem = {
    id: 'si1',
    name: 'DJ',
    isActive: true,
    priceType: 'FLAT',
    basePrice: 2000,
    requiresNote: false,
    categoryId: 'c1',
    category: { id: 'c1', name: 'Music', isExclusive: false },
  };

  it('assigns extra to reservation', async () => {
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue(mockItem);
    db.reservationExtra.findFirst.mockResolvedValue(null); // not already assigned
    db.reservationExtra.create.mockResolvedValue({ id: 'e1', totalPrice: 2000 });

    const result = await assignExtra('r1', { serviceItemId: 'si1' } as any, 'u1');

    expect(result.id).toBe('e1');
    expect(recalculateReservationTotalPrice).toHaveBeenCalledWith('r1');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entityType: 'RESERVATION_EXTRA' }),
    );
  });

  it('throws when reservation not found', async () => {
    db.reservation.findUnique.mockResolvedValue(null);

    await expect(assignExtra('r-missing', { serviceItemId: 'si1' } as any, 'u1'))
      .rejects.toThrow('Nie znaleziono rezerwacji');
  });

  it('throws when service item not found', async () => {
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue(null);

    await expect(assignExtra('r1', { serviceItemId: 'si-missing' } as any, 'u1'))
      .rejects.toThrow('Nie znaleziono pozycji');
  });

  it('throws when item is inactive', async () => {
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue({ ...mockItem, isActive: false });

    await expect(assignExtra('r1', { serviceItemId: 'si1' } as any, 'u1'))
      .rejects.toThrow('nieaktywna');
  });

  it('throws when note required but missing', async () => {
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue({ ...mockItem, requiresNote: true, noteLabel: 'Szczegoly' });

    await expect(assignExtra('r1', { serviceItemId: 'si1' } as any, 'u1'))
      .rejects.toThrow('wymagane');
  });

  it('throws when PER_UNIT without quantity', async () => {
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue({ ...mockItem, priceType: 'PER_UNIT' });

    await expect(assignExtra('r1', { serviceItemId: 'si1' } as any, 'u1'))
      .rejects.toThrow('ilości');
  });

  it('throws when item already assigned', async () => {
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue(mockItem);
    db.reservationExtra.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(assignExtra('r1', { serviceItemId: 'si1' } as any, 'u1'))
      .rejects.toThrow('jest już dodana');
  });

  it('replaces item in exclusive category', async () => {
    const exclusiveItem = {
      ...mockItem,
      category: { id: 'c1', name: 'Tort', isExclusive: true },
    };
    db.reservation.findUnique.mockResolvedValue(mockReservation);
    db.serviceItem.findUnique.mockResolvedValue(exclusiveItem);
    db.reservationExtra.findMany.mockResolvedValue([{ id: 'old-e1', serviceItem: { name: 'Old Tort' } }]);
    db.reservationExtra.deleteMany.mockResolvedValue({});
    db.reservationExtra.findFirst.mockResolvedValue(null);
    db.reservationExtra.create.mockResolvedValue({ id: 'e-new', totalPrice: 2000 });

    await assignExtra('r1', { serviceItemId: 'si1' } as any, 'u1');

    expect(db.reservationExtra.deleteMany).toHaveBeenCalled();
  });
});

// ===============================================================
// updateReservationExtra
// ===============================================================

describe('updateReservationExtra', () => {
  it('updates extra and recalculates', async () => {
    db.reservationExtra.findFirst.mockResolvedValue({
      id: 'e1',
      reservationId: 'r1',
      quantity: 1,
      unitPrice: 100,
      priceType: 'FLAT',
      serviceItem: { name: 'DJ', basePrice: 100 },
    });
    db.reservation.findUnique.mockResolvedValue({ id: 'r1', adults: 80, children: 20 });
    db.reservationExtra.update.mockResolvedValue({ id: 'e1', quantity: 2 });

    const result = await updateReservationExtra('r1', 'e1', { quantity: 2 } as any, 'u1');

    expect(result.quantity).toBe(2);
    expect(recalculateReservationTotalPrice).toHaveBeenCalledWith('r1');
  });

  it('throws when extra not found', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(null);

    await expect(updateReservationExtra('r1', 'e-missing', {} as any, 'u1'))
      .rejects.toThrow('Nie znaleziono dodatku');
  });

  it('throws for invalid status', async () => {
    db.reservationExtra.findFirst.mockResolvedValue({
      id: 'e1',
      reservationId: 'r1',
      quantity: 1,
      unitPrice: 100,
      priceType: 'FLAT',
      serviceItem: { name: 'DJ', basePrice: 100 },
    });
    db.reservation.findUnique.mockResolvedValue({ id: 'r1', adults: 80, children: 20 });

    await expect(updateReservationExtra('r1', 'e1', { status: 'INVALID' } as any, 'u1'))
      .rejects.toThrow('Nieprawidłowy status');
  });
});

// ===============================================================
// removeReservationExtra
// ===============================================================

describe('removeReservationExtra', () => {
  it('removes extra and recalculates', async () => {
    db.reservationExtra.findFirst.mockResolvedValue({
      id: 'e1',
      reservationId: 'r1',
      serviceItem: { name: 'DJ' },
      totalPrice: 2000,
    });
    db.reservationExtra.delete.mockResolvedValue({});

    await removeReservationExtra('r1', 'e1', 'u1');

    expect(db.reservationExtra.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    expect(recalculateReservationTotalPrice).toHaveBeenCalledWith('r1');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE', entityType: 'RESERVATION_EXTRA' }),
    );
  });

  it('throws when extra not found', async () => {
    db.reservationExtra.findFirst.mockResolvedValue(null);

    await expect(removeReservationExtra('r1', 'e-missing', 'u1'))
      .rejects.toThrow('Nie znaleziono dodatku');
  });
});
