/**
 * reservation-create.helper — Unit Tests
 * Covers: validateAndLookupEntities, resolveMenuAndPricing,
 *         validateDateTimeAndAvailability, handlePostCreationExtras,
 *         sendCreationNotification, executeCreateReservation
 */

// ═══ Mocks ═══

jest.mock('../../../lib/prisma', () => {
  const mock = {
    hall: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    reservation: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    reservationMenuSnapshot: { create: jest.fn() },
    deposit: { create: jest.fn() },
    serviceItem: { findMany: jest.fn() },
    reservationExtra: { create: jest.fn() },
    reservationHistory: { create: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/venue-surcharge', () => ({
  calculateVenueSurcharge: jest.fn().mockReturnValue({ amount: null, label: null }),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(15000),
}));

jest.mock('../../../services/reservationCategoryExtra.service', () => ({
  reservationCategoryExtraService: {
    upsertExtras: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../services/notification.service', () => ({
  __esModule: true,
  default: { createForAll: jest.fn() },
}));

jest.mock('../../../services/reservation-validation.service', () => ({
  validateCapacityForTimeRange: jest.fn().mockResolvedValue(undefined),
  checkWholeVenueConflict: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../services/reservation-history.helper', () => ({
  createHistoryEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/reservation.utils', () => ({
  calculateTotalGuests: jest.fn().mockImplementation((a: number, c: number, t: number) => a + c + (t || 0)),
  calculateTotalPrice: jest.fn().mockImplementation(
    (a: number, c: number, pa: number, pc: number, t: number, pt: number) => a * pa + c * pc + (t || 0) * (pt || 0),
  ),
  validateConfirmationDeadline: jest.fn().mockReturnValue(true),
  validateCustomEventFields: jest.fn().mockReturnValue({ valid: true }),
}));

jest.mock('../../../services/reservation.includes', () => ({
  RESERVATION_INCLUDE: {},
}));

// ═══ Imports (after mocks) ═══

import { prisma } from '../../../lib/prisma';
import {
  validateAndLookupEntities,
  resolveMenuAndPricing,
  validateDateTimeAndAvailability,
  handlePostCreationExtras,
  sendCreationNotification,
  executeCreateReservation,
} from '../../../services/reservation-create.helper';
import { calculateVenueSurcharge } from '../../../utils/venue-surcharge';
import { recalculateReservationTotalPrice } from '../../../utils/recalculate-price';
import { reservationCategoryExtraService } from '../../../services/reservationCategoryExtra.service';
import notificationService from '../../../services/notification.service';
import { validateCapacityForTimeRange, checkWholeVenueConflict } from '../../../services/reservation-validation.service';
import { createHistoryEntry } from '../../../services/reservation-history.helper';
import { validateCustomEventFields, validateConfirmationDeadline } from '../../../utils/reservation.utils';

const db = prisma as any;

// ═══ Fixtures ═══

const HALL = { id: 'hall-001', name: 'Sala A', capacity: 100, isActive: true, isWholeVenue: false, allowMultipleBookings: false };
const CLIENT_FIX = { id: 'cl-001', firstName: 'Jan', lastName: 'Kowalski' };
const EVENT = { id: 'ev-001', name: 'Wesele' };
const FUTURE = '2027-08-15T14:00:00.000Z';
const FUTURE_END = '2027-08-15T22:00:00.000Z';
const UID = 'user-001';

const MENU_PKG = {
  id: 'pkg-001', name: 'Pakiet Premium', description: 'Opis',
  menuTemplateId: 'tpl-001', menuTemplate: { name: 'Szablon 2026' },
  pricePerAdult: 250, pricePerChild: 120, pricePerToddler: 50,
  minGuests: 10, maxGuests: 150,
};

const baseData: any = {
  hallId: 'hall-001', clientId: 'cl-001', eventTypeId: 'ev-001',
  startDateTime: FUTURE, endDateTime: FUTURE_END,
  adults: 50, children: 10, toddlers: 5,
};

// ═══ Helpers ═══

function setupDefaultLookups() {
  db.hall.findUnique.mockResolvedValue(HALL);
  db.client.findUnique.mockResolvedValue(CLIENT_FIX);
  db.eventType.findUnique.mockResolvedValue(EVENT);
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultLookups();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. validateAndLookupEntities
// ═══════════════════════════════════════════════════════════════════════════════

describe('reservation-create.helper', () => {
  describe('validateAndLookupEntities', () => {
    it('should fetch and validate hall, client, eventType', async () => {
      // Arrange — defaults already set in beforeEach

      // Act
      const result = await validateAndLookupEntities(baseData);

      // Assert
      expect(db.hall.findUnique).toHaveBeenCalledWith({ where: { id: 'hall-001' } });
      expect(db.client.findUnique).toHaveBeenCalledWith({ where: { id: 'cl-001' } });
      expect(db.eventType.findUnique).toHaveBeenCalledWith({ where: { id: 'ev-001' } });
      expect(result.hall.id).toBe('hall-001');
      expect(result.client.id).toBe('cl-001');
      expect(result.eventType.id).toBe('ev-001');
    });

    it('should throw if hallId missing', async () => {
      // Arrange
      const data = { ...baseData, hallId: undefined };

      // Act & Assert
      await expect(validateAndLookupEntities(data)).rejects.toThrow(
        'Sala, klient i typ wydarzenia są wymagane',
      );
    });

    it('should throw if hall not found', async () => {
      // Arrange
      db.hall.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(validateAndLookupEntities(baseData)).rejects.toThrow('Nie znaleziono sali');
    });

    it('should throw if hall is inactive', async () => {
      // Arrange
      db.hall.findUnique.mockResolvedValue({ ...HALL, isActive: false });

      // Act & Assert
      await expect(validateAndLookupEntities(baseData)).rejects.toThrow('Sala jest nieaktywna');
    });

    it('should throw if client not found', async () => {
      // Arrange
      db.client.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(validateAndLookupEntities(baseData)).rejects.toThrow('Nie znaleziono klienta');
    });

    it('should throw if eventType not found', async () => {
      // Arrange
      db.eventType.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(validateAndLookupEntities(baseData)).rejects.toThrow('Nie znaleziono typu wydarzenia');
    });

    it('should throw if custom event validation fails', async () => {
      // Arrange
      (validateCustomEventFields as jest.Mock).mockReturnValueOnce({ valid: false, error: 'Pole niestandardowe wymagane' });

      // Act & Assert
      await expect(validateAndLookupEntities(baseData)).rejects.toThrow('Pole niestandardowe wymagane');
    });

    it('should throw if guest count is 0', async () => {
      // Arrange
      const data = { ...baseData, adults: 0, children: 0, toddlers: 0 };

      // Act & Assert
      await expect(validateAndLookupEntities(data)).rejects.toThrow(
        'Wymagana jest co najmniej jedna osoba',
      );
    });

    it('should throw if guests exceed hall capacity', async () => {
      // Arrange
      const data = { ...baseData, adults: 80, children: 30, toddlers: 0 };
      // calculateTotalGuests mock returns 80 + 30 + 0 = 110 > 100

      // Act & Assert
      await expect(validateAndLookupEntities(data)).rejects.toThrow('przekracza pojemność sali');
    });

    it('should return validated entities with calculated guests', async () => {
      // Arrange — defaults

      // Act
      const result = await validateAndLookupEntities(baseData);

      // Assert
      expect(result.adults).toBe(50);
      expect(result.children).toBe(10);
      expect(result.toddlers).toBe(5);
      expect(result.guests).toBe(65); // 50+10+5
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. resolveMenuAndPricing
  // ═══════════════════════════════════════════════════════════════════════════

  describe('resolveMenuAndPricing', () => {
    const entities: any = {
      adults: 50, children: 10, toddlers: 5, guests: 65,
      hall: HALL, client: CLIENT_FIX, eventType: EVENT,
    };

    it('should resolve menu package pricing', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const data = { ...baseData, menuPackageId: 'pkg-001' };

      // Act
      const result = await resolveMenuAndPricing(data, entities);

      // Assert
      expect(result.menuPackage).toBeTruthy();
      expect(result.pricePerAdult).toBe(250);
      expect(result.pricePerChild).toBe(120);
      expect(result.pricePerToddler).toBe(50);
    });

    it('should throw if menu package not found', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue(null);
      const data = { ...baseData, menuPackageId: 'pkg-missing' };

      // Act & Assert
      await expect(resolveMenuAndPricing(data, entities)).rejects.toThrow(
        'Nie znaleziono wybranego pakietu menu',
      );
    });

    it('should throw if guests below minGuests', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue({ ...MENU_PKG, minGuests: 100 });
      const data = { ...baseData, menuPackageId: 'pkg-001' };

      // Act & Assert
      await expect(resolveMenuAndPricing(data, entities)).rejects.toThrow('wymaga minimum 100 gości');
    });

    it('should throw if guests above maxGuests', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue({ ...MENU_PKG, maxGuests: 30 });
      const data = { ...baseData, menuPackageId: 'pkg-001' };

      // Act & Assert
      await expect(resolveMenuAndPricing(data, entities)).rejects.toThrow('pozwala na maksimum 30 gości');
    });

    it('should calculate percentage discount correctly', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const data = {
        ...baseData,
        menuPackageId: 'pkg-001',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountReason: 'Rabat lojalny klient',
      };

      // Act
      const result = await resolveMenuAndPricing(data, entities);

      // Assert
      expect(result.discountTypeVal).toBe('PERCENTAGE');
      expect(result.discountValueNum).toBe(10);
      expect(result.discountAmountVal).toBeGreaterThan(0);
      expect(result.finalTotalPrice).toBeLessThan(result.priceBeforeDiscountVal!);
    });

    it('should throw for percentage discount > 100%', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const data = {
        ...baseData,
        menuPackageId: 'pkg-001',
        discountType: 'PERCENTAGE',
        discountValue: 150,
        discountReason: 'Rabat specjalny',
      };

      // Act & Assert
      await expect(resolveMenuAndPricing(data, entities)).rejects.toThrow(
        'Rabat procentowy nie może przekroczyć 100%',
      );
    });

    it('should throw if fixed discount exceeds total', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const data = {
        ...baseData,
        menuPackageId: 'pkg-001',
        discountType: 'FIXED',
        discountValue: 999999,
        discountReason: 'Rabat absurdalny',
      };

      // Act & Assert
      await expect(resolveMenuAndPricing(data, entities)).rejects.toThrow(
        'nie może przekroczyć ceny',
      );
    });

    it('should calculate venue surcharge for whole-venue halls', async () => {
      // Arrange
      (calculateVenueSurcharge as jest.Mock).mockReturnValueOnce({ amount: 500, label: 'Dopłata za cały obiekt' });
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const wholeVenueEntities = { ...entities, hall: { ...HALL, isWholeVenue: true } };
      const data = { ...baseData, menuPackageId: 'pkg-001' };

      // Act
      const result = await resolveMenuAndPricing(data, wholeVenueEntities);

      // Assert
      expect(result.surcharge.amount).toBe(500);
      expect(result.surcharge.label).toBe('Dopłata za cały obiekt');
      expect(result.surchargeAmount).toBe(500);
    });

    it('should handle per-person pricing (no menu package)', async () => {
      // Arrange
      const data = { ...baseData, pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 30 };

      // Act
      const result = await resolveMenuAndPricing(data, entities);

      // Assert
      expect(result.menuPackage).toBeNull();
      expect(result.pricePerAdult).toBe(200);
      expect(result.pricePerChild).toBe(100);
      expect(result.pricePerToddler).toBe(30);
    });

    it('should throw if no pricePerAdult when no package', async () => {
      // Arrange
      const data = { ...baseData }; // no menuPackageId, no pricePerAdult

      // Act & Assert
      await expect(resolveMenuAndPricing(data, entities)).rejects.toThrow(
        'Cena za dorosłego i za dziecko jest wymagana',
      );
    });

    it('should include service extras in total', async () => {
      // Arrange
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const data = {
        ...baseData,
        menuPackageId: 'pkg-001',
        serviceExtras: [
          { serviceItemId: 'si-1', quantity: 2, unitPrice: 100, totalPrice: 200 },
          { serviceItemId: 'si-2', quantity: 1, unitPrice: 50, totalPrice: 50 },
        ],
      };

      // Act
      const result = await resolveMenuAndPricing(data, entities);

      // Assert
      expect(result.extrasTotal).toBe(250);
      expect(result.finalTotalPrice).toBeGreaterThan(result.packagePrice);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. validateDateTimeAndAvailability
  // ═══════════════════════════════════════════════════════════════════════════

  describe('validateDateTimeAndAvailability', () => {
    const hall: any = HALL;
    const guests = 65;

    it('should accept ISO datetime format', async () => {
      // Arrange
      const data = { ...baseData };

      // Act
      const notes = await validateDateTimeAndAvailability(data, hall, guests);

      // Assert
      expect(typeof notes).toBe('string');
      expect(validateCapacityForTimeRange).toHaveBeenCalled();
    });

    it('should accept legacy format (date + startTime/endTime)', async () => {
      // Arrange
      const data = {
        hallId: 'hall-001', clientId: 'cl-001', eventTypeId: 'ev-001',
        date: '2027-08-15', startTime: '14:00', endTime: '22:00',
        adults: 50, children: 10, toddlers: 5,
      };

      // Act
      const notes = await validateDateTimeAndAvailability(data as any, hall, guests);

      // Assert
      expect(typeof notes).toBe('string');
      expect(validateCapacityForTimeRange).toHaveBeenCalled();
    });

    it('should throw if startDateTime is in the past', async () => {
      // Arrange
      const data = { ...baseData, startDateTime: '2020-01-01T10:00:00.000Z', endDateTime: '2020-01-01T18:00:00.000Z' };

      // Act & Assert
      await expect(validateDateTimeAndAvailability(data, hall, guests)).rejects.toThrow(
        'Data rezerwacji musi być w przyszłości',
      );
    });

    it('should throw if endTime before startTime (new format)', async () => {
      // Arrange
      const data = { ...baseData, startDateTime: FUTURE, endDateTime: '2027-08-15T10:00:00.000Z' };

      // Act & Assert
      await expect(validateDateTimeAndAvailability(data, hall, guests)).rejects.toThrow(
        'Godzina zakończenia musi być po godzinie rozpoczęcia',
      );
    });

    it('should throw if endTime before startTime (legacy format)', async () => {
      // Arrange
      const data = {
        hallId: 'hall-001', clientId: 'cl-001', eventTypeId: 'ev-001',
        date: '2027-08-15', startTime: '22:00', endTime: '14:00',
        adults: 50, children: 10, toddlers: 5,
      };

      // Act & Assert
      await expect(validateDateTimeAndAvailability(data as any, hall, guests)).rejects.toThrow(
        'Godzina zakończenia musi być po godzinie rozpoczęcia',
      );
    });

    it('should call validateCapacityForTimeRange', async () => {
      // Arrange
      const data = { ...baseData };

      // Act
      await validateDateTimeAndAvailability(data, hall, guests);

      // Assert
      expect(validateCapacityForTimeRange).toHaveBeenCalledWith(
        hall,
        expect.any(Date),
        expect.any(Date),
        guests,
      );
    });

    it('should call checkWholeVenueConflict', async () => {
      // Arrange
      const data = { ...baseData };

      // Act
      await validateDateTimeAndAvailability(data, hall, guests);

      // Assert
      expect(checkWholeVenueConflict).toHaveBeenCalledWith(
        'hall-001',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should validate confirmation deadline', async () => {
      // Arrange
      const data = {
        ...baseData,
        confirmationDeadline: '2027-08-10T12:00:00.000Z',
      };

      // Act
      await validateDateTimeAndAvailability(data, hall, guests);

      // Assert
      expect(validateConfirmationDeadline).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. handlePostCreationExtras
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handlePostCreationExtras', () => {
    const entities: any = {
      adults: 50, children: 10, toddlers: 5, guests: 65,
      hall: HALL, client: CLIENT_FIX, eventType: EVENT,
    };

    const basePricing: any = {
      menuPackage: MENU_PKG,
      selectedOptions: [],
      packagePrice: 14050,
      optionsPrice: 0,
      totalPrice: 14050,
      extrasTotal: 0,
      surchargeAmount: 0,
      discountTypeVal: null,
      discountAmountVal: null,
      pricePerAdult: 250,
      pricePerChild: 120,
      pricePerToddler: 50,
    };

    it('should create menu snapshot when package exists', async () => {
      // Arrange
      const data = { ...baseData, menuPackageId: 'pkg-001' };

      // Act
      await handlePostCreationExtras('res-001', data, entities, basePricing, UID);

      // Assert
      expect(db.reservationMenuSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reservationId: 'res-001',
          packageId: 'pkg-001',
          menuTemplateId: 'tpl-001',
        }),
      });
    });

    it('should create service extra records', async () => {
      // Arrange
      const serviceExtras = [
        { serviceItemId: 'si-1', quantity: 2, unitPrice: 100, totalPrice: 200 },
      ];
      const data = { ...baseData, serviceExtras };
      db.serviceItem.findMany.mockResolvedValue([{ id: 'si-1', priceType: 'FIXED' }]);
      const pricing = { ...basePricing, extrasTotal: 200 };

      // Act
      await handlePostCreationExtras('res-001', data, entities, pricing, UID);

      // Assert
      expect(db.reservationExtra.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reservationId: 'res-001',
          serviceItemId: 'si-1',
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200,
          status: 'PENDING',
        }),
      });
      expect(db.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-001' },
        data: { extrasTotalPrice: 200 },
      });
    });

    it('should create deposit record', async () => {
      // Arrange
      const data = {
        ...baseData,
        deposit: { amount: 5000, dueDate: '2027-07-01', paid: false },
      };

      // Act
      await handlePostCreationExtras('res-001', data, entities, basePricing, UID);

      // Assert
      expect(db.deposit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reservationId: 'res-001',
          amount: 5000,
          remainingAmount: 5000,
          paid: false,
          status: 'PENDING',
        }),
      });
    });

    it('should call createHistoryEntry', async () => {
      // Arrange
      const data = { ...baseData };

      // Act
      await handlePostCreationExtras('res-001', data, entities, basePricing, UID);

      // Assert
      expect(createHistoryEntry).toHaveBeenCalledWith(
        'res-001',
        UID,
        'CREATED',
        null,
        null,
        null,
        expect.stringContaining('Utworzono rezerwację'),
      );
    });

    it('should call recalculateReservationTotalPrice', async () => {
      // Arrange
      const data = { ...baseData };

      // Act
      await handlePostCreationExtras('res-001', data, entities, basePricing, UID);

      // Assert
      expect(recalculateReservationTotalPrice).toHaveBeenCalledWith('res-001');
    });

    it('should handle category extras', async () => {
      // Arrange
      const data = {
        ...baseData,
        categoryExtras: [{ categoryId: 'cat-1', itemId: 'item-1', quantity: 3 }],
      };

      // Act
      await handlePostCreationExtras('res-001', data, entities, basePricing, UID);

      // Assert
      expect(reservationCategoryExtraService.upsertExtras).toHaveBeenCalledWith(
        'res-001',
        data.categoryExtras,
        UID,
        { adults: 50, children: 10, toddlers: 5 },
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. sendCreationNotification
  // ═══════════════════════════════════════════════════════════════════════════

  describe('sendCreationNotification', () => {
    it('should call notificationService.createForAll', () => {
      // Arrange
      const data = { ...baseData };
      const client = { firstName: 'Jan', lastName: 'Kowalski' };
      const hall = { name: 'Sala A' };
      const eventType = { name: 'Wesele' };

      // Act
      sendCreationNotification('res-001', data, client, hall, eventType, UID);

      // Assert
      expect(notificationService.createForAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RESERVATION_CREATED',
          title: 'Nowa rezerwacja',
          entityType: 'RESERVATION',
          entityId: 'res-001',
          excludeUserId: UID,
        }),
      );
    });

    it('should format client display name', () => {
      // Arrange
      const data = { ...baseData };
      const client = { firstName: 'Anna', lastName: 'Nowak' };
      const hall = { name: 'Sala B' };
      const eventType = { name: 'Komunia' };

      // Act
      sendCreationNotification('res-002', data, client, hall, eventType, UID);

      // Assert
      const call = (notificationService.createForAll as jest.Mock).mock.calls[0][0];
      expect(call.message).toContain('Anna Nowak');
      expect(call.message).toContain('Sala B');
      expect(call.message).toContain('Komunia');
    });

    it('should use legacy date format when no startDateTime', () => {
      // Arrange
      const data = {
        hallId: 'hall-001', clientId: 'cl-001', eventTypeId: 'ev-001',
        date: '2027-08-15', startTime: '14:00', endTime: '22:00',
        adults: 50, children: 10, toddlers: 5,
      };
      const client = { firstName: 'Jan', lastName: 'Kowalski' };
      const hall = { name: 'Sala A' };
      const eventType = { name: 'Wesele' };

      // Act
      sendCreationNotification('res-003', data as any, client, hall, eventType, UID);

      // Assert
      const call = (notificationService.createForAll as jest.Mock).mock.calls[0][0];
      expect(call.message).toContain('2027-08-15');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. executeCreateReservation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('executeCreateReservation', () => {
    const validateUserId = jest.fn().mockResolvedValue(undefined);

    it('should validate user, create reservation and call post-creation', async () => {
      // Arrange
      setupDefaultLookups();
      db.menuPackage.findUnique.mockResolvedValue(MENU_PKG);
      const createdRes = { id: 'res-new', ...baseData };
      db.reservation.create.mockResolvedValue(createdRes);

      const data = { ...baseData, menuPackageId: 'pkg-001' };

      // Act
      const result = await executeCreateReservation(data, UID, validateUserId);

      // Assert
      expect(validateUserId).toHaveBeenCalledWith(UID);
      expect(db.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hallId: 'hall-001',
            clientId: 'cl-001',
            eventTypeId: 'ev-001',
            createdById: UID,
          }),
        }),
      );
      expect(result.id).toBe('res-new');
      // post-creation called
      expect(createHistoryEntry).toHaveBeenCalled();
      expect(notificationService.createForAll).toHaveBeenCalled();
    });

    it('should call validateUserId', async () => {
      // Arrange
      const failValidate = jest.fn().mockRejectedValue(new Error('Nie znaleziono użytkownika'));

      // Act & Assert
      await expect(executeCreateReservation(baseData, UID, failValidate)).rejects.toThrow(
        'Nie znaleziono użytkownika',
      );
      expect(failValidate).toHaveBeenCalledWith(UID);
    });
  });
});
