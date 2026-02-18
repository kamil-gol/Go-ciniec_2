/**
 * MenuOption Controller — Branch coverage tests
 * Covers: list filters (category, isActive, search), create validation (missing fields, invalid category,
 * invalid priceType, defaults), update validation (invalid category, invalid priceType, Option not found catch),
 * getById/delete Option not found catch, !userId
 */

jest.mock('../../../services/menu.service', () => ({
  menuService: {
    getOptions: jest.fn(),
    getOptionById: jest.fn(),
    createOption: jest.fn(),
    updateOption: jest.fn(),
    deleteOption: jest.fn(),
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(msg?: string) { return new MockAppError(401, msg || 'Unauthorized'); }
    static badRequest(msg: string) { return new MockAppError(400, msg); }
  }
  return { AppError: MockAppError };
});

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { menuOptionController } from '../../../controllers/menuOption.controller';
import { menuService } from '../../../services/menu.service';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('MenuOptionController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== list =====
  describe('list', () => {
    it('should pass filters with category, isActive=true, search', async () => {
      (menuService.getOptions as jest.Mock).mockResolvedValue([]);
      const req = { query: { category: 'DRINK', isActive: 'true', search: 'woda' } } as any;
      const res = mockRes();
      await menuOptionController.list(req, res, mockNext);
      expect(menuService.getOptions).toHaveBeenCalledWith({ category: 'DRINK', isActive: true, search: 'woda' });
    });

    it('should pass filters with isActive=false', async () => {
      (menuService.getOptions as jest.Mock).mockResolvedValue([]);
      const req = { query: { isActive: 'false' } } as any;
      const res = mockRes();
      await menuOptionController.list(req, res, mockNext);
      expect(menuService.getOptions).toHaveBeenCalledWith({ isActive: false });
    });

    it('should pass no filters when query empty', async () => {
      (menuService.getOptions as jest.Mock).mockResolvedValue([]);
      const req = { query: {} } as any;
      const res = mockRes();
      await menuOptionController.list(req, res, mockNext);
      expect(menuService.getOptions).toHaveBeenCalledWith({});
    });
  });

  // ===== getById =====
  describe('getById', () => {
    it('should return 404 when option not found', async () => {
      (menuService.getOptionById as jest.Mock).mockRejectedValue(new Error('Option not found'));
      const req = { params: { id: 'x' } } as any;
      const res = mockRes();
      await menuOptionController.getById(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      (menuService.getOptionById as jest.Mock).mockRejectedValue(new Error('DB error'));
      const req = { params: { id: 'x' } } as any;
      const res = mockRes();
      await menuOptionController.getById(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ===== create =====
  describe('create', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { body: { name: 'A', category: 'DRINK', priceType: 'FLAT' }, user: undefined } as any;
      const res = mockRes();
      await menuOptionController.create(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 when missing required fields', async () => {
      const req = { body: { name: 'A' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.create(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid category', async () => {
      const req = { body: { name: 'A', category: 'INVALID', priceType: 'FLAT' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.create(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('category') }));
    });

    it('should return 400 for invalid priceType', async () => {
      const req = { body: { name: 'A', category: 'DRINK', priceType: 'INVALID' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.create(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('priceType') }));
    });

    it('should create with defaults when optional fields missing', async () => {
      (menuService.createOption as jest.Mock).mockResolvedValue({ id: 'o1', name: 'A' });
      const req = { body: { name: 'A', category: 'DRINK', priceType: 'FLAT' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.create(req, res, mockNext);
      expect(menuService.createOption).toHaveBeenCalledWith(
        expect.objectContaining({ priceAmount: 0, allowMultiple: false, maxQuantity: 1, isActive: true, displayOrder: 0 }),
        'u1'
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create with explicit values', async () => {
      (menuService.createOption as jest.Mock).mockResolvedValue({ id: 'o1', name: 'B' });
      const req = {
        body: { name: 'B', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 15, allowMultiple: true, maxQuantity: 5, isActive: false, displayOrder: 3 },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await menuOptionController.create(req, res, mockNext);
      expect(menuService.createOption).toHaveBeenCalledWith(
        expect.objectContaining({ priceAmount: 15, allowMultiple: true, maxQuantity: 5, isActive: false, displayOrder: 3 }),
        'u1'
      );
    });
  });

  // ===== update =====
  describe('update', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'o1' }, body: {}, user: undefined } as any;
      const res = mockRes();
      await menuOptionController.update(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 for invalid category in update', async () => {
      const req = { params: { id: 'o1' }, body: { category: 'INVALID' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.update(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid priceType in update', async () => {
      const req = { params: { id: 'o1' }, body: { priceType: 'INVALID' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.update(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when option not found in update', async () => {
      (menuService.updateOption as jest.Mock).mockRejectedValue(new Error('Option not found'));
      const req = { params: { id: 'o1' }, body: { name: 'X' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.update(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error in update', async () => {
      (menuService.updateOption as jest.Mock).mockRejectedValue(new Error('DB fail'));
      const req = { params: { id: 'o1' }, body: { name: 'X' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.update(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should update successfully without category/priceType', async () => {
      (menuService.updateOption as jest.Mock).mockResolvedValue({ id: 'o1', name: 'Updated' });
      const req = { params: { id: 'o1' }, body: { name: 'Updated' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.update(req, res, mockNext);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ===== delete =====
  describe('delete', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'o1' }, user: undefined } as any;
      const res = mockRes();
      await menuOptionController.delete(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 when option not found in delete', async () => {
      (menuService.deleteOption as jest.Mock).mockRejectedValue(new Error('Option not found'));
      const req = { params: { id: 'o1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.delete(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error in delete', async () => {
      (menuService.deleteOption as jest.Mock).mockRejectedValue(new Error('DB fail'));
      const req = { params: { id: 'o1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.delete(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should delete successfully', async () => {
      (menuService.deleteOption as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: 'o1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await menuOptionController.delete(req, res, mockNext);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
