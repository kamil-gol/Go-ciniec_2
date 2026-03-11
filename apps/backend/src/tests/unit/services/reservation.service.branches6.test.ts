/**
 * reservation.service - updateReservation: manual price recalculation (no menu package)
 *
 * WAZNE: updateReservation() nie ustawia totalPrice bezposrednio w prisma.update.data.
 * Zamiast tego wywoluje recalculateReservationTotalPrice(id) po update.
 * Dlatego sprawdzamy wywolanie recalculate, a nie data.totalPrice.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@test.pl' }) },
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn(),
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../services/audit-log.service', () => ({
  auditLogService: { log: jest.fn() },
}));

jest.mock('../../../services/email.service', () => ({
  emailService: {
    sendReservationConfirmation: jest.fn(),
    sendReservationCancellation: jest.fn(),
  },
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  default: {
    recalculateForGuestChange: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { recalculateReservationTotalPrice } from '../../../utils/recalculate-price';
import { reservationService } from '../../../services/reservation.service';

const mockPrisma = prisma as any;
const mockRecalculate = recalculateReservationTotalPrice as jest.Mock;

const BASE_RES = {
  id: 'res-001',
  hallId: 'hall-1',
  eventTypeId: 'et-1',
  menuPackageId: null,
  adults: 50,
  children: 10,
  toddlers: 5,
  guests: 65,
  pricePerAdult: 200,
  pricePerChild: 100,
  pricePerToddler: 50,
  totalPrice: 12000,
  status: 'PENDING',
  date: new Date('2026-06-15'),
  startTime: '16:00',
  endTime: '23:00',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski' },
  hall: { id: 'hall-1', name: 'Sala A', isActive: true, capacity: 100, isWholeVenue: false, allowMultipleBookings: false, allowWithWholeVenue: false },
  eventType: { id: 'et-1', name: 'Wesele' },
  menuPackage: null,
  extras: [],
  deposits: [],
  menuSnapshot: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RES);
  mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RES });
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.pl' });
  mockRecalculate.mockResolvedValue(undefined);
});

describe('updateReservation - manual price recalculation (no menu package)', () => {
  it('should recalculate totalPrice when adults change (no menu)', async () => {
    await reservationService.updateReservation('res-001', {
      adults: 60,
    }, 'user-1');
    // totalPrice nie jest w data bezposrednio - serwis wywoluje recalculate po update
    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.adults).toBe(60);
    // Weryfikujemy ze recalculate bylo wywolane
    expect(mockRecalculate).toHaveBeenCalledWith('res-001');
  });

  it('should recalculate totalPrice when pricePerAdult changes (no menu, no guest change)', async () => {
    await reservationService.updateReservation('res-001', {
      pricePerAdult: 250,
    }, 'user-1');
    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.pricePerAdult).toBe(250);
    expect(mockRecalculate).toHaveBeenCalledWith('res-001');
  });

  it('should recalculate totalPrice when pricePerChild changes', async () => {
    await reservationService.updateReservation('res-001', {
      pricePerChild: 120,
    }, 'user-1');
    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.pricePerChild).toBe(120);
    expect(mockRecalculate).toHaveBeenCalledWith('res-001');
  });

  it('should recalculate totalPrice when pricePerToddler changes', async () => {
    await reservationService.updateReservation('res-001', {
      pricePerToddler: 50,
    }, 'user-1');
    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.pricePerToddler).toBe(50);
    expect(mockRecalculate).toHaveBeenCalledWith('res-001');
  });
});
