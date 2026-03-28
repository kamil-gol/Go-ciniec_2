/**
 * Notification Controller
 * Issue #128: System powiadomień
 */

import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { AppError } from '../utils/AppError';

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized();

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getByUser(userId, {
      page,
      pageSize,
      unreadOnly,
    });

    res.json({ success: true, ...result });
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized();

    const count = await notificationService.getUnreadCount(userId);

    res.json({ success: true, data: { count } });
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized();

    const { id } = req.params;
    await notificationService.markAsRead(id, userId);

    res.json({ success: true, message: 'Powiadomienie oznaczone jako przeczytane' });
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized();

    await notificationService.markAllAsRead(userId);

    res.json({ success: true, message: 'Wszystkie powiadomienia oznaczone jako przeczytane' });
  }
}

export default new NotificationController();
