/**
 * Reservation History Helper
 * Shared createHistoryEntry function used by reservation.service.ts and reservation-status.service.ts
 */
import { prisma } from '@/lib/prisma';

export async function createHistoryEntry(
  reservationId: string,
  userId: string,
  changeType: string,
  fieldName: string | null,
  oldValue: string | null,
  newValue: string | null,
  reason: string
): Promise<void> {
  await prisma.reservationHistory.create({
    data: { reservationId, changedByUserId: userId, changeType, fieldName, oldValue, newValue, reason },
  });
}
