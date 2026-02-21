/**
 * CompanySettingsService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    companySettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import companySettingsService from '../../../services/company-settings.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const ACTOR = 'actor-001';

const SETTINGS = {
  id: 'cs-001', companyName: 'Gościniec Rodzinny', nip: '1234567890',
  address: 'ul. Główna 1', city: 'Katowice', postalCode: '40-001',
  phone: '+48123456789', email: 'biuro@gosciniec.pl', defaultCurrency: 'PLN',
  timezone: 'Europe/Warsaw',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.companySettings.findFirst.mockResolvedValue(SETTINGS);
  mockPrisma.companySettings.create.mockResolvedValue(SETTINGS);
  mockPrisma.companySettings.update.mockResolvedValue(SETTINGS);
});

describe('CompanySettingsService', () => {
  describe('getSettings()', () => {
    it('should return existing settings', async () => {
      const result = await companySettingsService.getSettings();
      expect(result.companyName).toBe('Gościniec Rodzinny');
      expect(mockPrisma.companySettings.create).not.toHaveBeenCalled();
    });

    it('should create default settings when none exist', async () => {
      mockPrisma.companySettings.findFirst.mockResolvedValue(null);
      await companySettingsService.getSettings();
      expect(mockPrisma.companySettings.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ companyName: 'Gościniec Rodzinny' }) })
      );
    });
  });

  describe('updateSettings()', () => {
    it('should update and audit', async () => {
      const result = await companySettingsService.updateSettings({ companyName: 'Nowa Nazwa' }, ACTOR);
      expect(mockPrisma.companySettings.update).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'COMPANY_SETTINGS_UPDATED' }));
    });

    it('should throw when settings not found', async () => {
      mockPrisma.companySettings.findFirst.mockResolvedValue(null);
      await expect(companySettingsService.updateSettings({ companyName: 'X' }, ACTOR)).rejects.toThrow();
    });
  });
});
