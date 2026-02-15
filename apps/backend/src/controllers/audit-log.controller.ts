/**
 * Audit Log Controller
 * Handles HTTP requests for audit trail / activity logs
 */

import { Request, Response } from 'express';
import auditLogService from '../services/audit-log.service';

class AuditLogController {
  /**
   * GET /api/audit-log
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        entityType,
        action,
        userId,
        entityId,
        dateFrom,
        dateTo,
        page,
        pageSize
      } = req.query;

      const result = await auditLogService.getAuditLogs({
        entityType: entityType as string,
        action: action as string,
        userId: userId as string,
        entityId: entityId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 50
      });

      res.json(result);
    } catch (error: any) {
      console.error('[AuditLogController] Error fetching audit logs:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania logów',
        message: error.message
      });
    }
  }

  /**
   * GET /api/audit-log/entity/:entityType/:entityId
   * Get audit logs for specific entity
   */
  async getEntityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      const logs = await auditLogService.getEntityLogs(entityType, entityId);

      res.json(logs);
    } catch (error: any) {
      console.error('[AuditLogController] Error fetching entity logs:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania logów encji',
        message: error.message
      });
    }
  }

  /**
   * GET /api/audit-log/recent
   * Get recent activity (last N logs)
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 10;

      const logs = await auditLogService.getRecentActivity(limitNum);

      res.json(logs);
    } catch (error: any) {
      console.error('[AuditLogController] Error fetching recent activity:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania ostatniej aktywności',
        message: error.message
      });
    }
  }

  /**
   * GET /api/audit-log/meta/entity-types
   * Get available entity types for filtering
   */
  async getEntityTypes(req: Request, res: Response): Promise<void> {
    try {
      const types = await auditLogService.getEntityTypes();
      res.json(types);
    } catch (error: any) {
      console.error('[AuditLogController] Error fetching entity types:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania typów encji',
        message: error.message
      });
    }
  }

  /**
   * GET /api/audit-log/meta/actions
   * Get available actions for filtering
   */
  async getActions(req: Request, res: Response): Promise<void> {
    try {
      const actions = await auditLogService.getActions();
      res.json(actions);
    } catch (error: any) {
      console.error('[AuditLogController] Error fetching actions:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania akcji',
        message: error.message
      });
    }
  }

  /**
   * GET /api/audit-log/statistics
   * Get audit log statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo } = req.query;

      const stats = await auditLogService.getStatistics(
        dateFrom as string,
        dateTo as string
      );

      res.json(stats);
    } catch (error: any) {
      console.error('[AuditLogController] Error fetching statistics:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania statystyk',
        message: error.message
      });
    }
  }
}

export default new AuditLogController();
