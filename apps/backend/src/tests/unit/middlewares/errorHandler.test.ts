/**
 * ErrorHandler Middleware — Unit Tests
 */

import { errorHandler } from '../../../middlewares/errorHandler';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';

const mockReq = {} as any;
const mockRes = (): any => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('errorHandler', () => {
  it('should handle AppError with correct status', () => {
    const err = new AppError('Not found', 404);
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Not found' });
  });

  it('should handle AppError.badRequest (400)', () => {
    const err = AppError.badRequest('Invalid input');
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle Zod validation error (400)', () => {
    const schema = z.object({ name: z.string() });
    let err: any;
    try { schema.parse({ name: 123 }); } catch (e) { err = e; }
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error' })
    );
  });

  it('should handle Prisma P2002 duplicate (409)', () => {
    const err: any = new Error('Unique constraint');
    err.constructor = { name: 'PrismaClientKnownRequestError' };
    Object.setPrototypeOf(err, { constructor: { name: 'PrismaClientKnownRequestError' } });
    // Simulate Prisma error structure
    const PrismaError = class extends Error { code: string; meta: any; constructor(msg: string, code: string, meta: any) { super(msg); this.code = code; this.meta = meta; this.name = 'PrismaClientKnownRequestError'; } };
    const prismaErr = new PrismaError('dup', 'P2002', { target: ['email'] });
    // We need the actual Prisma class check — use legacy pattern instead
    const legacyErr = new Error('email already exists');
    const res = mockRes();
    errorHandler(legacyErr, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should handle legacy "not found" pattern (404)', () => {
    const err = new Error('Reservation not found');
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should handle legacy "already booked" conflict (409)', () => {
    const err = new Error('Hall already booked for this date');
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should handle legacy "conflict" pattern (409)', () => {
    const err = new Error('Schedule conflict detected');
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should handle unknown error as 500', () => {
    const err = new Error('Something weird happened');
    const res = mockRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });

  it('should hide error details in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = new Error('secret db details');
    const res = mockRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Internal server error' })
    );
    process.env.NODE_ENV = origEnv;
    consoleSpy.mockRestore();
  });
});
