/**
 * CompanySettingsController — Unit Tests
 */
jest.mock('../../../services/company-settings.service', () => ({
  __esModule: true,
  default: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
}));

import { CompanySettingsController } from '../../../controllers/company-settings.controller';
import companySettingsService from '../../../services/company-settings.service';

const controller = new CompanySettingsController();
const svc = companySettingsService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: { id: 1 },
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('CompanySettingsController', () => {
  it('getSettings — returns settings', async () => {
    svc.getSettings.mockResolvedValue({ companyName: 'Gościniec', nip: '123' });
    const response = res();
    await controller.getSettings(req(), response);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ companyName: 'Gościniec' }) })
    );
  });

  it('updateSettings — throws 401 when no user', async () => {
    await expect(controller.updateSettings(req({ user: undefined }), res()))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('updateSettings — returns updated settings', async () => {
    svc.updateSettings.mockResolvedValue({ companyName: 'Nowa Nazwa' });
    const response = res();
    await controller.updateSettings(req({ body: { companyName: 'Nowa Nazwa' } }), response);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: expect.stringContaining('zaktualizowane') })
    );
  });
});
