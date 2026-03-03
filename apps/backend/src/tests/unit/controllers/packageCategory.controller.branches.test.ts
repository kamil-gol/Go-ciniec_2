/**
 * PackageCategoryController — Branch Coverage Tests
 * Tests: error handling without message property
 */

jest.mock('../../../services/packageCategory.service');

import { PackageCategoryController } from '../../../controllers/packageCategory.controller';
import packageCategoryService from '../../../services/packageCategory.service';

const packageCategoryController = new PackageCategoryController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PackageCategoryController branches', () => {
  describe('getByPackage', () => {
    it('should handle error without message', async () => {
      (packageCategoryService.getByPackage as jest.Mock).mockRejectedValue({ code: 'ERR' });
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      
      await packageCategoryController.getByPackage(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/Internal server|Wewnętrzny/i),
        })
      );
    });
  });

  describe('update', () => {
    it('should handle error without message', async () => {
      (packageCategoryService.update as jest.Mock).mockRejectedValue({ code: 'ERR' });
      const req = {
        params: { id: 'cs1' },
        body: { name: 'Updated' },
        user: { id: 'u1' },
      } as any;
      const res = mockRes();
      
      await packageCategoryController.update(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/Internal server|Wewnętrzny/i),
        })
      );
    });
  });

  describe('delete', () => {
    it('should handle error without message in delete', async () => {
      (packageCategoryService.delete as jest.Mock).mockRejectedValue({ code: 'P2002' });
      const req = {
        params: { id: 'cs1' },
        user: { id: 'u1' },
      } as any;
      const res = mockRes();
      
      await packageCategoryController.delete(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/Internal server|Wewnętrzny/i),
        })
      );
    });
  });
});
