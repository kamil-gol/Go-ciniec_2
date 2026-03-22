/**
 * Reservation Status Service
 * Extracted from reservation.service.ts — status management, cancellation, archiving
 * #144: ARCHIVED status support
 * #172: Instant auto-archive on cancellation
 * #129: Queue notification on cancellation
 */
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { UpdateStatusDTO, ReservationStatus } from '../types/reservation.types';
import { RESERVATION } from '../i18n/pl';
import notificationService from './notification.service';
import { createHistoryEntry } from './reservation-history.helper';

const RESERVATION_INCLUDE = {
  hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true, allowMultipleBookings: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  eventType: { select: { id: true, name: true, standardHours: true, extraHourRate: true } },
  createdBy: { select: { id: true, email: true } },
} as const;

class ReservationStatusService {
  async updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<any> {
    await this.validateUserId(userId);
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { client: true, hall: true },
    });
    if (!existingReservation) throw new Error(RESERVATION.NOT_FOUND);

    this.validateStatusTransition(existingReservation.status, data.status);

    if (data.status === ReservationStatus.COMPLETED) {
      const eventDate = existingReservation.startDateTime
        ? new Date(existingReservation.startDateTime)
        : existingReservation.date
        ? new Date(existingReservation.date)
        : null;
      if (eventDate && eventDate > new Date()) {
        throw new Error(RESERVATION.CANNOT_COMPLETE_BEFORE_EVENT);
      }
    }

    // #172: Cancellation = instant archive (CANCELLED → ARCHIVED + archivedAt)
    if (data.status === ReservationStatus.CANCELLED) {
      const reservation = await prisma.$transaction(async (tx) => {
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.ARCHIVED, archivedAt: new Date() },
          include: RESERVATION_INCLUDE,
        });

        const cancelledDeposits = await this.cascadeCancelDeposits(tx, id, userId, data.reason);

        await tx.reservationHistory.create({
          data: {
            reservationId: id,
            changedByUserId: userId,
            changeType: 'STATUS_CHANGED',
            fieldName: 'status',
            oldValue: existingReservation.status,
            newValue: 'CANCELLED',
            reason: data.reason
              ? `${data.reason}${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`
              : `Zmiana statusu${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`,
          },
        });

        // #172: Auto-archive history entry
        await tx.reservationHistory.create({
          data: {
            reservationId: id,
            changedByUserId: userId,
            changeType: 'AUTO_ARCHIVED',
            fieldName: 'archivedAt',
            oldValue: null,
            newValue: new Date().toISOString(),
            reason: 'Automatyczna archiwizacja po anulowaniu rezerwacji',
          },
        });

        return updatedReservation;
      });

      // #128: Notification — status changed (cancellation)
      const cancelClient = existingReservation.client as any;
      if (cancelClient) {
        notificationService.createForAll({
          type: 'STATUS_CHANGED',
          title: 'Rezerwacja anulowana',
          message: `${cancelClient.firstName} ${cancelClient.lastName} — rezerwacja została anulowana`,
          entityType: 'RESERVATION',
          entityId: id,
          excludeUserId: userId,
        });
      }

      return reservation as any;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: data.status },
      include: RESERVATION_INCLUDE,
    });

    await createHistoryEntry(id, userId, 'STATUS_CHANGED', 'status', existingReservation.status, data.status, data.reason || 'Zmiana statusu');

    // #128: Notification — status changed
    const statusClient = existingReservation.client as any;
    const statusLabels: Record<string, string> = {
      PENDING: 'Oczekująca', RESERVED: 'Zarezerwowana', CONFIRMED: 'Potwierdzona',
      CANCELLED: 'Anulowana', COMPLETED: 'Zakończona', ARCHIVED: 'Zarchiwizowana',
    };
    if (statusClient) {
      notificationService.createForAll({
        type: 'STATUS_CHANGED',
        title: 'Zmiana statusu rezerwacji',
        message: `${statusClient.firstName} ${statusClient.lastName} — ${statusLabels[existingReservation.status] || existingReservation.status} → ${statusLabels[data.status] || data.status}`,
        entityType: 'RESERVATION',
        entityId: id,
        excludeUserId: userId,
      });
    }

    return reservation as any;
  }

  // #172: Cancellation = instant archive
  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { client: true, hall: true },
    });
    if (!existingReservation) throw new Error(RESERVATION.NOT_FOUND);

    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error(RESERVATION.ALREADY_CANCELLED);
    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error(RESERVATION.CANNOT_CANCEL_COMPLETED);
    if (existingReservation.status === ReservationStatus.ARCHIVED) throw new Error(RESERVATION.ALREADY_ARCHIVED);

    await prisma.$transaction(async (tx) => {
      // #172: Instant archive — status ARCHIVED + archivedAt set
      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.ARCHIVED, archivedAt: new Date() },
      });

      const cancelledCount = await this.cascadeCancelDeposits(tx, id, userId, reason);

      await tx.reservationHistory.create({
        data: {
          reservationId: id,
          changedByUserId: userId,
          changeType: 'CANCELLED',
          fieldName: 'status',
          oldValue: existingReservation.status,
          newValue: 'CANCELLED',
          reason: reason
            ? `${reason}${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`
            : `Rezerwacja anulowana${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`,
        },
      });

      // #172: Auto-archive history entry
      await tx.reservationHistory.create({
        data: {
          reservationId: id,
          changedByUserId: userId,
          changeType: 'AUTO_ARCHIVED',
          fieldName: 'archivedAt',
          oldValue: null,
          newValue: new Date().toISOString(),
          reason: 'Automatyczna archiwizacja po anulowaniu rezerwacji',
        },
      });
    });

    // #128: Notification — reservation cancelled
    const cancelClient = existingReservation.client as any;
    if (cancelClient) {
      notificationService.createForAll({
        type: 'STATUS_CHANGED',
        title: 'Rezerwacja anulowana',
        message: `${cancelClient.firstName} ${cancelClient.lastName} — rezerwacja została anulowana`,
        entityType: 'RESERVATION',
        entityId: id,
        excludeUserId: userId,
      });
    }

    // #129: Check queue for matching date — notify staff if someone is waiting
    if (existingReservation.startDateTime) {
      const eventDate = new Date(existingReservation.startDateTime);
      const dateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const nextDay = new Date(dateOnly);
      nextDay.setDate(nextDay.getDate() + 1);

      const queueEntries = await prisma.reservation.findMany({
        where: {
          status: ReservationStatus.RESERVED,
          reservationQueueDate: { gte: dateOnly, lt: nextDay },
        },
        include: { client: true },
        orderBy: { reservationQueuePosition: 'asc' },
      });

      if (queueEntries.length > 0) {
        const dateStr = dateOnly.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const names = queueEntries
          .slice(0, 3)
          .map((q: any, i: number) => `${q.client?.firstName} ${q.client?.lastName} (poz. ${i + 1})`)
          .join(', ');
        const extra = queueEntries.length > 3 ? ` i ${queueEntries.length - 3} więcej` : '';

        notificationService.createForAll({
          type: 'QUEUE_MATCH',
          title: 'Zwolnił się termin — ktoś czeka w kolejce',
          message: `Anulowano rezerwację na ${dateStr} — w kolejce: ${names}${extra}`,
          entityType: 'QUEUE',
          entityId: undefined,
          excludeUserId: userId,
        });
      }
    }
  }

  async archiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { client: true, hall: true },
    });
    if (!reservation) throw new Error(RESERVATION.NOT_FOUND);
    if (reservation.archivedAt) throw new Error(RESERVATION.ALREADY_ARCHIVED);

    await prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.ARCHIVED, archivedAt: new Date() },
    });

    await createHistoryEntry(
      id,
      userId,
      'ARCHIVED',
      'archivedAt',
      'null',
      new Date().toISOString(),
      reason || 'Rezerwacja zarchiwizowana'
    );
  }

  async unarchiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { client: true, hall: true },
    });
    if (!reservation) throw new Error(RESERVATION.NOT_FOUND);
    if (!reservation.archivedAt) throw new Error(RESERVATION.NOT_ARCHIVED);

    await prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED, archivedAt: null },
    });

    await createHistoryEntry(
      id,
      userId,
      'UNARCHIVED',
      'archivedAt',
      reservation.archivedAt.toISOString(),
      'null',
      reason || 'Rezerwacja przywrócona z archiwum'
    );
  }

  private async cascadeCancelDeposits(tx: any, reservationId: string, userId: string, reason?: string): Promise<number> {
    const pendingDeposits = await tx.deposit.findMany({
      where: { reservationId, status: { in: ['PENDING', 'OVERDUE'] } },
    });

    if (pendingDeposits.length === 0) return 0;

    await tx.deposit.updateMany({
      where: { reservationId, status: { in: ['PENDING', 'OVERDUE'] } },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });

    const totalCancelledAmount = pendingDeposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

    for (const deposit of pendingDeposits) {
      await tx.reservationHistory.create({
        data: {
          reservationId,
          changedByUserId: userId,
          changeType: 'DEPOSIT_CANCEL',
          fieldName: 'deposit',
          oldValue: deposit.status,
          newValue: 'CANCELLED',
          reason: `Zaliczka ${Number(deposit.amount).toLocaleString('pl-PL')} zł auto-anulowana z powodu anulowania rezerwacji${
            reason ? `: ${reason}` : ''
          }`,
        },
      });
    }

    return pendingDeposits.length;
  }

  // #144: Added ARCHIVED as terminal state (no transitions out)
  private validateStatusTransition(currentStatus: string, newStatus: ReservationStatus): void {
    const validTransitions: Record<string, string[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.ARCHIVED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(RESERVATION.STATUS_TRANSITION_INVALID(currentStatus, newStatus));
    }
  }

  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie');
    }
  }
}

export const reservationStatusService = new ReservationStatusService();
export default reservationStatusService;
