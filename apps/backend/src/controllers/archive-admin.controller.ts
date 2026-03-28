/**
 * Archive Admin Controller — Phase 4 (#144)
 *
 * Admin endpoints for archive configuration and manual trigger.
 *
 * Endpoints:
 *   GET  /api/settings/archive          — current settings + pending candidates count
 *   PUT  /api/settings/archive          — update archiveAfterDays (1–365)
 *   POST /api/settings/archive/run-now  — trigger archive immediately
 */
import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import archiveSchedulerService from '@services/archive-scheduler.service';
import { AppError } from '@utils/AppError';
import { logChange } from '@utils/audit-logger';
import logger from '@utils/logger';

export class ArchiveAdminController {
  /**
   * GET /api/settings/archive
   * Returns current archive config and statistics about pending candidates.
   */
  async getArchiveSettings(_req: Request, res: Response): Promise<void> {
    const settings = await prisma.companySettings.findFirst({
      select: { archiveAfterDays: true },
    });

    const archiveAfterDays = settings?.archiveAfterDays ?? 30;

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);

    // Count candidates currently eligible for archiving
    const pendingCandidatesCount = await prisma.reservation.count({
      where: {
        status: 'CANCELLED',
        archivedAt: null,
        updatedAt: { lt: cutoffDate },
      },
    });

    // Count total cancelled (not yet archived) for context
    const totalCancelledCount = await prisma.reservation.count({
      where: {
        status: 'CANCELLED',
        archivedAt: null,
      },
    });

    // Count already archived
    const archivedTotalCount = await prisma.reservation.count({
      where: { status: 'ARCHIVED' },
    });

    res.json({
      success: true,
      data: {
        archiveAfterDays,
        pendingCandidatesCount,
        totalCancelledCount,
        archivedTotalCount,
        cutoffDate: cutoffDate.toISOString(),
      },
    });
  }

  /**
   * PUT /api/settings/archive
   * Update archiveAfterDays setting. Accepts { archiveAfterDays: number }.
   */
  async updateArchiveSettings(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const { archiveAfterDays } = req.body;

    if (archiveAfterDays === undefined || archiveAfterDays === null) {
      throw AppError.badRequest('Pole archiveAfterDays jest wymagane');
    }

    const days = parseInt(archiveAfterDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      throw AppError.badRequest('archiveAfterDays musi być liczbą od 1 do 365');
    }

    const existing = await prisma.companySettings.findFirst();
    if (!existing) {
      throw AppError.notFound('Ustawienia firmy');
    }

    const oldValue = existing.archiveAfterDays ?? 30;

    const updated = await prisma.companySettings.update({
      where: { id: existing.id },
      data: { archiveAfterDays: days },
    });

    await logChange({
      userId: actorId,
      action: 'ARCHIVE_SETTINGS_UPDATED',
      entityType: 'CompanySettings',
      entityId: existing.id,
      details: {
        field: 'archiveAfterDays',
        oldValue,
        newValue: days,
      },
    });

    logger.info(`[Archive] Settings updated by user ${actorId}: archiveAfterDays ${oldValue} → ${days}`);

    res.json({
      success: true,
      data: { archiveAfterDays: updated.archiveAfterDays },
      message: `Czas auto-archiwizacji zmieniony na ${days} dni`,
    });
  }

  /**
   * POST /api/settings/archive/run-now
   * Manually trigger the archive process (same logic as CRON).
   */
  async runArchiveNow(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    logger.info(`[Archive] Manual archive triggered by user ${actorId}`);

    const result = await archiveSchedulerService.archiveCancelled();

    await logChange({
      userId: actorId,
      action: 'MANUAL_ARCHIVE_RUN',
      entityType: 'RESERVATION',
      entityId: 'BATCH',
      details: {
        archivedCount: result.archivedCount,
        archivedIds: result.archivedIds,
        archiveAfterDays: result.archiveAfterDays,
        triggeredBy: 'ADMIN_PANEL',
      },
    });

    res.json({
      success: true,
      data: result,
      message: result.archivedCount > 0
        ? `Zarchiwizowano ${result.archivedCount} rezerwacji`
        : 'Brak rezerwacji do archiwizacji',
    });
  }
}

export default new ArchiveAdminController();
