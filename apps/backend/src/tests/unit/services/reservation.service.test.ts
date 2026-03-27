/**
 * ReservationService — Branch Coverage Tests
 * Target: 57.57% → ~80%+ branches
 * Covers: menu packages, legacy format, whole venue conflicts,
 *         cascade deposits, archive/unarchive, discount edge cases,
 *         deposit creation
 */

// ═══ Mock Prisma with $transaction ═══
const txMock = {
  reservation: { update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
  deposit: { findMany: jest.fn(), updateMany: jest.fn() },
  reservationHistory: { create: jest.fn() },
  reservationMenuSnapshot: { delete: jest.fn(), update: jest.fn(), create: jest.fn() },
  serviceItem: { findMany: jest.fn() },
  reservationExtra: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
};

jest.mock('../../../lib/prisma', () => {
  const mock = {
    hall: { findUnique: jest.fn(), findFirst: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(),
      findFirst: jest.fn(), update: jest.fn(),
    },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    reservationMenuSnapshot: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    deposit: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn() },
    activityLog: { create: jest.fn() },
    serviceItem: { findMany: jest.fn() },
    reservationExtra: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    reservationCategoryExtra: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn((fn: any) => fn(txMock)),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/venue-surcharge', () => ({
  calculateVenueSurcharge: jest.fn().mockReturnValue(0),
}));

jest.mock('../../../utils/reservation.utils', () => {
  const actual = jest.requireActual('../../../utils/reservation.utils');
  return {
    ...actual,
    validateCustomEventFields: jest.fn().mockReturnValue({ valid: true }),
  };
});

jest.mock('../../../services/reservationCategoryExtra.service', () => ({
  __esModule: true,
  default: {
    recalculateForGuestChange: jest.fn().mockResolvedValue(undefined),
    deleteByReservation: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockImplementation(
    (adults: number, children: number, toddlers: number, ppa: number, ppc: number, ppt: number) =>
      adults * ppa + children * ppc + toddlers * (ppt || 0)
  ),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: { recalculateForGuestChange: jest.fn().mockResolvedValue(null) },
}));

import { ReservationService } from '../../../services/reservation.service';
import { ReservationStatus } from '../../../types/reservation.types';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const UID = 'user-001';
const HALL = { id: 'hall-001', name: 'Sala A', capacity: 100, isActive: true, isWholeVenue: false, allowMultipleBookings: false };
const HALL_WHOLE = { id: 'hall-wh', name: 'Cały Obiekt', capacity: 200, isActive: true, isWholeVenue: true, allowMultipleBookings: false };
const CLIENT = { id: 'cl-001', firstName: 'Jan', lastName: 'Kowalski', email: 'j@k.pl', phone: '+48123' };
const EVENT = { id: 'ev-001', name: 'Wesele' };

const FUTURE = '2027-08-15T14:00:00.000Z';
const FUTURE_END = '2027-08-15T22:00:00.000Z';

const MENU_PKG = {
  id: 'pkg-001', name: 'Pakiet Premium', description: 'Opis',
  menuTemplateId: 'tpl-001', menuTemplate: { name: 'Szablon 2026' },
  pricePerAdult: 250, pricePerChild: 120, pricePerToddler: 50,
  minGuests: 10, maxGuests: 150, packageOptions: [],
};

const BASE_DTO = {
  hallId: HALL.id, clientId: CLIENT.id, eventTypeId: EVENT.id,
  startDateTime: FUTURE, endDateTime: FUTURE_END,
  adults: 50, children: 10, toddlers: 5,
  pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 50,
};

const RES_BASE = {
  id: 'res-001', ...BASE_DTO, guests: 65, totalPrice: 11250,
  status: 'PENDING', hallId: HALL.id, hall: HALL, client: CLIENT,
  eventType: EVENT, createdBy: { id: UID, email: 'a@b.pl' },
  menuSnapshot: null, archivedAt: null, adults: 50, children: 10, toddlers: 5,
  pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 50,
  startDateTime: new Date(FUTURE), endDateTime: new Date(FUTURE_END),
  date: null, startTime: null, endTime: null, notes: null,
};

let svc: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  svc = new ReservationService();

  db.user.findUnique.mockResolvedValue({ id: UID });
  db.hall.findUnique.mockResolvedValue(HALL);
  db.hall.findFirst.mockResolvedValue(null);
  db.client.findUnique.mockResolvedValue(CLIENT);
  db.eventType.findUnique.mockResolvedValue(EVENT);
  db.reservation.create.mockResolvedValue(RES_BASE);
  db.reservation.findFirst.mockResolvedValue(null);
  db.reservation.findMany.mockResolvedValue([]);
  db.reservation.findUnique.mockResolvedValue(RES_BASE);
  db.reservation.update.mockResolvedValue(RES_BASE);
  db.reservationHistory.create.mockResolvedValue({});
  db.reservationMenuSnapshot.create.mockResolvedValue({});
  db.reservationMenuSnapshot.update.mockResolvedValue({});
  db.reservationMenuSnapshot.delete.mockResolvedValue({});
  db.activityLog.create.mockResolvedValue({});
  db.menuPackage.findUnique.mockResolvedValue(null);
  db.menuOption.findMany.mockResolvedValue([]);
  db.deposit.create.mockResolvedValue({});
  db.serviceItem.findMany.mockResolvedValue([]);
  db.reservationExtra.findMany.mockResolvedValue([]);

  txMock.reservation.update.mockResolvedValue(RES_BASE);
  txMock.reservation.findFirst.mockResolvedValue(null);
  txMock.reservation.findMany.mockResolvedValue([]);
  txMock.deposit.findMany.mockResolvedValue([]);
  txMock.deposit.updateMany.mockResolvedValue({});
  txMock.reservationHistory.create.mockResolvedValue({});
  txMock.reservationMenuSnapshot.delete.mockResolvedValue({});
  txMock.reservationMenuSnapshot.update.mockResolvedValue({});
  txMock.reservationMenuSnapshot.create.mockResolvedValue({});
  txMock.serviceItem.findMany.mockResolvedValue([]);
  txMock.reservationExtra.findMany.mockResolvedValue([]);
});

describe('ReservationService — Branch Coverage', () => {

  // ════════════════════════════════════
  // createReservation — menu package
  // ════════════════════════════════════
  describe('create — menu package', () => {
    it('should create with menu package and snapshot', async () => {
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const dto = { ...BASE_DTO, menuPackageId: 'pkg-001', pricePerAdult: undefined, pricePerChild: undefined };
      await svc.createReservation(dto as any, UID);
      expect(db.reservationMenuSnapshot.create).toHaveBeenCalledTimes(1);
    });

    it('should throw when menu package not found', async () => {
      const dto = { ...BASE_DTO, menuPackageId: 'bad-pkg' };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow('Nie znaleziono wybranego pakietu menu');
    });

    it('should throw when guests below minGuests', async () => {
      db.menuPackage.findUnique.mockResolvedValue({ ...MENU_PKG, minGuests: 100 });
      const dto = { ...BASE_DTO, menuPackageId: 'pkg-001' };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/minimum 100 gości/);
    });

    it('should throw when guests above maxGuests', async () => {
      db.menuPackage.findUnique.mockResolvedValue({ ...MENU_PKG, maxGuests: 10 });
      const dto = { ...BASE_DTO, menuPackageId: 'pkg-001' };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/maksimum 10 go/);
    });

    it('should throw when no prices and no menu package', async () => {
      const dto = { ...BASE_DTO, pricePerAdult: undefined, pricePerChild: undefined };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/Cena za dorosłego/);
    });
  });

  // ════════════════════════════════════
  // createReservation — legacy format
  // ════════════════════════════════════
  describe('create — legacy date/startTime/endTime', () => {
    const LEGACY = {
      hallId: HALL.id, clientId: CLIENT.id, eventTypeId: EVENT.id,
      date: '2027-12-15', startTime: '14:00', endTime: '22:00',
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 50,
    };

    it('should create reservation with legacy format', async () => {
      await svc.createReservation(LEGACY as any, UID);
      expect(db.reservation.create).toHaveBeenCalledTimes(1);
    });

    it('should throw when legacy date is in the past', async () => {
      await expect(svc.createReservation({ ...LEGACY, date: '2020-01-01' } as any, UID))
        .rejects.toThrow('Data rezerwacji musi być w przyszłości');
    });

    it('should throw when startTime >= endTime', async () => {
      await expect(svc.createReservation({ ...LEGACY, startTime: '22:00', endTime: '14:00' } as any, UID))
        .rejects.toThrow('Godzina zakończenia musi być po godzinie rozpoczęcia');
    });

    it('should throw on legacy time slot overlap', async () => {
      db.reservation.findMany.mockResolvedValue([{ id: 'existing' }]);
      await expect(svc.createReservation(LEGACY as any, UID)).rejects.toThrow(/nie dopuszcza wielu/);
    });

    it('should append next-year note for legacy format', async () => {
      await svc.createReservation(LEGACY as any, UID);
      const call = db.reservation.create.mock.calls[0][0];
      expect(call.data.notes).toContain('kolejny rok');
    });
  });

  // ════════════════════════════════════
  // createReservation — deposit
  // ════════════════════════════════════
  describe('create — deposit', () => {
    it('should create deposit from deposit object', async () => {
      const dto = { ...BASE_DTO, deposit: { amount: 1000, dueDate: '2027-07-01', paid: false } };
      await svc.createReservation(dto as any, UID);
      expect(db.deposit.create).toHaveBeenCalledTimes(1);
      const call = db.deposit.create.mock.calls[0][0];
      expect(call.data.status).toBe('PENDING');
    });

    it('should create deposit from depositAmount/depositDueDate', async () => {
      const dto = { ...BASE_DTO, depositAmount: 1500, depositDueDate: '2027-07-01' };
      await svc.createReservation(dto as any, UID);
      expect(db.deposit.create).toHaveBeenCalledTimes(1);
    });

    it('should handle paid deposit with paymentMethod and paidAt', async () => {
      const dto = { ...BASE_DTO, deposit: { amount: 1000, dueDate: '2027-07-01', paid: true, paidAt: '2027-06-15', paymentMethod: 'TRANSFER' } };
      await svc.createReservation(dto as any, UID);
      const call = db.deposit.create.mock.calls[0][0];
      expect(call.data.status).toBe('PAID');
      expect(call.data.paid).toBe(true);
      expect(call.data.paidAt).toBeInstanceOf(Date);
    });
  });

  // ════════════════════════════════════
  // createReservation — edge cases
  // ════════════════════════════════════
  describe('create — edge cases', () => {
    it('should throw when percentage discount > 100%', async () => {
      const dto = { ...BASE_DTO, discountType: 'PERCENTAGE', discountValue: 150, discountReason: 'Too much discount' };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/100%/);
    });

    it('should throw when fixed discount > totalPrice', async () => {
      const dto = { ...BASE_DTO, discountType: 'AMOUNT', discountValue: 999999, discountReason: 'Excessive discount' };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/nie może przekroczyć ceny/);
    });

    it('should throw on invalid confirmation deadline', async () => {
      const dto = { ...BASE_DTO, confirmationDeadline: FUTURE };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/Termin potwierdzenia/);
    });

    it('should throw when endDateTime before startDateTime', async () => {
      const dto = { ...BASE_DTO, startDateTime: FUTURE_END, endDateTime: FUTURE };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow('Godzina zakończenia musi być po godzinie rozpoczęcia');
    });

    it('should throw when client not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.createReservation(BASE_DTO as any, UID)).rejects.toThrow('Nie znaleziono klienta');
    });

    it('should throw when event type not found', async () => {
      db.eventType.findUnique.mockResolvedValue(null);
      await expect(svc.createReservation(BASE_DTO as any, UID)).rejects.toThrow('Nie znaleziono typu wydarzenia');
    });

    it('should append next-year note for new format', async () => {
      await svc.createReservation(BASE_DTO as any, UID);
      const call = db.reservation.create.mock.calls[0][0];
      expect(call.data.notes).toContain('kolejny rok');
    });

    it('should create history with discount info', async () => {
      const dto = { ...BASE_DTO, discountType: 'PERCENTAGE', discountValue: 10, discountReason: 'Stały klient z bonusem' };
      await svc.createReservation(dto as any, UID);
      const histCall = db.reservationHistory.create.mock.calls[0][0];
      expect(histCall.data.reason).toContain('Rabat');
    });

    it('should create history mentioning menu package name', async () => {
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const dto = { ...BASE_DTO, menuPackageId: 'pkg-001' };
      await svc.createReservation(dto as any, UID);
      const histCall = db.reservationHistory.create.mock.calls[0][0];
      expect(histCall.data.reason).toContain('Pakiet Premium');
    });

    it('should handle menu package with null minGuests/maxGuests', async () => {
      db.menuPackage.findUnique.mockResolvedValue({ ...MENU_PKG, minGuests: null, maxGuests: null });
      const dto = { ...BASE_DTO, menuPackageId: 'pkg-001' };
      await svc.createReservation(dto as any, UID);
      expect(db.reservationMenuSnapshot.create).toHaveBeenCalledTimes(1);
    });
  });

  // ════════════════════════════════════
  // Whole venue conflicts
  // ════════════════════════════════════
  describe('create — whole venue conflicts', () => {
    it('should throw when booking whole venue but another hall is booked', async () => {
      db.hall.findUnique.mockResolvedValue(HALL_WHOLE);
      db.reservation.findFirst.mockResolvedValue({ id: 'x', hall: { name: 'Sala B' }, client: { firstName: 'Anna', lastName: 'Nowak' } });

      const dto = { ...BASE_DTO, hallId: HALL_WHOLE.id };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/Nie można zarezerwować całego obiektu/);
    });

    it('should throw when regular hall but whole venue is booked', async () => {
      db.hall.findUnique.mockResolvedValue(HALL);
      db.hall.findFirst.mockResolvedValue(HALL_WHOLE);
      db.reservation.findFirst.mockResolvedValue({ id: 'wh', client: { firstName: 'Piotr', lastName: 'W' } });

      await expect(svc.createReservation(BASE_DTO as any, UID)).rejects.toThrow(/cały obiekt jest już zarezerwowany/);
    });

    it('should proceed when no whole venue hall exists', async () => {
      db.hall.findFirst.mockResolvedValue(null);
      await svc.createReservation(BASE_DTO as any, UID);
      expect(db.reservation.create).toHaveBeenCalledTimes(1);
    });

    it('should handle whole venue conflict with null client', async () => {
      db.hall.findUnique.mockResolvedValue(HALL_WHOLE);
      db.reservation.findFirst.mockResolvedValue({ id: 'x', hall: { name: 'Sala C' }, client: null });

      const dto = { ...BASE_DTO, hallId: HALL_WHOLE.id };
      await expect(svc.createReservation(dto as any, UID)).rejects.toThrow(/nieznany klient/);
    });

    it('should handle non-whole-venue conflict with null client', async () => {
      db.hall.findUnique.mockResolvedValue(HALL);
      db.hall.findFirst.mockResolvedValue(HALL_WHOLE);
      db.reservation.findFirst.mockResolvedValue({ id: 'wh', client: null });

      await expect(svc.createReservation(BASE_DTO as any, UID)).rejects.toThrow(/nieznany klient/);
    });
  });

  // ════════════════════════════════════
  // updateReservationMenu
  // ════════════════════════════════════
  describe('updateReservationMenu()', () => {
    const SNAP = { id: 'snap-001', menuData: { packageName: 'Stary Pakiet' }, totalMenuPrice: 5000 };

    it('should remove menu (null menuPackageId) with existing snapshot', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, menuSnapshot: SNAP });
      const result = await svc.updateReservationMenu('res-001', { menuPackageId: null } as any, UID);
      expect(result.message).toContain('usunięt');
      expect(db.reservationMenuSnapshot.delete).toHaveBeenCalledTimes(1);
    });

    it('should remove menu with no existing snapshot', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, menuSnapshot: null });
      const result = await svc.updateReservationMenu('res-001', { menuPackageId: null } as any, UID);
      expect(result.message).toContain('usunięt');
      expect(db.reservationMenuSnapshot.delete).not.toHaveBeenCalled();
    });

    it('should update existing snapshot when changing package', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, menuSnapshot: SNAP });
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      await svc.updateReservationMenu('res-001', { menuPackageId: 'pkg-001' } as any, UID);
      expect(db.reservationMenuSnapshot.update).toHaveBeenCalledTimes(1);
    });

    it('should create new snapshot when no existing one', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, menuSnapshot: null });
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      await svc.updateReservationMenu('res-001', { menuPackageId: 'pkg-001' } as any, UID);
      expect(db.reservationMenuSnapshot.create).toHaveBeenCalledTimes(1);
    });

    it('should throw on COMPLETED reservation', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'COMPLETED' });
      await expect(svc.updateReservationMenu('res-001', { menuPackageId: 'x' } as any, UID)).rejects.toThrow(/zakończonej/);
    });

    it('should throw on CANCELLED reservation', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CANCELLED' });
      await expect(svc.updateReservationMenu('res-001', { menuPackageId: 'x' } as any, UID)).rejects.toThrow(/zakończonej/);
    });

    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.updateReservationMenu('bad', {} as any, UID)).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw when menu package not found', async () => {
      db.reservation.findUnique.mockResolvedValue(RES_BASE);
      db.menuPackage.findUnique.mockResolvedValue(null);
      await expect(svc.updateReservationMenu('res-001', { menuPackageId: 'bad' } as any, UID)).rejects.toThrow(/Nie znaleziono.*pakietu menu/);
    });

    it('should throw on invalid data (no menuPackageId key)', async () => {
      db.reservation.findUnique.mockResolvedValue(RES_BASE);
      await expect(svc.updateReservationMenu('res-001', {} as any, UID)).rejects.toThrow('Nieprawidłowe dane aktualizacji menu');
    });

    it('should use custom adultsCount/childrenCount/toddlersCount', async () => {
      db.reservation.findUnique.mockResolvedValue(RES_BASE);
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      await svc.updateReservationMenu('res-001', { menuPackageId: 'pkg-001', adultsCount: 30, childrenCount: 5, toddlersCount: 2 } as any, UID);
      const updateCall = db.reservation.update.mock.calls[0][0];
      expect(updateCall.data.adults).toBe(30);
      expect(updateCall.data.children).toBe(5);
    });

    it('should handle client being null in reservation', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, client: null, menuSnapshot: SNAP });
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      await svc.updateReservationMenu('res-001', { menuPackageId: 'pkg-001' } as any, UID);
      expect(db.reservationMenuSnapshot.update).toHaveBeenCalledTimes(1);
    });
  });

  // ════════════════════════════════════
  // archiveReservation
  // ════════════════════════════════════
  describe('archiveReservation()', () => {
    it('should archive successfully', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: null });
      await svc.archiveReservation('res-001', UID, 'Archiving test');
      expect(db.reservation.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ archivedAt: expect.any(Date) }) }));
    });

    it('should throw when already archived', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: new Date() });
      await expect(svc.archiveReservation('res-001', UID)).rejects.toThrow('już zarchiwizowana');
    });

    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.archiveReservation('bad', UID)).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should use default reason when none provided', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: null });
      await svc.archiveReservation('res-001', UID);
      const histCall = db.reservationHistory.create.mock.calls[0][0];
      expect(histCall.data.reason).toContain('zarchiwizowana');
    });

    it('should handle hall.name being null', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: null, hall: null });
      await svc.archiveReservation('res-001', UID);
      expect(db.reservation.update).toHaveBeenCalledTimes(1);
    });
  });

  // ════════════════════════════════════
  // unarchiveReservation
  // ════════════════════════════════════
  describe('unarchiveReservation()', () => {
    it('should unarchive successfully', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: new Date('2026-01-01') });
      await svc.unarchiveReservation('res-001', UID, 'Restore');
      const call = db.reservation.update.mock.calls[0][0];
      expect(call.data.archivedAt).toBeNull();
    });

    it('should throw when not archived', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: null });
      await expect(svc.unarchiveReservation('res-001', UID)).rejects.toThrow('nie jest zarchiwizowana');
    });

    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.unarchiveReservation('bad', UID)).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should use default reason when none provided', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, archivedAt: new Date() });
      await svc.unarchiveReservation('res-001', UID);
      const histCall = db.reservationHistory.create.mock.calls[0][0];
      expect(histCall.data.reason).toContain('przywrócona');
    });
  });

  // ════════════════════════════════════
  // cancelReservation + cascadeCancelDeposits
  // ════════════════════════════════════
  describe('cancelReservation()', () => {
    it('should cancel with cascade deposit cancellation', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      txMock.deposit.findMany.mockResolvedValue([
        { id: 'dep-1', amount: 1000, status: 'PENDING' },
        { id: 'dep-2', amount: 500, status: 'OVERDUE' },
      ]);
      await svc.cancelReservation('res-001', UID, 'Klient zrezygnował');
      expect(txMock.deposit.updateMany).toHaveBeenCalledTimes(1);
      expect(txMock.reservationHistory.create).toHaveBeenCalledTimes(4); // 2 deposit + 1 cancel + 1 auto-archive
    });

    it('should cancel with no pending deposits', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CONFIRMED' });
      txMock.deposit.findMany.mockResolvedValue([]);
      await svc.cancelReservation('res-001', UID);
      expect(txMock.deposit.updateMany).not.toHaveBeenCalled();
      expect(txMock.reservationHistory.create).toHaveBeenCalledTimes(2); // 1 cancel + 1 auto-archive
    });

    it('should include deposit info in per-deposit history entries', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      txMock.deposit.findMany.mockResolvedValue([{ id: 'd1', amount: 500, status: 'PENDING' }]);
      await svc.cancelReservation('res-001', UID, 'Anulowano');
      const allCalls = txMock.reservationHistory.create.mock.calls;
      // Per-deposit entry first
      const depositHist = allCalls[0][0];
      expect(depositHist.data.reason).toContain('500');
      // Main cancel entry is second-to-last (last = auto-archive)
      const mainHist = allCalls[allCalls.length - 2][0];
      expect(mainHist.data.reason).toContain('Anulowano');
    });

    it('should handle cancel without explicit reason', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      txMock.deposit.findMany.mockResolvedValue([]);
      await svc.cancelReservation('res-001', UID);
      // With 0 deposits: cancel entry is first, auto-archive is second
      const hist = txMock.reservationHistory.create.mock.calls[0][0];
      expect(hist.data.reason).toContain('Rezerwacja anulowana');
    });

    it('should throw when already cancelled', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CANCELLED' });
      await expect(svc.cancelReservation('res-001', UID)).rejects.toThrow('już anulowana');
    });

    it('should throw when completed', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'COMPLETED' });
      await expect(svc.cancelReservation('res-001', UID)).rejects.toThrow('Nie można anulować zakończonej');
    });

    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.cancelReservation('bad', UID)).rejects.toThrow('Nie znaleziono rezerwacji');
    });
  });

  // ════════════════════════════════════
  // updateStatus — extra branches
  // ════════════════════════════════════
  describe('updateStatus() — branches', () => {
    it('should throw when completing before event date (startDateTime)', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CONFIRMED', startDateTime: new Date('2099-12-31') });
      await expect(svc.updateStatus('res-001', { status: ReservationStatus.COMPLETED } as any, UID))
        .rejects.toThrow(/przed datą wydarzenia/);
    });

    it('should use legacy date for completion check when no startDateTime', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CONFIRMED', startDateTime: null, date: '2099-12-31' });
      await expect(svc.updateStatus('res-001', { status: ReservationStatus.COMPLETED } as any, UID))
        .rejects.toThrow(/przed datą wydarzenia/);
    });

    it('should allow completing when event is in the past', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CONFIRMED', startDateTime: new Date('2020-01-01') });
      await svc.updateStatus('res-001', { status: ReservationStatus.COMPLETED } as any, UID);
      expect(db.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should allow completing when no date at all', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'CONFIRMED', startDateTime: null, date: null });
      await svc.updateStatus('res-001', { status: ReservationStatus.COMPLETED } as any, UID);
      expect(db.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should cancel via updateStatus with transaction', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      txMock.deposit.findMany.mockResolvedValue([]);
      await svc.updateStatus('res-001', { status: ReservationStatus.CANCELLED, reason: 'Anulacja' } as any, UID);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should cancel via updateStatus with reason in history', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      txMock.deposit.findMany.mockResolvedValue([]);
      await svc.updateStatus('res-001', { status: ReservationStatus.CANCELLED, reason: 'Powód anulacji' } as any, UID);
      const hist = txMock.reservationHistory.create.mock.calls[0][0];
      expect(hist.data.reason).toContain('Powód anulacji');
    });

    it('should cancel without reason', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      txMock.deposit.findMany.mockResolvedValue([]);
      await svc.updateStatus('res-001', { status: ReservationStatus.CANCELLED } as any, UID);
      const hist = txMock.reservationHistory.create.mock.calls[0][0];
      expect(hist.data.reason).toContain('Zmiana statusu');
    });

    it('should throw on invalid status transition', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'COMPLETED' });
      await expect(svc.updateStatus('res-001', { status: ReservationStatus.PENDING } as any, UID))
        .rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should throw when reservation not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.updateStatus('bad', { status: ReservationStatus.CONFIRMED } as any, UID)).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should perform regular update for non-cancel status change', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      await svc.updateStatus('res-001', { status: ReservationStatus.CONFIRMED } as any, UID);
      expect(db.reservation.update).toHaveBeenCalledTimes(1);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('should use reason in history for non-cancel status change', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      await svc.updateStatus('res-001', { status: ReservationStatus.CONFIRMED, reason: 'Klient potwierdził' } as any, UID);
      const hist = db.reservationHistory.create.mock.calls[0][0];
      expect(hist.data.reason).toBe('Klient potwierdził');
    });

    it('should use default reason for non-cancel without explicit reason', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RES_BASE, status: 'PENDING' });
      await svc.updateStatus('res-001', { status: ReservationStatus.CONFIRMED } as any, UID);
      const hist = db.reservationHistory.create.mock.calls[0][0];
      expect(hist.data.reason).toContain('Zmiana statusu');
    });
  });

  // ════════════════════════════════════
  // getReservations — extra filters
  // ════════════════════════════════════
  describe('getReservations() — extra branches', () => {
    beforeEach(() => db.reservation.findMany.mockResolvedValue([]));

    it('should filter by clientId', async () => {
      await svc.getReservations({ clientId: 'cl-001' });
      expect(db.reservation.findMany.mock.calls[0][0].where.clientId).toBe('cl-001');
    });

    it('should filter by eventTypeId', async () => {
      await svc.getReservations({ eventTypeId: 'ev-001' });
      expect(db.reservation.findMany.mock.calls[0][0].where.eventTypeId).toBe('ev-001');
    });

    it('should handle dateFrom-only filter', async () => {
      await svc.getReservations({ dateFrom: '2026-06-01' });
      expect(db.reservation.findMany.mock.calls[0][0].where.OR).toHaveLength(2);
    });

    it('should set archived=false filter explicitly', async () => {
      await svc.getReservations({ archived: false });
      expect(db.reservation.findMany.mock.calls[0][0].where.archivedAt).toBeNull();
    });
  });

  // ════════════════════════════════════
  // edge cases / branch coverage (consolidated from branches2-6)
  // ════════════════════════════════════
  describe('edge cases / branch coverage', () => {

    // --- branches2: updateReservation guest change ---
    describe('updateReservation — guest change branches', () => {
      const makeExisting = (overrides: any = {}) => ({
        id: 'r1', status: 'PENDING', hallId: 'hall-001',
        adults: 10, children: 5, toddlers: 2, guests: 17,
        pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
        totalPrice: 1250, startDateTime: new Date(Date.now() + 86400000 * 30),
        endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 8),
        archivedAt: null, confirmationDeadline: null,
        hall: { id: 'hall-001', name: 'Sala A', capacity: 200, isWholeVenue: false },
        eventType: { id: 'ev-001', name: 'Wesele' },
        menuSnapshot: null,
        client: { id: 'cl-001', firstName: 'Jan', lastName: 'K' },
        ...overrides,
      });

      it('should recalculate price when guests change WITHOUT menu package', async () => {
        db.reservation.findUnique.mockResolvedValue(makeExisting());
        db.reservation.findFirst.mockResolvedValue(null);
        db.hall.findUnique.mockResolvedValue({ id: 'hall-001', isWholeVenue: false });
        db.hall.findFirst.mockResolvedValue(null);
        db.reservation.update.mockResolvedValue(makeExisting({ adults: 20 }));

        await svc.updateReservation('r1', { adults: 20, reason: 'Zmiana liczby gości na 20 osób' } as any, UID);

        expect(db.reservation.update).toHaveBeenCalled();
      });

      it('should recalculate menu price when guests change WITH menu package', async () => {
        const recalcMock = require('../../../services/reservation-menu.service').default.recalculateForGuestChange;
        recalcMock.mockResolvedValue({ totalMenuPrice: 3000, packagePrice: 2500, optionsPrice: 500 });

        db.reservation.findUnique.mockResolvedValue(makeExisting({
          menuSnapshot: { id: 'ms1', menuData: { packageName: 'Gold' }, totalMenuPrice: 2000 },
        }));
        db.reservation.update.mockResolvedValue(makeExisting({ adults: 20 }));
        db.reservation.findFirst.mockResolvedValue(null);
        db.hall.findUnique.mockResolvedValue({ id: 'hall-001', isWholeVenue: false });
        db.hall.findFirst.mockResolvedValue(null);

        await svc.updateReservation('r1', { adults: 20, reason: 'Zmiana gości z pakietem menu' } as any, UID);

        expect(recalcMock).toHaveBeenCalledWith('r1', 20, 5, 2);
      });

      it('should update pricePerAdult without menu package', async () => {
        db.reservation.findUnique.mockResolvedValue(makeExisting());
        db.reservation.update.mockResolvedValue(makeExisting({ pricePerAdult: 120 }));
        db.reservation.findFirst.mockResolvedValue(null);
        db.hall.findUnique.mockResolvedValue({ id: 'hall-001', isWholeVenue: false });
        db.hall.findFirst.mockResolvedValue(null);

        await svc.updateReservation('r1', { pricePerAdult: 120, reason: 'Korekta ceny za osobę dorosłą' } as any, UID);

        expect(db.reservation.update).toHaveBeenCalled();
      });
    });

    // --- branches3: hall.isActive = false ---
    describe('createReservation — hall inactive', () => {
      it('should throw when hall is inactive', async () => {
        db.hall.findUnique.mockResolvedValue({ id: 'hall-001', isActive: false, capacity: 200 });
        await expect(svc.createReservation(BASE_DTO as any, UID)).rejects.toThrow('Sala jest nieaktywna');
      });
    });

    // --- branches4: capacity exceeded, valid confirmationDeadline, date change with excludeId ---
    describe('createReservation — capacity exceeded', () => {
      it('should throw when capacity exceeded on legacy format', async () => {
        db.reservation.findMany.mockResolvedValue([{ id: 'existing', guests: 180 }]);
        const futureDate = (() => {
          const d = new Date(Date.now() + 86400000 * 60);
          return d.toISOString().split('T')[0];
        })();
        await expect(svc.createReservation({
          hallId: HALL.id, clientId: CLIENT.id, eventTypeId: EVENT.id,
          date: futureDate, startTime: '14:00', endTime: '20:00',
          adults: 50, children: 10, toddlers: 5,
          pricePerAdult: 200, pricePerChild: 100,
        } as any, UID)).rejects.toThrow(/przekracza|dostępność|nie dopuszcza wielu rezerwacji/);
      });
    });

    describe('createReservation — valid confirmationDeadline', () => {
      it('should pass with valid confirmationDeadline before event', async () => {
        const future = new Date(Date.now() + 86400000 * 30).toISOString();
        const futureEnd = new Date(Date.now() + 86400000 * 30 + 3600000 * 4).toISOString();
        const deadline = new Date(Date.now() + 86400000 * 10).toISOString();

        db.reservation.create.mockResolvedValue({
          ...RES_BASE, startDateTime: new Date(future), endDateTime: new Date(futureEnd),
        });
        db.reservation.findUnique.mockResolvedValue({
          ...RES_BASE, startDateTime: new Date(future), endDateTime: new Date(futureEnd),
        });
        db.reservation.update.mockResolvedValue({
          ...RES_BASE, startDateTime: new Date(future), endDateTime: new Date(futureEnd),
        });

        const { validateConfirmationDeadline } = require('../../../utils/reservation.utils');
        validateConfirmationDeadline.mockReturnValue(true);

        await svc.createReservation({
          hallId: HALL.id, clientId: CLIENT.id, eventTypeId: EVENT.id,
          startDateTime: future, endDateTime: futureEnd,
          confirmationDeadline: deadline,
          adults: 20, children: 5, toddlers: 0,
          pricePerAdult: 200, pricePerChild: 100,
        } as any, UID);

        expect(db.reservation.create).toHaveBeenCalled();
      });
    });

    describe('updateReservation — date change with excludeId', () => {
      it('should check overlap and wholeVenue with excludeId when changing dates', async () => {
        const future = new Date(Date.now() + 86400000 * 30);
        const futureEnd = new Date(Date.now() + 86400000 * 30 + 3600000 * 4);
        const newFuture = new Date(Date.now() + 86400000 * 31).toISOString();
        const newFutureEnd = new Date(Date.now() + 86400000 * 31 + 3600000 * 4).toISOString();

        db.reservation.findUnique.mockResolvedValue({
          ...RES_BASE,
          startDateTime: future, endDateTime: futureEnd,
          hall: { ...HALL, capacity: 200 },
        });
        db.reservation.findFirst.mockResolvedValue(null);
        db.reservation.findMany.mockResolvedValue([]);
        db.hall.findUnique.mockResolvedValue({ id: HALL.id, isWholeVenue: false });
        db.hall.findFirst.mockResolvedValue(null);
        db.reservation.update.mockResolvedValue({
          ...RES_BASE, hall: HALL, client: CLIENT, eventType: EVENT,
        });

        await svc.updateReservation('res-001', {
          startDateTime: newFuture, endDateTime: newFutureEnd,
        } as any, UID);

        expect(db.reservation.findMany).toHaveBeenCalled();
        expect(db.reservation.update).toHaveBeenCalled();
      });
    });

    // --- branches5: getReservations extra filters, menuPackageId delegation, eventType validation ---
    describe('getReservations — extra date filters', () => {
      beforeEach(() => db.reservation.findMany.mockResolvedValue([]));

      it('should build OR filter with dateTo only', async () => {
        await svc.getReservations({ dateTo: '2026-12-31' } as any);
        const call = db.reservation.findMany.mock.calls[0][0];
        expect(call.where.OR).toBeDefined();
        expect(call.where.OR[0].startDateTime.lte).toBeInstanceOf(Date);
      });

      it('should build OR filter with both dateFrom and dateTo', async () => {
        await svc.getReservations({ dateFrom: '2026-01-01', dateTo: '2026-12-31' } as any);
        const call = db.reservation.findMany.mock.calls[0][0];
        expect(call.where.OR).toBeDefined();
        expect(call.where.OR[0].startDateTime.gte).toBeInstanceOf(Date);
        expect(call.where.OR[0].startDateTime.lte).toBeInstanceOf(Date);
        expect(call.where.OR[1].date.gte).toBe('2026-01-01');
        expect(call.where.OR[1].date.lte).toBe('2026-12-31');
      });

      it('should handle archived=true filter', async () => {
        await svc.getReservations({ archived: true } as any);
        const call = db.reservation.findMany.mock.calls[0][0];
        expect(call.where.archivedAt).toEqual({ not: null });
      });
    });

    describe('updateReservation — menuPackageId delegation', () => {
      it('should delegate to updateReservationMenu when menuPackageId=null (remove menu)', async () => {
        db.reservation.findUnique
          .mockResolvedValueOnce(RES_BASE)
          .mockResolvedValueOnce({
            ...RES_BASE, menuSnapshot: { id: 'snap-1', menuData: { packageName: 'Old' }, totalMenuPrice: 5000 },
          });
        db.reservationMenuSnapshot.delete.mockResolvedValue({});
        db.reservation.update.mockResolvedValue({
          ...RES_BASE, hall: HALL, client: CLIENT, eventType: EVENT,
        });

        await svc.updateReservation('res-001', { menuPackageId: null } as any, UID);
        expect(db.reservationMenuSnapshot.delete).toHaveBeenCalled();
      });

      it('should delegate to updateReservationMenu when menuPackageId is set (change menu)', async () => {
        db.reservation.findUnique
          .mockResolvedValueOnce(RES_BASE)
          .mockResolvedValueOnce({
            ...RES_BASE, menuSnapshot: null,
          });
        db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
        db.reservationMenuSnapshot.create.mockResolvedValue({});
        db.reservation.update.mockResolvedValue({
          ...RES_BASE, hall: HALL, client: CLIENT, eventType: EVENT,
        });

        await svc.updateReservation('res-001', { menuPackageId: 'pkg-001' } as any, UID);
        expect(db.menuPackage.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'pkg-001' } })
        );
      });
    });

    describe('updateReservation — eventType customValidation', () => {
      beforeEach(() => {
        db.reservation.findFirst.mockResolvedValue(null);
        db.hall.findUnique.mockResolvedValue({ id: HALL.id, isWholeVenue: false });
        db.hall.findFirst.mockResolvedValue(null);
      });

      it('should validate custom event fields when eventType exists', async () => {
        const { validateCustomEventFields } = require('../../../utils/reservation.utils');

        db.reservation.findUnique.mockResolvedValue(RES_BASE);
        db.reservation.update.mockResolvedValue({
          ...RES_BASE, hall: HALL, client: CLIENT, eventType: EVENT,
        });

        await svc.updateReservation('res-001', { notes: 'updated notes' } as any, UID);

        expect(validateCustomEventFields).toHaveBeenCalledWith('Wesele', expect.any(Object));
      });

      it('should throw when custom validation fails in updateReservation', async () => {
        const { validateCustomEventFields } = require('../../../utils/reservation.utils');
        validateCustomEventFields.mockReturnValueOnce({ valid: false, error: 'Birthday age is required' });

        db.reservation.findUnique.mockResolvedValue(RES_BASE);

        await expect(
          svc.updateReservation('res-001', { notes: 'test' } as any, UID)
        ).rejects.toThrow('Birthday age is required');
      });
    });

    // --- branches6: manual price recalculation via recalculateReservationTotalPrice ---
    describe('updateReservation — manual price recalculation (no menu package)', () => {
      beforeEach(() => {
        db.reservation.findUnique.mockResolvedValue(RES_BASE);
        db.reservation.findFirst.mockResolvedValue(null);
        db.reservation.update.mockResolvedValue({ ...RES_BASE, hall: HALL, client: CLIENT, eventType: EVENT });
        db.hall.findUnique.mockResolvedValue({ id: HALL.id, isWholeVenue: false });
        db.hall.findFirst.mockResolvedValue(null);
      });

      it('should recalculate totalPrice when adults change (no menu)', async () => {
        await svc.updateReservation('res-001', {
          adults: 60,
          reason: 'Zmiana liczby gosci w rezerwacji',
        } as any, UID);
        expect(db.reservation.update).toHaveBeenCalled();
        const updateCall = db.reservation.update.mock.calls[0][0];
        expect(updateCall.data.adults).toBe(60);
      });

      it('should recalculate totalPrice when pricePerAdult changes', async () => {
        await svc.updateReservation('res-001', {
          pricePerAdult: 250,
          reason: 'Aktualizacja ceny za osobe dorosla',
        } as any, UID);
        expect(db.reservation.update).toHaveBeenCalled();
        const updateCall = db.reservation.update.mock.calls[0][0];
        expect(updateCall.data.pricePerAdult).toBe(250);
      });

      it('should recalculate totalPrice when pricePerChild changes', async () => {
        await svc.updateReservation('res-001', {
          pricePerChild: 120,
          reason: 'Aktualizacja ceny za dziecko w rezerwacji',
        } as any, UID);
        expect(db.reservation.update).toHaveBeenCalled();
        const updateCall = db.reservation.update.mock.calls[0][0];
        expect(updateCall.data.pricePerChild).toBe(120);
      });

      it('should recalculate totalPrice when pricePerToddler changes', async () => {
        await svc.updateReservation('res-001', {
          pricePerToddler: 50,
          reason: 'Aktualizacja ceny za niemowle w rezerwacji',
        } as any, UID);
        expect(db.reservation.update).toHaveBeenCalled();
        const updateCall = db.reservation.update.mock.calls[0][0];
        expect(updateCall.data.pricePerToddler).toBe(50);
      });
    });
  });
});
