/**
 * Roles Controller — Role management for Settings module
 */
import { Request, Response } from 'express';
import rolesService from '@services/roles.service';
import { AppError } from '@utils/AppError';

export class RolesController {
  async getRoles(_req: Request, res: Response): Promise<void> {
    const roles = await rolesService.getRoles();
    res.json({ success: true, data: roles });
  }

  async getRoleById(req: Request, res: Response): Promise<void> {
    const role = await rolesService.getRoleById(req.params.id);
    res.json({ success: true, data: role });
  }

  async createRole(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const { name, slug, description, color, permissionIds } = req.body;

    if (!name || !slug || !permissionIds || !Array.isArray(permissionIds)) {
      throw AppError.badRequest('Wymagane pola: name, slug, permissionIds (array)');
    }

    if (!/^[a-z0-9_-]+$/.test(slug)) {
      throw AppError.badRequest('Slug może zawierać tylko małe litery, cyfry, - i _');
    }

    const role = await rolesService.createRole(
      { name, slug, description, color, permissionIds },
      actorId
    );

    res.status(201).json({ success: true, data: role, message: 'Rola utworzona' });
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const role = await rolesService.updateRole(req.params.id, req.body, actorId);
    res.json({ success: true, data: role, message: 'Rola zaktualizowana' });
  }

  async updateRolePermissions(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const { permissionIds } = req.body;
    if (!permissionIds || !Array.isArray(permissionIds)) {
      throw AppError.badRequest('permissionIds musi być tablicą');
    }

    const role = await rolesService.updateRolePermissions(
      req.params.id,
      permissionIds,
      actorId
    );

    res.json({ success: true, data: role, message: 'Uprawnienia roli zaktualizowane' });
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    await rolesService.deleteRole(req.params.id, actorId);
    res.json({ success: true, message: 'Rola usunięta' });
  }
}

export default new RolesController();
