/**
 * Audit Log Controller
 * Handles HTTP requests for audit trail / activity logs
 */
import { Request, Response } from 'express';
declare class AuditLogController {
    /**
     * GET /api/audit-log
     * Get audit logs with filters and pagination
     */
    getAuditLogs(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit-log/entity/:entityType/:entityId
     * Get audit logs for specific entity
     */
    getEntityLogs(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit-log/recent
     * Get recent activity (last N logs)
     */
    getRecentActivity(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit-log/meta/entity-types
     * Get available entity types for filtering
     */
    getEntityTypes(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit-log/meta/actions
     * Get available actions for filtering
     */
    getActions(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit-log/statistics
     * Get audit log statistics
     */
    getStatistics(req: Request, res: Response): Promise<void>;
}
declare const _default: AuditLogController;
export default _default;
//# sourceMappingURL=audit-log.controller.d.ts.map