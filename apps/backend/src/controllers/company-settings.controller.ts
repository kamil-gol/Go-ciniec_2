/**
 * Company Settings Controller
 */
import { Request, Response } from 'express';
import companySettingsService from '@services/company-settings.service';
import { AppError } from '@utils/AppError';

export class CompanySettingsController {
  async getSettings(_req: Request, res: Response): Promise<void> {
    const settings = await companySettingsService.getSettings();
    res.json({ success: true, data: settings });
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    if (!actorId) throw AppError.unauthorized('Nie zalogowano');

    const settings = await companySettingsService.updateSettings(req.body, actorId);
    res.json({ success: true, data: settings, message: 'Ustawienia firmy zaktualizowane' });
  }
}

export default new CompanySettingsController();
