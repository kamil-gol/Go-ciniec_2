/**
 * Audit Log Service
 * Service for retrieving and filtering activity logs (audit trail)
 */

import { prisma } from '@/lib/prisma';

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

class AuditLogService {
  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse> {
    const {
      entityType,
      action,
      userId,
      entityId,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 50
    } = filters;

    // Build where clause
    const where: any = {};

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // Include full day
        where.createdAt.lte = endDate;
      }
    }

    // Count total
    const total = await prisma.activityLog.count({ where });

    // Get paginated logs
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: logs,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Get audit logs for specific entity
   */
  async getEntityLogs(entityType: string, entityId: string): Promise<any[]> {
    return prisma.activityLog.findMany({
      where: {
        entityType,
        entityId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get recent activity (last N logs)
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    return prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get available entity types for filtering
   */
  async getEntityTypes(): Promise<string[]> {
    const result = await prisma.activityLog.findMany({
      select: { entityType: true },
      distinct: ['entityType'],
      where: { entityType: { not: null } }
    });

    return result
      .map(r => r.entityType)
      .filter((type): type is string => type !== null)
      .sort();
  }

  /**
   * Get available actions for filtering
   */
  async getActions(): Promise<string[]> {
    const result = await prisma.activityLog.findMany({
      select: { action: true },
      distinct: ['action']
    });

    return result.map(r => r.action).sort();
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(dateFrom?: string, dateTo?: string) {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Total logs
    const totalLogs = await prisma.activityLog.count({ where });

    // By entity type
    const byEntityType = await prisma.activityLog.groupBy({
      by: ['entityType'],
      where,
      _count: { entityType: true }
    });

    // By action
    const byAction = await prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true }
    });

    // By user
    const byUser = await prisma.activityLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    });

    // Get user details
    const userIds = byUser.map(u => u.userId).filter((id): id is string => id !== null);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      totalLogs,
      byEntityType: byEntityType.map(item => ({
        entityType: item.entityType || 'Unknown',
        count: item._count.entityType
      })),
      byAction: byAction.map(item => ({
        action: item.action,
        count: item._count.action
      })),
      byUser: byUser.map(item => ({
        userId: item.userId,
        user: item.userId ? userMap.get(item.userId) : null,
        count: item._count.userId
      }))
    };
  }
}

export default new AuditLogService();
