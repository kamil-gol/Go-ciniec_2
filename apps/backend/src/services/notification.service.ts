/**
import { getErrorMessage } from '@/utils/AppError';
 * Notification Service
 * Issue #128: System powiadomień
 */

import { prisma } from '@/lib/prisma';
import logger from '@utils/logger';

export interface CreateNotificationData {
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  excludeUserId?: string;
}

export class NotificationService {
  /**
   * Create a notification for ALL active staff/admin users.
   * Optionally exclude the user who triggered the action.
   */
  async createForAll(data: CreateNotificationData): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          ...(data.excludeUserId ? { id: { not: data.excludeUserId } } : {}),
        },
        select: { id: true },
      });

      if (users.length === 0) return 0;

      const result = await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: data.type,
          title: data.title,
          message: data.message,
          entityType: data.entityType,
          entityId: data.entityId,
        })),
      });

      return result.count;
    } catch (error: unknown) {
      logger.error('[NotificationService] createForAll failed:', getErrorMessage(error));
      return 0;
    }
  }

  /**
   * Create a notification for a specific user.
   */
  async createForUser(
    userId: string,
    data: Omit<CreateNotificationData, 'excludeUserId'>
  ) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      });
    } catch (error: unknown) {
      logger.error('[NotificationService] createForUser failed:', getErrorMessage(error));
      return null;
    }
  }

  /**
   * Get notifications for a user, paginated, optionally filtered by unread.
   */
  async getByUser(
    userId: string,
    options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}

export default new NotificationService();
