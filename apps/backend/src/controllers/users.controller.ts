/**
 * Users Controller — User management for Settings module
 */
import { Request, Response } from 'express';
import usersService from '@services/users.service';
import { AppError } from '@utils/AppError';

export class UsersController {
  async getUsers(req: Request, res: Response): Promise<void> {
    const result = await usersService.getUsers({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string,
      roleId: req.query.roleId as string,
      isActive: req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result.users, pagination: result.pagination });
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    const user = await usersService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const actorId = (req as any).user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const { email, password, firstName, lastName, roleId } = req.body;

    if (!email || !password || !firstName || !lastName || !roleId) {
      throw AppError.badRequest('Wymagane pola: email, password, firstName, lastName, roleId');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    const user = await usersService.createUser(
      { email, password, firstName, lastName, roleId },
      actorId
    );

    res.status(201).json({ success: true, data: user, message: 'Użytkownik utworzony' });
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const actorId = (req as any).user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const user = await usersService.updateUser(req.params.id, req.body, actorId);
    res.json({ success: true, data: user, message: 'Użytkownik zaktualizowany' });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const actorId = (req as any).user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const { newPassword } = req.body;
    if (!newPassword) throw AppError.badRequest('Nowe hasło jest wymagane');

    await usersService.changePassword(req.params.id, newPassword, actorId);
    res.json({ success: true, message: 'Hasło zmienione' });
  }

  async toggleActive(req: Request, res: Response): Promise<void> {
    const actorId = (req as any).user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const result = await usersService.toggleActive(req.params.id, actorId);
    res.json({ success: true, data: result, message: result.isActive ? 'Użytkownik aktywowany' : 'Użytkownik dezaktywowany' });
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const actorId = (req as any).user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    await usersService.deleteUser(req.params.id, actorId);
    res.json({ success: true, message: 'Użytkownik usunięty' });
  }
}

export default new UsersController();
