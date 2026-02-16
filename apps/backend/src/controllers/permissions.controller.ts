/**
 * Permissions Controller — List permissions for matrix UI
 */
import { Request, Response } from 'express';
import permissionsService from '@services/permissions.service';

export class PermissionsController {
  async getPermissions(_req: Request, res: Response): Promise<void> {
    const permissions = await permissionsService.getPermissions();
    res.json({ success: true, data: permissions });
  }

  async getPermissionsGrouped(_req: Request, res: Response): Promise<void> {
    const groups = await permissionsService.getPermissionsGrouped();
    res.json({ success: true, data: groups });
  }
}

export default new PermissionsController();
