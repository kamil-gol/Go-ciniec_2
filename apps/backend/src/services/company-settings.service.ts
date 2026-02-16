/**
 * Company Settings Service — Singleton settings for the venue
 */
import { prisma } from '@/lib/prisma';
import { AppError } from '@utils/AppError';
import { logChange } from '@utils/audit-logger';
import logger from '@utils/logger';

class CompanySettingsService {
  async getSettings() {
    const settings = await prisma.companySettings.findFirst();

    if (!settings) {
      return prisma.companySettings.create({
        data: {
          companyName: 'Gościniec Rodzinny',
          defaultCurrency: 'PLN',
          timezone: 'Europe/Warsaw',
        },
      });
    }

    return settings;
  }

  async updateSettings(data: {
    companyName?: string;
    nip?: string;
    regon?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    defaultCurrency?: string;
    timezone?: string;
    invoicePrefix?: string;
    receiptPrefix?: string;
  }, actorId: string) {
    const existing = await prisma.companySettings.findFirst();

    if (!existing) {
      throw AppError.notFound('Ustawienia firmy');
    }

    const updated = await prisma.companySettings.update({
      where: { id: existing.id },
      data,
    });

    await logChange({
      userId: actorId,
      action: 'COMPANY_SETTINGS_UPDATED',
      entityType: 'CompanySettings',
      entityId: existing.id,
      details: { changes: Object.keys(data) },
    });

    logger.info(`Company settings updated by user ${actorId}`);

    return updated;
  }
}

export default new CompanySettingsService();
