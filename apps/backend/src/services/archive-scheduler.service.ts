/**
 * Archive Scheduler Service — #144 (Phase 4)
 *
 * Automatically archives CANCELLED reservations after archiveAfterDays.
 * Designed to be called by a daily CRON job (02:00 AM) or manually from admin panel.
 *
 * Config priority:
 *   1. DB: CompanySettings.archiveAfterDays
 *   2. ENV: ARCHIVE_AFTER_DAYS
 *   3. Default: 30
 *
 * Logic:
 *   1. Find CANCELLED reservations where updatedAt < NOW() - archiveAfterDays
 *   2. Batch update (max 100 per run): status → ARCHIVED, archivedAt → now()
 *   3. Create audit log entries for each archived reservation
 */

import { prisma } from '@/lib/prisma';
import { logChange } from '../utils/audit-logger';
import logger from '@utils/logger';

const BATCH_SIZE = 100;
const DEFAULT_ARCHIVE_AFTER_DAYS = 30;

/**
 * Resolve archiveAfterDays from DB → env → default.
 */
async function resolveArchiveAfterDays(): Promise<number> {
  // 1. Try DB settings
  try {
    const settings = await prisma.companySettings.findFirst({
      select: { archiveAfterDays: true },
    });
    if (settings && settings.archiveAfterDays > 0) {
      return settings.archiveAfterDays;
    }
  } catch (err) {
    logger.warn('[Archive] Failed to read archiveAfterDays from DB, falling back to env/default');
  }

  // 2. Fallback to env var
  const envVal = process.env.ARCHIVE_AFTER_DAYS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    logger.warn(`[Archive] Invalid ARCHIVE_AFTER_DAYS value: "${envVal}", using default ${DEFAULT_ARCHIVE_AFTER_DAYS}`);
  }

  // 3. Default
  return DEFAULT_ARCHIVE_AFTER_DAYS;
}

export class ArchiveSchedulerService {
  /**
   * Archive cancelled reservations older than archiveAfterDays.
   * Returns count of archived reservations, their IDs, and the config used.
   */
  async archiveCancelled(): Promise<{
    archivedCount: number;
    archivedIds: string[];
    archiveAfterDays: number;
  }> {
    const archiveAfterDays = await resolveArchiveAfterDays();
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
      return { archivedCount: 0, archivedIds: [], archiveAfterDays };
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
      archiveAfterDays,
    };
  }
}

export default new ArchiveSchedulerService();
