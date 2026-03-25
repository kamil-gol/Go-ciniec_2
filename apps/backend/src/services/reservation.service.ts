/**
 * Reservation Service - with full Audit Logging
 * Business logic for reservation management with advanced features
 * Updated: Phase 1 Audit — logChange() for menu updates + cascade cancel
 * Updated: Sprint 8 — service extras creation during reservation
 * Updated: #137 — Venue surcharge for "Cały Obiekt" bookings
 * Updated: allowWithWholeVenue — Strzecha Tył/Przód/Góra coexist with whole venue
 * Updated: #144 — ARCHIVED status support + auto-archive CRON preparation
 * Updated: Etap 5 — internalNotes field (excluded from PDF)
 * Updated: fix/recalculate-totalPrice — centralized price recalculation
 * Updated: #165 — capacity-based overlap logic (multiple reservations per hall)
 * Updated: #172 — instant auto-archive on cancellation (no 30-day delay)
 * Updated: fix/pricing-and-encoding — recalculate totalPrice at end of create/update
 * Updated: #176 — eventTypeId is immutable after creation (cascading side-effects)
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 *
 * NOTE: MenuOption & MenuPackageOption models removed from Prisma.
 * Options/extras are now handled via the ServiceExtras system.
 *
 * Refactored: createReservation → reservation-create.helper.ts
 * Refactored: updateReservation → reservation-update.helper.ts
 */
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
// #217: logChange/diffObjects imports removed — all audit logging moved to createHistoryEntry
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  UpdateStatusDTO,
  ReservationFilters,
  ReservationResponse,
  ReservationStatus,
  UpdateReservationMenuDTO,
} from '../types/reservation.types';
import {
  calculateTotalGuests,
  calculateTotalPrice,
  enrichWithExtrasTotals,
  validateConfirmationDeadline,
} from '../utils/reservation.utils';
import { SelectedOptionDTO } from '../dto/menu-selection.dto';
import { Prisma } from '@/prisma-client';
import { recalculateReservationTotalPrice } from '../utils/recalculate-price';
import { RESERVATION, MENU } from '../i18n/pl';
import { reservationStatusService } from './reservation-status.service';
import { createHistoryEntry } from './reservation-history.helper';
import { RESERVATION_INCLUDE, RESERVATION_LIST_INCLUDE, RESERVATION_DETAIL_INCLUDE } from './reservation.includes';
import { buildPdfData } from './reservation-pdf-data.helper';
import { executeCreateReservation } from './reservation-create.helper';
import { executeUpdateReservation } from './reservation-update.helper';

export class ReservationService {
  async createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse> {
    const reservation = await executeCreateReservation(
      data,
      userId,
      this.validateUserId.bind(this)
    );
    return reservation as unknown as ReservationResponse;
  }

  async updateReservationMenu(reservationId: string, data: UpdateReservationMenuDTO, userId: string): Promise<{ message: string; totalPrice?: number }> {
    await this.validateUserId(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { menuSnapshot: true, client: true, hall: true },
    });

    if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    // #144: Also block menu updates for ARCHIVED reservations
    if (
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.ARCHIVED
    ) {
      throw new AppError(MENU.CANNOT_UPDATE_MENU, 409);
    }

    const client = reservation.client as { firstName: string; lastName: string } | null;
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'N/A';
    /* istanbul ignore next -- hall always included */
    const hall = reservation.hall as { name: string } | null;
    const hallName = hall?.name || 'N/A';

    const adults = data.adultsCount ?? reservation.adults;
    const children = data.childrenCount ?? reservation.children;
    const toddlers = data.toddlersCount ?? reservation.toddlers;
    const guests = calculateTotalGuests(adults, children, toddlers);

    if (data.menuPackageId === null) {
      // Get old package name before removal
      /* istanbul ignore next -- defensive: menuData always has packageName */
      const menuData = reservation.menuSnapshot?.menuData as Record<string, unknown> | null;
      const oldPackageName = menuData?.packageName as string || 'Nieznany pakiet';
      const oldTotalPrice = reservation.menuSnapshot ? Number(reservation.menuSnapshot.totalMenuPrice) : 0;

      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.delete({ where: { id: reservation.menuSnapshot.id } });
      }

      await createHistoryEntry(reservationId, userId, 'MENU_REMOVED', 'menu', 'Pakiet menu', 'Brak', 'Menu usunięte z rezerwacji');

      // Recalculate totalPrice after menu removal
      await recalculateReservationTotalPrice(reservationId);
      return { message: MENU.MENU_REMOVED };
    }

    if (data.menuPackageId) {
      const menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: { menuTemplate: true },
      });
      if (!menuPackage) throw new AppError(MENU.PACKAGE_NOT_FOUND, 404);

      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new AppError(MENU.MIN_GUESTS(menuPackage.minGuests), 400);
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new AppError(MENU.MAX_GUESTS(menuPackage.maxGuests), 400);
      }

      const selectedOptions: SelectedOptionDTO[] = [];
      const optionsPrice = 0;
      const pricePerAdult = Number(menuPackage.pricePerAdult);
      const pricePerChild = Number(menuPackage.pricePerChild);
      const pricePerToddler = Number(menuPackage.pricePerToddler);

      const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
      const totalMenuPrice = packagePrice + optionsPrice;

      // Save old info for audit
      const oldMenuData = reservation.menuSnapshot?.menuData as Record<string, unknown> | null;
      const oldPackageNameForAudit = oldMenuData?.packageName as string || null;
      const oldTotalPriceForAudit = reservation.menuSnapshot ? Number(reservation.menuSnapshot.totalMenuPrice) : 0;

      const snapshotData = {
        reservationId,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: menuPackage.id,
        menuData: {
          packageName: menuPackage.name,
          packageDescription: menuPackage.description,
          templateName: menuPackage.menuTemplate.name,
          pricePerAdult,
          pricePerChild,
          pricePerToddler,
          selectedOptions,
        } as unknown as Prisma.InputJsonValue,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers,
      };

      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.update({ where: { id: reservation.menuSnapshot.id }, data: snapshotData });
      } else {
        await prisma.reservationMenuSnapshot.create({ data: snapshotData });
      }

      // Update guest counts and per-person prices (totalPrice recalculated below)
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { pricePerAdult, pricePerChild, pricePerToddler, adults, children, toddlers, guests },
      });

      // Recalculate totalPrice including extras + discount + surcharge
      const newTotalPrice = await recalculateReservationTotalPrice(reservationId);

      await createHistoryEntry(
        reservationId,
        userId,
        'MENU_UPDATED',
        'menu',
        reservation.menuSnapshot ? 'Poprzedni pakiet' : 'Brak',
        menuPackage.name,
        `Menu zaktualizowane na: ${menuPackage.name}`
      );

      return { message: MENU.MENU_UPDATED, totalPrice: newTotalPrice };
    }

    throw new AppError(MENU.INVALID_MENU_DATA, 400);
  }

  async getReservations(filters?: ReservationFilters): Promise<ReservationResponse[]> {
    const where: Prisma.ReservationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.hallId) where.hallId = filters.hallId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.eventTypeId) where.eventTypeId = filters.eventTypeId;

    if (filters?.dateFrom || filters?.dateTo) {
      where.OR = [
        {
          startDateTime: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          },
        },
        {
          date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        },
      ];
    }

    if (filters?.archived !== undefined) {
      where.archivedAt = filters.archived ? { not: null } : null;
    } else {
      where.archivedAt = null;
    }

    // #144: When no explicit status filter, also exclude ARCHIVED by status
    if (!filters?.status && !filters?.archived) {
      where.status = { not: ReservationStatus.ARCHIVED };
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;

    const reservations = await prisma.reservation.findMany({
      where,
      include: RESERVATION_LIST_INCLUDE,
      orderBy: [{ startDateTime: 'asc' }, { date: 'asc' }, { startTime: 'asc' }],
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return reservations.map(enrichWithExtrasTotals) as unknown as ReservationResponse[];
  }

  async getReservationById(id: string): Promise<ReservationResponse> {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_DETAIL_INCLUDE,
    });

    if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    return enrichWithExtrasTotals(reservation) as unknown as ReservationResponse;
  }

  async updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse> {
    const reservation = await executeUpdateReservation(
      id,
      data,
      userId,
      this.validateUserId.bind(this),
      this.getReservationById.bind(this),
      this.updateReservationMenu.bind(this)
    );
    return reservation as unknown as ReservationResponse;
  }

  // Status operations delegated to ReservationStatusService
  async updateStatus(id: string, data: UpdateStatusDTO, userId: string) {
    return reservationStatusService.updateStatus(id, data, userId);
  }

  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    return reservationStatusService.cancelReservation(id, userId, reason);
  }

  async archiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    return reservationStatusService.archiveReservation(id, userId, reason);
  }

  async unarchiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    return reservationStatusService.unarchiveReservation(id, userId, reason);
  }

  /**
   * Check hall availability for a given time range.
   * Returns whether the slot is available and any conflicting reservations.
   */
  async checkAvailability(
    hallId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeReservationId?: string,
  ): Promise<{ available: boolean; conflicts: Array<{
    id: string;
    clientName: string;
    eventType: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
  }> }> {
    const conflicts = await prisma.reservation.findMany({
      where: {
        hallId,
        status: { notIn: ['CANCELLED'] },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
        startDateTime: { lt: endDateTime },
        endDateTime: { gt: startDateTime },
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        client: { select: { firstName: true, lastName: true } },
        eventType: { select: { name: true } },
      },
      orderBy: { startDateTime: 'asc' },
    });

    const formattedConflicts = conflicts.map((c: any) => ({
      id: c.id,
      clientName: c.client ? `${c.client.firstName} ${c.client.lastName}` : 'Nieznany',
      eventType: c.eventType?.name || 'Nieznany',
      startDateTime: c.startDateTime?.toISOString() || '',
      endDateTime: c.endDateTime?.toISOString() || '',
      status: c.status,
    }));

    return {
      available: formattedConflicts.length === 0,
      conflicts: formattedConflicts,
    };
  }

  /**
   * Prepare reservation data for PDF generation.
   * Maps extras → reservationExtras, categoryExtras for PDF format,
   * strips cancelled deposits and internalNotes.
   */
  async prepareReservationForPDF(id: string) {
    const reservation = await this.getReservationById(id) as any;
    return buildPdfData(reservation);
  }

  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie');
    }
  }
}

export default new ReservationService();
export const reservationService = new ReservationService();
