/**
 * Archive Scheduler Service — #144
 *
 * Automatically archives CANCELLED reservations after ARCHIVE_AFTER_DAYS.
 * Designed to be called by a daily CRON job (02:00 AM).
 *
 * Logic:
 * 1. Find CANCELLED reservations where updatedAt < NOW() - ARCHIVE_AFTER_DAYS
 * 2. Batch update (max 100 per run): status → ARCHIVED, archivedAt → now()
 * 3. Create audit log entries for each archived reservation
 *
 * Environment:
 *   ARCHIVE_AFTER_DAYS — number of days after cancellation before auto-archive (default: 30)
 */

import { prisma } from '@/lib/prisma';
import { logChange } from '../utils/audit-logger';
import logger from '@utils/logger';

const BATCH_SIZE = 100;
const DEFAULT_ARCHIVE_AFTER_DAYS = 30;

function getArchiveAfterDays(): number {
  const envVal = process.env.ARCHIVE_AFTER_DAYS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    logger.warn(`[Archive] Invalid ARCHIVE_AFTER_DAYS value: "${envVal}", using default ${DEFAULT_ARCHIVE_AFTER_DAYS}`);
  }
  return DEFAULT_ARCHIVE_AFTER_DAYS;
}

export class ArchiveSchedulerService {
  /**
   * Archive cancelled reservations older than ARCHIVE_AFTER_DAYS.
   * Returns count of archived reservations and their IDs.
   */
  async archiveCancelled(): Promise<{ archivedCount: number; archivedIds: string[] }> {
    const archiveAfterDays = getArchiveAfterDays();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);

    logger.info(
      `[Archive] Looking for CANCELLED reservations older than ${archiveAfterDays} days (cutoff: ${cutoffDate.toISOString()})`
    );

    // Find candidates: CANCELLED, not yet archived, updated before cutoff
    const candidates = await prisma.reservation.findMany({
      where: {
        status: 'CANCELLED',
        archivedAt: null,
        updatedAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        client: { select: { firstName: true, lastName: true } },
        hall: { select: { name: true } },
      },
      take: BATCH_SIZE,
      orderBy: { updatedAt: 'asc' },
    });

    if (candidates.length === 0) {
      return { archivedCount: 0, archivedIds: [] };
    }

    const candidateIds = candidates.map(c => c.id);
    const now = new Date();

    // Batch update in transaction
    await prisma.$transaction(async (tx) => {
      await tx.reservation.updateMany({
        where: { id: { in: candidateIds } },
        data: {
          status: 'ARCHIVED',
          archivedAt: now,
        },
      });

      // Create history entries for each reservation
      for (const candidate of candidates) {
        await tx.reservationHistory.create({
          data: {
            reservationId: candidate.id,
            changedByUserId: 'SYSTEM',
            changeType: 'AUTO_ARCHIVED',
            fieldName: 'status',
            oldValue: 'CANCELLED',
            newValue: 'ARCHIVED',
            reason: `Auto-archiwizacja: rezerwacja anulowana ponad ${archiveAfterDays} dni temu`,
          },
        });
      }
    });

    // Fire-and-forget audit logs (outside transaction for performance)
    for (const candidate of candidates) {
      const clientName = candidate.client
        ? `${candidate.client.firstName} ${candidate.client.lastName}`
        : 'Nieznany klient';
      const hallName = candidate.hall?.name || 'Brak sali';

      logChange({
        userId: 'SYSTEM',
        action: 'AUTO_ARCHIVED',
        entityType: 'RESERVATION',
        entityId: candidate.id,
        details: {
          description: `Auto-archiwizacja rezerwacji: ${clientName} | ${hallName}`,
          archiveAfterDays,
          reason: `Anulowana ponad ${archiveAfterDays} dni temu`,
        },
      }).catch((err) => {
        logger.error(`[Archive] Audit log failed for ${candidate.id}:`, err);
      });
    }

    return {
      archivedCount: candidates.length,
      archivedIds: candidateIds,
    };
  }
}

export default new ArchiveSchedulerService();
