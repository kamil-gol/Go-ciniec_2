/**
 * ReservationStatusService — Unit Tests
 * Tests for status transitions, cancellation, archiving, and notification triggers
 * Issue #237: Test coverage for extracted reservation-status.service.ts
 */

jest.mock('../../../lib/prisma', () => {
  const mock: Record<string, any> = {
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    reservationHistory: {
      create: jest.fn(),
    },
    deposit: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn: any): any => (typeof fn === 'function' ? fn(mock) : Promise.all(fn))),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../services/notification.service', () => ({
  __esModule: true,
  default: { createForAll: jest.fn().mockResolvedValue(0) },
}));

jest.mock('../../../services/reservation-history.helper', () => ({
  createHistoryEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { prisma } from '../../../lib/prisma';
import notificationService from '../../../services/notification.service';
import { createHistoryEntry } from '../../../services/reservation-history.helper';
import { reservationStatusService } from '../../../services/reservation-status.service';

const mockPrisma = prisma as any;
const mockNotification = notificationService as any;
const mockCreateHistory = createHistoryEntry as jest.Mock;

const USER_ID = 'user-001';
const USER = { id: USER_ID, email: 'admin@test.pl' };

const BASE_RESERVATION = {
  id: 'res-001',
  hallId: 'hall-1',
  status: 'PENDING',
  startDateTime: new Date('2027-06-15T14:00:00.000Z'),
  date: new Date('2027-06-15'),
  archivedAt: null,
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: '123456789' },
  hall: { id: 'hall-1', name: 'Sala A', capacity: 100, isWholeVenue: false, allowMultipleBookings: false },
};

const UPDATED_RESERVATION = {
  ...BASE_RESERVATION,
  status: 'CONFIRMED',
  hall: { id: 'hall-1', name: 'Sala A', capacity: 100, isWholeVenue: false, allowMultipleBookings: false },
  client: BASE_RESERVATION.client,
  eventType: { id: 'et-1', name: 'Wesele' },
  createdBy: { id: USER_ID, email: 'admin@test.pl' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue(USER);
  mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.update.mockResolvedValue(UPDATED_RESERVATION);
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockPrisma.deposit.findMany.mockResolvedValue([]);
  mockPrisma.deposit.updateMany.mockResolvedValue({ count: 0 });
});

describe('ReservationStatusService', () => {
  // ─── updateStatus() ───
  describe('updateStatus()', () => {
    it('should update status for a valid transition (PENDING → CONFIRMED)', async () => {
      const result = await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CONFIRMED' as any },
        USER_ID
      );

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-001' },
          data: { status: 'CONFIRMED' },
        })
      );
      expect(result).toBeDefined();
    });

    it('should create history entry on valid status change', async () => {
      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CONFIRMED' as any, reason: 'Potwierdzono telefonicznie' },
        USER_ID
      );

      expect(mockCreateHistory).toHaveBeenCalledWith(
        'res-001',
        USER_ID,
        'STATUS_CHANGED',
        'status',
        'PENDING',
        'CONFIRMED',
        'Potwierdzono telefonicznie'
      );
    });

    it('should send notification on status change when client exists', async () => {
      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CONFIRMED' as any },
        USER_ID
      );

      expect(mockNotification.createForAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATUS_CHANGED',
          entityType: 'RESERVATION',
          entityId: 'res-001',
          excludeUserId: USER_ID,
        })
      );
    });

    it('should not send notification when client is null', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        client: null,
      });

      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CONFIRMED' as any },
        USER_ID
      );

      expect(mockNotification.createForAll).not.toHaveBeenCalled();
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.updateStatus('nonexistent', { status: 'CONFIRMED' as any }, USER_ID)
      ).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw on invalid status transition (COMPLETED → CONFIRMED)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'COMPLETED',
      });

      await expect(
        reservationStatusService.updateStatus('res-001', { status: 'CONFIRMED' as any }, USER_ID)
      ).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should throw on invalid status transition (ARCHIVED → PENDING)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'ARCHIVED',
      });

      await expect(
        reservationStatusService.updateStatus('res-001', { status: 'PENDING' as any }, USER_ID)
      ).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should throw on invalid status transition (CANCELLED → PENDING)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'CANCELLED',
      });

      await expect(
        reservationStatusService.updateStatus('res-001', { status: 'PENDING' as any }, USER_ID)
      ).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should throw CANNOT_COMPLETE_BEFORE_EVENT when completing a future event', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'CONFIRMED',
        startDateTime: new Date('2099-01-01T12:00:00.000Z'),
      });

      await expect(
        reservationStatusService.updateStatus('res-001', { status: 'COMPLETED' as any }, USER_ID)
      ).rejects.toThrow('Nie można zakończyć rezerwacji przed datą wydarzenia');
    });

    it('should allow completing a past event', async () => {
      const confirmedRes = {
        ...BASE_RESERVATION,
        status: 'CONFIRMED',
        startDateTime: new Date('2020-01-01T12:00:00.000Z'),
      };
      mockPrisma.reservation.findUnique.mockResolvedValue(confirmedRes);
      mockPrisma.reservation.update.mockResolvedValue({
        ...UPDATED_RESERVATION,
        status: 'COMPLETED',
      });

      const result = await reservationStatusService.updateStatus(
        'res-001',
        { status: 'COMPLETED' as any },
        USER_ID
      );

      expect(result).toBeDefined();
      expect(mockPrisma.reservation.update).toHaveBeenCalled();
    });

    it('should throw when user not found (invalid userId)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.updateStatus('res-001', { status: 'CONFIRMED' as any }, 'bad-user')
      ).rejects.toThrow(/Sesja wygasła/);
    });
  });

  // ─── updateStatus() — cancellation path (#172) ───
  describe('updateStatus() — cancellation path', () => {
    it('should set status to ARCHIVED and archivedAt on cancellation', async () => {
      const archivedRes = { ...UPDATED_RESERVATION, status: 'ARCHIVED', archivedAt: new Date() };
      mockPrisma.reservation.update.mockResolvedValue(archivedRes);

      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CANCELLED' as any, reason: 'Klient zrezygnował' },
        USER_ID
      );

      // Cancellation uses $transaction
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('ARCHIVED');
      expect(updateCall.data.archivedAt).toBeDefined();
    });

    it('should create two history entries on cancellation (STATUS_CHANGED + AUTO_ARCHIVED)', async () => {
      const archivedRes = { ...UPDATED_RESERVATION, status: 'ARCHIVED', archivedAt: new Date() };
      mockPrisma.reservation.update.mockResolvedValue(archivedRes);

      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CANCELLED' as any },
        USER_ID
      );

      // Two reservationHistory.create calls inside the transaction
      expect(mockPrisma.reservationHistory.create).toHaveBeenCalledTimes(2);

      const calls = mockPrisma.reservationHistory.create.mock.calls;
      expect(calls[0][0].data.changeType).toBe('STATUS_CHANGED');
      expect(calls[1][0].data.changeType).toBe('AUTO_ARCHIVED');
    });

    it('should cascade cancel pending deposits on cancellation', async () => {
      const deposits = [
        { id: 'dep-1', amount: 500, status: 'PENDING' },
        { id: 'dep-2', amount: 300, status: 'OVERDUE' },
      ];
      mockPrisma.deposit.findMany.mockResolvedValue(deposits);
      mockPrisma.deposit.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.reservation.update.mockResolvedValue({
        ...UPDATED_RESERVATION,
        status: 'ARCHIVED',
      });

      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CANCELLED' as any, reason: 'Test' },
        USER_ID
      );

      expect(mockPrisma.deposit.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reservationId: 'res-001', status: { in: ['PENDING', 'OVERDUE'] } },
          data: expect.objectContaining({ status: 'CANCELLED' }),
        })
      );
    });

    it('should send cancellation notification', async () => {
      mockPrisma.reservation.update.mockResolvedValue({
        ...UPDATED_RESERVATION,
        status: 'ARCHIVED',
      });

      await reservationStatusService.updateStatus(
        'res-001',
        { status: 'CANCELLED' as any },
        USER_ID
      );

      expect(mockNotification.createForAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATUS_CHANGED',
          title: 'Rezerwacja anulowana',
        })
      );
    });
  });

  // ─── cancelReservation() ───
  describe('cancelReservation()', () => {
    it('should cancel and archive reservation', async () => {
      await reservationStatusService.cancelReservation('res-001', USER_ID, 'Klient zrezygnował');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ARCHIVED' }),
        })
      );
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.cancelReservation('nonexistent', USER_ID)
      ).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw ALREADY_CANCELLED when status is CANCELLED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'CANCELLED',
      });

      await expect(
        reservationStatusService.cancelReservation('res-001', USER_ID)
      ).rejects.toThrow('Rezerwacja jest już anulowana');
    });

    it('should throw CANNOT_CANCEL_COMPLETED when status is COMPLETED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'COMPLETED',
      });

      await expect(
        reservationStatusService.cancelReservation('res-001', USER_ID)
      ).rejects.toThrow('Nie można anulować zakończonej rezerwacji');
    });

    it('should throw ALREADY_ARCHIVED when status is ARCHIVED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'ARCHIVED',
      });

      await expect(
        reservationStatusService.cancelReservation('res-001', USER_ID)
      ).rejects.toThrow('Rezerwacja jest już zarchiwizowana');
    });

    it('should create CANCELLED and AUTO_ARCHIVED history entries', async () => {
      await reservationStatusService.cancelReservation('res-001', USER_ID, 'Powód testowy');

      expect(mockPrisma.reservationHistory.create).toHaveBeenCalledTimes(2);
      const calls = mockPrisma.reservationHistory.create.mock.calls;
      expect(calls[0][0].data.changeType).toBe('CANCELLED');
      expect(calls[0][0].data.reason).toContain('Powód testowy');
      expect(calls[1][0].data.changeType).toBe('AUTO_ARCHIVED');
    });

    it('should include deposit count in history reason when deposits are cancelled', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([
        { id: 'dep-1', amount: 500, status: 'PENDING' },
      ]);
      mockPrisma.deposit.updateMany.mockResolvedValue({ count: 1 });

      await reservationStatusService.cancelReservation('res-001', USER_ID, 'Anulowanie');

      // History entries: deposit cancel(s), then CANCELLED, then AUTO_ARCHIVED
      // The CANCELLED entry should mention deposit count
      const cancelledEntry = mockPrisma.reservationHistory.create.mock.calls.find(
        (call: any[]) => call[0].data.changeType === 'CANCELLED'
      );
      expect(cancelledEntry).toBeDefined();
      expect(cancelledEntry[0].data.reason).toContain('Auto-anulowano 1 zaliczek');
    });

    it('should send cancellation notification with client name', async () => {
      await reservationStatusService.cancelReservation('res-001', USER_ID);

      expect(mockNotification.createForAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATUS_CHANGED',
          title: 'Rezerwacja anulowana',
          message: expect.stringContaining('Jan Kowalski'),
        })
      );
    });

    it('should not send notification when client is null', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        client: null,
      });

      await reservationStatusService.cancelReservation('res-001', USER_ID);

      expect(mockNotification.createForAll).not.toHaveBeenCalled();
    });

    // #129: Queue notification on cancellation
    it('should send queue notification when queue entries exist for the date', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        {
          id: 'q-1',
          client: { firstName: 'Anna', lastName: 'Nowak' },
          reservationQueuePosition: 1,
        },
      ]);

      await reservationStatusService.cancelReservation('res-001', USER_ID);

      // First call is cancellation notification, second is queue match
      const queueCall = mockNotification.createForAll.mock.calls.find(
        (call: any[]) => call[0].type === 'QUEUE_MATCH'
      );
      expect(queueCall).toBeDefined();
      expect(queueCall[0].title).toContain('kolejce');
    });

    it('should not send queue notification when no queue entries exist', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await reservationStatusService.cancelReservation('res-001', USER_ID);

      const queueCall = mockNotification.createForAll.mock.calls.find(
        (call: any[]) => call[0].type === 'QUEUE_MATCH'
      );
      expect(queueCall).toBeUndefined();
    });

    it('should throw when user not found (invalid userId)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.cancelReservation('res-001', 'bad-user')
      ).rejects.toThrow(/Sesja wygasła/);
    });
  });

  // ─── archiveReservation() ───
  describe('archiveReservation()', () => {
    it('should archive reservation and set archivedAt', async () => {
      await reservationStatusService.archiveReservation('res-001', USER_ID, 'Stara rezerwacja');

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-001' },
          data: expect.objectContaining({ status: 'ARCHIVED' }),
        })
      );
      expect(mockPrisma.reservation.update.mock.calls[0][0].data.archivedAt).toBeDefined();
    });

    it('should create history entry on archive', async () => {
      await reservationStatusService.archiveReservation('res-001', USER_ID, 'Archiwizacja testowa');

      expect(mockCreateHistory).toHaveBeenCalledWith(
        'res-001',
        USER_ID,
        'ARCHIVED',
        'archivedAt',
        'null',
        expect.any(String),
        'Archiwizacja testowa'
      );
    });

    it('should use default reason when none provided', async () => {
      await reservationStatusService.archiveReservation('res-001', USER_ID);

      expect(mockCreateHistory).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Rezerwacja zarchiwizowana'
      );
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.archiveReservation('nonexistent', USER_ID)
      ).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw ALREADY_ARCHIVED when reservation is already archived', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        archivedAt: new Date(),
      });

      await expect(
        reservationStatusService.archiveReservation('res-001', USER_ID)
      ).rejects.toThrow('Rezerwacja jest już zarchiwizowana');
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.archiveReservation('res-001', 'bad-user')
      ).rejects.toThrow(/Sesja wygasła/);
    });
  });

  // ─── unarchiveReservation() ───
  describe('unarchiveReservation()', () => {
    it('should unarchive reservation, set status to CANCELLED and clear archivedAt', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'ARCHIVED',
        archivedAt: new Date('2025-01-01'),
      });

      await reservationStatusService.unarchiveReservation('res-001', USER_ID, 'Przywrócenie');

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CANCELLED', archivedAt: null },
        })
      );
    });

    it('should create UNARCHIVED history entry', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: 'ARCHIVED',
        archivedAt: new Date('2025-01-01'),
      });

      await reservationStatusService.unarchiveReservation('res-001', USER_ID);

      expect(mockCreateHistory).toHaveBeenCalledWith(
        'res-001',
        USER_ID,
        'UNARCHIVED',
        'archivedAt',
        expect.any(String),
        'null',
        'Rezerwacja przywrócona z archiwum'
      );
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.unarchiveReservation('nonexistent', USER_ID)
      ).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw NOT_ARCHIVED when reservation is not archived', async () => {
      // BASE_RESERVATION has archivedAt: null
      await expect(
        reservationStatusService.unarchiveReservation('res-001', USER_ID)
      ).rejects.toThrow('Rezerwacja nie jest zarchiwizowana');
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        reservationStatusService.unarchiveReservation('res-001', 'bad-user')
      ).rejects.toThrow(/Sesja wygasła/);
    });
  });

  // ─── validateStatusTransition (tested indirectly via updateStatus) ───
  describe('status transition validation', () => {
    const validTransitions: [string, string][] = [
      ['PENDING', 'CONFIRMED'],
      ['PENDING', 'CANCELLED'],
      ['CONFIRMED', 'COMPLETED'],
      ['CONFIRMED', 'CANCELLED'],
    ];

    const invalidTransitions: [string, string][] = [
      ['COMPLETED', 'PENDING'],
      ['COMPLETED', 'CONFIRMED'],
      ['COMPLETED', 'CANCELLED'],
      ['CANCELLED', 'PENDING'],
      ['CANCELLED', 'CONFIRMED'],
      ['ARCHIVED', 'PENDING'],
      ['ARCHIVED', 'CONFIRMED'],
      ['ARCHIVED', 'CANCELLED'],
      ['PENDING', 'COMPLETED'],
      ['PENDING', 'ARCHIVED'],
    ];

    it.each(validTransitions)(
      'should allow transition from %s to %s',
      async (from, to) => {
        mockPrisma.reservation.findUnique.mockResolvedValue({
          ...BASE_RESERVATION,
          status: from,
          // For COMPLETED transitions, use a past date
          startDateTime: to === 'COMPLETED' ? new Date('2020-01-01') : BASE_RESERVATION.startDateTime,
        });
        mockPrisma.reservation.update.mockResolvedValue({
          ...UPDATED_RESERVATION,
          status: to === 'CANCELLED' ? 'ARCHIVED' : to,
        });

        await expect(
          reservationStatusService.updateStatus('res-001', { status: to as any }, USER_ID)
        ).resolves.toBeDefined();
      }
    );

    it.each(invalidTransitions)(
      'should reject transition from %s to %s',
      async (from, to) => {
        mockPrisma.reservation.findUnique.mockResolvedValue({
          ...BASE_RESERVATION,
          status: from,
        });

        await expect(
          reservationStatusService.updateStatus('res-001', { status: to as any }, USER_ID)
        ).rejects.toThrow(/Nie można zmienić statusu/);
      }
    );
  });
});
