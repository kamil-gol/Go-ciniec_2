/**
 * Audit Log Service
 * Service for retrieving and filtering activity logs (audit trail)
 */
export interface AuditLogFilters {
    entityType?: string;
    action?: string;
    userId?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}
export interface AuditLogResponse {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
declare class AuditLogService {
    /**
     * Get audit logs with filters and pagination
     */
    getAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse>;
    /**
     * Get audit logs for specific entity
     */
    getEntityLogs(entityType: string, entityId: string): Promise<any[]>;
    /**
     * Get recent activity (last N logs)
     */
    getRecentActivity(limit?: number): Promise<any[]>;
    /**
     * Get available entity types for filtering
     */
    getEntityTypes(): Promise<string[]>;
    /**
     * Get available actions for filtering
     */
    getActions(): Promise<string[]>;
    /**
     * Get audit log statistics
     */
    getStatistics(dateFrom?: string, dateTo?: string): Promise<{
        totalLogs: number;
        byEntityType: {
            entityType: string;
            count: number;
        }[];
        byAction: {
            action: string;
            count: number;
        }[];
        byUser: {
            userId: string | null;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null | undefined;
            count: number;
        }[];
    }>;
}
declare const _default: AuditLogService;
export default _default;
//# sourceMappingURL=audit-log.service.d.ts.map