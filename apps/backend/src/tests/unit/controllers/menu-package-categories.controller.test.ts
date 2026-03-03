/**
 * MenuPackageCategorySettings Controller — Unit Tests
 */

jest.mock('../../../services/menu-package-categories.service', () => ({
  __esModule: true,
  default: {
    createOrUpdateSettings: jest.fn(),
    getSettingsByPackage: jest.fn(),
    deleteSettings: jest.fn(),
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { MenuPackageCategorySettingsController } from '../../../controllers/menu-package-categories.controller';
import menuPackageCategoriesService from '../../../services/menu-package-categories.service';

const ctrl = new MenuPackageCategorySettingsController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MenuPackageCategorySettingsController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should throw badRequest when no packageId', async () => {
    const req = { body: { category: 'MAIN' }, user: { id: 'u1' } } as any;
    await expect(ctrl.createOrUpdateSettings(req, mockRes())).rejects.toThrow(/required/);
  });

  it('should create or update settings', async () => {
    (menuPackageCategoriesService.createOrUpdateSettings as jest.Mock).mockResolvedValue({ id: '1' });
    const req = {
      body: { packageId: 'p1', category: 'MAIN', maxCourses: 3 },
      user: { id: 'u1' }
    } as any;
    const res = mockRes();
    await ctrl.createOrUpdateSettings(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get settings by package', async () => {
    (menuPackageCategoriesService.getSettingsByPackage as jest.Mock).mockResolvedValue([{ id: '1' }]);
    const req = { params: { packageId: 'p1' } } as any;
    const res = mockRes();
    await ctrl.getSettingsByPackage(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete settings when found', async () => {
    (menuPackageCategoriesService.deleteSettings as jest.Mock).mockResolvedValue(true);
    const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.deleteSettings(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 200 when settings not found (already deleted)', async () => {
    (menuPackageCategoriesService.deleteSettings as jest.Mock).mockResolvedValue(false);
    const req = { params: { id: 'x' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.deleteSettings(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw badRequest when category missing in createOrUpdate', async () => {
    const req = { body: { packageId: 'p1', maxCourses: 3 }, user: { id: 'u1' } } as any;
    await expect(ctrl.createOrUpdateSettings(req, mockRes())).rejects.toThrow(/required/);
  });

  it('should get empty array when no settings', async () => {
    (menuPackageCategoriesService.getSettingsByPackage as jest.Mock).mockResolvedValue([]);
    const req = { params: { packageId: 'p-new' } } as any;
    const res = mockRes();
    await ctrl.getSettingsByPackage(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('should throw notFound when getSettingsByPackage returns null (coverage line ~105)', async () => {
    (menuPackageCategoriesService.getSettingsByPackage as jest.Mock).mockResolvedValue(null);
    const req = { params: { packageId: 'bad' } } as any;
    await expect(ctrl.getSettingsByPackage(req, mockRes())).rejects.toThrow(/not found/);
  });
});
