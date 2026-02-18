/**
 * validateUUID Middleware — Unit Tests
 */

import { validateUUID } from '../../../middlewares/validateUUID';

const mockReq = (params: any = {}): any => ({ params });
const mockRes = (): any => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('validateUUID', () => {
  const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should call next() on valid UUID', () => {
    const mw = validateUUID('id');
    mw(mockReq({ id: VALID_UUID }), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 on invalid UUID', () => {
    const mw = validateUUID('id');
    const res = mockRes();
    mw(mockReq({ id: 'not-a-uuid' }), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('id') })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when param is missing (undefined)', () => {
    const mw = validateUUID('id');
    mw(mockReq({}), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate multiple params', () => {
    const mw = validateUUID('id', 'itemId');
    const res = mockRes();
    mw(mockReq({ id: VALID_UUID, itemId: 'garbage' }), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('itemId') })
    );
  });
});
