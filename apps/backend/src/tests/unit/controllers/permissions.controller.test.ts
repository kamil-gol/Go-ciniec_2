/**
 * PermissionsController — Unit Tests
 */
jest.mock('../../../services/permissions.service', () => ({
  __esModule: true,
  default: {
    getPermissions: jest.fn(),
    getPermissionsGrouped: jest.fn(),
  },
}));

import { PermissionsController } from '../../../controllers/permissions.controller';
import permissionsService from '../../../services/permissions.service';

const controller = new PermissionsController();
const svc = permissionsService as any;

const req = (): any => ({ body: {}, params: {}, query: {} });
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('PermissionsController', () => {
  it('getPermissions — returns flat list', async () => {
    svc.getPermissions.mockResolvedValue([{ id: 'p1', name: 'reservations.read' }]);
    const response = res();
    await controller.getPermissions(req(), response);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.any(Array) })
    );
  });

  it('getPermissionsGrouped — returns grouped data', async () => {
    svc.getPermissionsGrouped.mockResolvedValue({ reservations: ['read', 'write'] });
    const response = res();
    await controller.getPermissionsGrouped(req(), response);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
