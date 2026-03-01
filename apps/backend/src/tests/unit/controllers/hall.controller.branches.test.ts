/**
 * HallController — error path coverage
 * Lines 30, 42: catch blocks in getHalls and getHallById
 */
import { Request, Response, NextFunction } from 'express';

const mockHallService = {
  getHalls: jest.fn(),
  getHallById: jest.fn(),
  createHall: jest.fn(),
  updateHall: jest.fn(),
  deleteHall: jest.fn(),
};

jest.mock('../../../services/hall.service', () => ({
  __esModule: true,
  default: mockHallService,
}));

import hallController from '../../../controllers/hall.controller';

const mockReq = (overrides: any = {}): Partial<Request> => ({
  query: {},
  params: {},
  body: {},
  headers: {},
  ...overrides,
});

const mockRes = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('HallController — error paths', () => {
  it('getHalls should call next(error) when service throws', async () => {
    const error = new Error('DB connection failed');
    mockHallService.getHalls.mockRejectedValue(error);

    await hallController.getHalls(
      mockReq({ query: {} }) as Request,
      mockRes() as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('getHallById should call next(error) when service throws', async () => {
    const error = new Error('Nie znaleziono sali');
    mockHallService.getHallById.mockRejectedValue(error);

    await hallController.getHallById(
      mockReq({ params: { id: 'bad-id' } }) as Request,
      mockRes() as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('getHalls with isActive=false filter', async () => {
    mockHallService.getHalls.mockResolvedValue([]);
    const res = mockRes() as Response;

    await hallController.getHalls(
      mockReq({ query: { isActive: 'false' } }) as Request,
      res,
      mockNext
    );

    expect(mockHallService.getHalls).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false })
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('getHalls with no isActive filter (undefined)', async () => {
    mockHallService.getHalls.mockResolvedValue([]);
    const res = mockRes() as Response;

    await hallController.getHalls(
      mockReq({ query: { search: 'Sala' } }) as Request,
      res,
      mockNext
    );

    expect(mockHallService.getHalls).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: undefined })
    );
  });
});
