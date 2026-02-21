/**
 * Audit Log Routes
 * API endpoints for audit trail / activity logs
 */
import { Router } from 'express';
import auditLogController from '../controllers/audit-log.controller';
import { authMiddleware } from '../middlewares/auth';
const router = Router();
// All audit log endpoints require authentication
router.use(authMiddleware);
/**
 * GET /api/audit-log
 * Get audit logs with filters and pagination
 * Query params:
 *   - entityType: string (optional) - Filter by entity type (CLIENT, RESERVATION, etc.)
 *   - action: string (optional) - Filter by action (CREATE, UPDATE, DELETE, etc.)
 *   - userId: string (optional) - Filter by user ID
 *   - entityId: string (optional) - Filter by entity ID
 *   - dateFrom: string (optional) - Start date (ISO format)
 *   - dateTo: string (optional) - End date (ISO format)
 *   - page: number (optional, default: 1) - Page number
 *   - pageSize: number (optional, default: 50) - Items per page
 */
router.get('/', auditLogController.getAuditLogs);
/**
 * GET /api/audit-log/recent
 * Get recent activity (last N logs)
 * Query params:
 *   - limit: number (optional, default: 10) - Number of logs to return
 */
router.get('/recent', auditLogController.getRecentActivity);
/**
 * GET /api/audit-log/statistics
 * Get audit log statistics
 * Query params:
 *   - dateFrom: string (optional) - Start date
 *   - dateTo: string (optional) - End date
 */
router.get('/statistics', auditLogController.getStatistics);
/**
 * GET /api/audit-log/meta/entity-types
 * Get available entity types for filtering
 */
router.get('/meta/entity-types', auditLogController.getEntityTypes);
/**
 * GET /api/audit-log/meta/actions
 * Get available actions for filtering
 */
router.get('/meta/actions', auditLogController.getActions);
/**
 * GET /api/audit-log/entity/:entityType/:entityId
 * Get audit logs for specific entity
 * Params:
 *   - entityType: string - Entity type (CLIENT, RESERVATION, etc.)
 *   - entityId: string - Entity ID
 */
router.get('/entity/:entityType/:entityId', auditLogController.getEntityLogs);
export default router;
//# sourceMappingURL=audit-log.routes.js.map