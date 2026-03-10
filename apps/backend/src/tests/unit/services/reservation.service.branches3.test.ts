/**
 * ReservationService — Branch coverage phase 3
 * Covers remaining uncovered branches:
 *   - hall.isActive = false guard
 *   - client not found guard
 *   - menuPackage.minGuests check
 *   - menuPackage.maxGuests check
 *   - discount PERCENTAGE > 100
 *   - discount AMOUNT > totalPrice
 * FIX: spolonizowane komunikaty błędów
 */
jest.mock('../../../lib/prisma', () => {
  const mockPrisma: any = {
    reservation: {
      findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(),
      create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
      count: jest.fn(),
    },
    hall: { findUnique: jest.fn(), findFirst: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      create: jest.fn(), update: jest.fn(), delete: jest.fn(),
      findUnique: jest.fn(),
    },
    deposit: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn() },
    $transaction: jest.fn((fn: any) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
  };
  return { prisma: mockPrisma };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/reservation.utils', () => ({
  calculateTotalGuests: jest.fn((a: number, c: number, t: number) => a + c + t),
  calculateTotalPrice: jest.fn((...args: number[]) => args[0] * args[2] + args[1] * args[3]),
  validateConfirmationDeadline: jest.fn().mockReturnValue(true),
  validateCustomEventFields: jest.fn().mockReturnValue({ valid: true }),
  detectReservationChanges: jest.fn().mockReturnValue([]),
  formatChangesSummary: jest.fn().mockReturnValue(''),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  default: { recalculateForGuestChange: jest.fn() },
}));

import { ReservationService } from '../../../services/reservation.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
let service: ReservationService;
const UID = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
  mockPrisma.user.findUnique.mockResolvedValue({ id: UID, email: 'a@b.com' });
  service = new ReservationService();
});

const future = new Date(Date.now() + 86400000 * 30).toISOString();
const futureEnd = new Date(Date.now() + 86400000 * 30 + 3600000 * 4).toISOString();

const base: any = {
  hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
  startDateTime: future, endDateTime: futureEnd,
  adults: 50, children: 10, toddlers: 5,
  pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
};

describe('ReservationService — hall.isActive = false', () => {
  it('should throw when hall is inactive', async () => {
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: false, capacity: 200 });
    await expect(service.createReservation(base, UID)).rejects.toThrow('Sala jest nieaktywna');
  });
});

describe('ReservationService — client not found', () => {
  it('should throw when client does not exist', async () => {
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, capacity: 200 });
    mockPrisma.client.findUnique.mockResolvedValue(null);
    await expect(service.createReservation(base, UID)).rejects.toThrow('Nie znaleziono klienta');
  });
});

describe('ReservationService — menuPackage guest limits', () => {
  const setup = () => {
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, capacity: 500 });
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Wedding' });
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findFirst.mockResolvedValue(null);
  };

  it('should throw when guests < minGuests', async () => {
    setup();
    mockPrisma.menuPackage.findUnique.mockResolvedValue({
      id: 'pkg-1', menuTemplateId: 'tmpl-1', name: 'Big',
      description: '', pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
      minGuests: 100, maxGuests: null,
      menuTemplate: { name: 'T', variant: 'STD' }, packageOptions: [],
    });
    await expect(service.createReservation(
      { ...base, menuPackageId: 'pkg-1', adults: 20, children: 5, toddlers: 0 }, UID
    )).rejects.toThrow('minimum 100 gości');
  });

  it('should throw when guests > maxGuests', async () => {
    setup();
    mockPrisma.menuPackage.findUnique.mockResolvedValue({
      id: 'pkg-1', menuTemplateId: 'tmpl-1', name: 'Small',
      description: '', pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
      minGuests: null, maxGuests: 30,
      menuTemplate: { name: 'T', variant: 'STD' }, packageOptions: [],
    });
    await expect(service.createReservation(
      { ...base, menuPackageId: 'pkg-1', adults: 50, children: 10, toddlers: 5 }, UID
    )).rejects.toThrow('maksimum 30 gości');
  });
});

describe('ReservationService — discount edge cases', () => {
  const setup = () => {
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, capacity: 200 });
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'Jan', lastName: 'K' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Wedding' });
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findFirst.mockResolvedValue(null);
  };

  it('should throw when PERCENTAGE discount > 100', async () => {
    setup();
    await expect(service.createReservation({
      ...base,
      discountType: 'PERCENTAGE', discountValue: 150,
      discountReason: 'Special promo for VIP',
    }, UID)).rejects.toThrow('nie może przekroczyć 100%');
  });

  it('should throw when AMOUNT discount > totalPrice', async () => {
    setup();
    await expect(service.createReservation({
      ...base,
      adults: 1, children: 0, toddlers: 0,
      pricePerAdult: 100, pricePerChild: 0,
      discountType: 'AMOUNT', discountValue: 99999,
      discountReason: 'Special promo for VIP',
    }, UID)).rejects.toThrow('nie może przekroczyć ceny');
  });
});
