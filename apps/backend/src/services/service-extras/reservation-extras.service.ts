// apps/backend/src/services/service-extras/reservation-extras.service.ts

/**
 * Service Extra — Reservation extras assignment & management.
 * Extracted from serviceExtra.service.ts for decomposition.
 */

import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../../utils/audit-logger';
import { recalculateReservationTotalPrice } from '../../utils/recalculate-price';
import {
  AssignExtraDTO,
  BulkAssignExtrasDTO,
  UpdateReservationExtraDTO,
  ReservationExtraResponse,
  ReservationExtrasWithTotal,
} from '../../types/serviceExtra.types';
import { calculateTotalPrice, VALID_STATUSES } from './extras.helpers';

export async function getReservationExtras(reservationId: string): Promise<ReservationExtrasWithTotal> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) throw new Error('Nie znaleziono rezerwacji');

  const extras = await prisma.reservationExtra.findMany({
    where: { reservationId },
    include: {
      serviceItem: {
        include: { category: true },
      },
    },
    orderBy: [
      { serviceItem: { category: { displayOrder: 'asc' } } },
      { serviceItem: { displayOrder: 'asc' } },
    ],
  });

  const totalExtrasPrice = extras.reduce(
    (sum, e) => sum + Number(e.totalPrice),
    0
  );

  return {
    extras: extras as unknown as ReservationExtraResponse[],
    totalExtrasPrice,
    count: extras.length,
  };
}

export async function assignExtra(
  reservationId: string,
  data: AssignExtraDTO,
  userId: string,
): Promise<ReservationExtraResponse> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) throw new Error('Nie znaleziono rezerwacji');

  const item = await prisma.serviceItem.findUnique({
    where: { id: data.serviceItemId },
    include: { category: true },
  });
  if (!item) throw new Error('Nie znaleziono pozycji usługi');
  if (!item.isActive) throw new Error('Pozycja usługi jest nieaktywna');

  // Check if item requires a note
  if (item.requiresNote && (!data.note || data.note.trim().length === 0)) {
    throw new Error(`Pole "${item.noteLabel || 'Uwagi'}" jest wymagane dla tej pozycji`);
  }

  // PER_UNIT requires explicit quantity >= 1
  if (item.priceType === 'PER_UNIT') {
    if (!data.quantity || data.quantity < 1) {
      throw new Error('Dla pozycji "Za sztukę" wymagane jest podanie ilości (min. 1)');
    }
  }

  // Handle exclusive categories — only 1 item from this category per reservation
  // When category.isExclusive is true, adding a new item auto-replaces the existing one
  if (item.category?.isExclusive) {
    const existingFromCategory = await prisma.reservationExtra.findMany({
      where: {
        reservationId,
        serviceItem: { categoryId: item.categoryId },
      },
      include: { serviceItem: true },
    });

    if (existingFromCategory.length > 0) {
      // Auto-replace: remove existing item(s) from this exclusive category
      await prisma.reservationExtra.deleteMany({
        where: {
          id: { in: existingFromCategory.map((e) => e.id) },
        },
      });

      // Log the auto-replacement
      const replacedNames = existingFromCategory.map(e => e.serviceItem?.name || 'Nieznana').join(', ');
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Automatycznie zastąpiono w kategorii wyłącznej "${item.category.name}": ${replacedNames} → ${item.name}`,
          field: 'extras',
          data: {
            categoryName: item.category.name,
            replaced: replacedNames,
            newItem: item.name,
          },
        },
      });
    }
  }

  // Check if already assigned (upsert)
  const existingExtra = await prisma.reservationExtra.findFirst({
    where: { reservationId, serviceItemId: data.serviceItemId },
  });

  if (existingExtra) {
    throw new Error('Ta pozycja jest już dodana do rezerwacji');
  }

  // Calculate price
  const quantity = data.quantity ?? 1;
  const unitPrice = data.customPrice !== undefined ? data.customPrice : Number(item.basePrice);
  const totalPrice = calculateTotalPrice(
    item.priceType,
    unitPrice,
    quantity,
    reservation.adults,
    reservation.children,
  );

  const extra = await prisma.reservationExtra.create({
    data: {
      reservationId,
      serviceItemId: data.serviceItemId,
      quantity,
      unitPrice,
      priceType: item.priceType,
      totalPrice,
      note: data.note?.trim() || null,
      status: 'PENDING',
    },
    include: {
      serviceItem: { include: { category: true } },
    },
  });

  // Update reservation extras total + recalculate totalPrice
  await recalculateReservationTotalPrice(reservationId);

  // Log on extra-level (item audit trail)
  await logChange({
    userId,
    action: 'CREATE',
    entityType: 'RESERVATION_EXTRA',
    entityId: extra.id,
    details: {
      description: `Dodano usługę dodatkową: ${item.name} do rezerwacji`,
      data: {
        reservationId,
        itemName: item.name,
        priceType: item.priceType,
        quantity,
        totalPrice: totalPrice.toString(),
      },
    },
  });

  // #217: duplicate RESERVATION-level logChange removed — RESERVATION_EXTRA entry above is sufficient

  return extra as unknown as ReservationExtraResponse;
}

export async function bulkAssignExtras(
  reservationId: string,
  data: BulkAssignExtrasDTO,
  userId: string,
): Promise<ReservationExtrasWithTotal> {
  // Remove all existing extras
  await prisma.reservationExtra.deleteMany({
    where: { reservationId },
  });

  // Add all new ones
  for (const extraData of data.extras) {
    await assignExtra(reservationId, extraData, userId);
  }

  // Final recalculation after all extras assigned
  await recalculateReservationTotalPrice(reservationId);

  await logChange({
    userId,
    action: 'BULK_ASSIGN',
    entityType: 'RESERVATION_EXTRA',
    entityId: reservationId,
    details: {
      description: `Zaktualizowano usługi dodatkowe rezerwacji (${data.extras.length} pozycji)`,
      count: data.extras.length,
    },
  });

  // #217: duplicate RESERVATION-level logChange removed — BULK_ASSIGN entry above is sufficient

  return getReservationExtras(reservationId);
}

export async function updateReservationExtra(
  reservationId: string,
  extraId: string,
  data: UpdateReservationExtraDTO,
  userId: string,
): Promise<ReservationExtraResponse> {
  const existing = await prisma.reservationExtra.findFirst({
    where: { id: extraId, reservationId },
    include: { serviceItem: true },
  });
  if (!existing) throw new Error('Nie znaleziono dodatku rezerwacji');

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) throw new Error('Nie znaleziono rezerwacji');

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    throw new Error(`Nieprawidłowy status. Użyj: ${VALID_STATUSES.join(', ')}`);
  }

  // PER_UNIT requires quantity >= 1
  if (data.quantity !== undefined && existing.priceType === 'PER_UNIT' && data.quantity < 1) {
    throw new Error('Dla pozycji "Za sztukę" ilość musi wynosić min. 1');
  }

  const updateData: Record<string, unknown> = {};
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.note !== undefined) updateData.note = data.note?.trim() || null;
  if (data.customPrice !== undefined) {
    updateData.unitPrice = data.customPrice ?? Number(existing.serviceItem.basePrice);
  }
  if (data.status !== undefined) updateData.status = data.status;

  // Recalculate total price if quantity or price changed
  const newQuantity = data.quantity ?? existing.quantity;
  const newUnitPrice = updateData.unitPrice !== undefined
    ? (updateData.unitPrice as number)
    : Number(existing.unitPrice);

  updateData.totalPrice = calculateTotalPrice(
    existing.priceType,
    newUnitPrice,
    newQuantity,
    reservation.adults,
    reservation.children,
  );

  const extra = await prisma.reservationExtra.update({
    where: { id: extraId },
    data: updateData,
    include: {
      serviceItem: { include: { category: true } },
    },
  });

  // Recalculate reservation total (extras + base + surcharge - discount)
  await recalculateReservationTotalPrice(reservationId);

  const changes = diffObjects(existing, extra);
  if (Object.keys(changes).length > 0) {
    // Log on extra-level (item audit trail)
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'RESERVATION_EXTRA',
      entityId: extra.id,
      details: {
        description: `Zaktualizowano usługę dodatkową: ${existing.serviceItem.name}`,
        changes,
      },
    });

    // #217: duplicate RESERVATION-level logChange removed — RESERVATION_EXTRA entry above is sufficient
  }

  return extra as unknown as ReservationExtraResponse;
}

export async function removeReservationExtra(
  reservationId: string,
  extraId: string,
  userId: string,
): Promise<void> {
  const existing = await prisma.reservationExtra.findFirst({
    where: { id: extraId, reservationId },
    include: { serviceItem: true },
  });
  if (!existing) throw new Error('Nie znaleziono dodatku rezerwacji');

  await prisma.reservationExtra.delete({ where: { id: extraId } });

  // Recalculate reservation total (extras + base + surcharge - discount)
  await recalculateReservationTotalPrice(reservationId);

  // Log on extra-level (item audit trail)
  await logChange({
    userId,
    action: 'DELETE',
    entityType: 'RESERVATION_EXTRA',
    entityId: extraId,
    details: {
      description: `Usunięto usługę dodatkową: ${existing.serviceItem.name}`,
      deletedData: {
        itemName: existing.serviceItem.name,
        totalPrice: existing.totalPrice.toString(),
      },
    },
  });

  // #217: duplicate RESERVATION-level logChange removed — RESERVATION_EXTRA DELETE entry above is sufficient
}
