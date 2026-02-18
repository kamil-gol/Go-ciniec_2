import { asyncHandler } from '../../middlewares/asyncHandler';
import { Request, Response, NextFunction } from 'express';

describe('asyncHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should call the wrapped async function', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);

    wrapped(req as Request, res as Response, next);
    await new Promise(process.nextTick);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('should not call next when async fn resolves', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);

    wrapped(req as Request, res as Response, next);
    await new Promise(process.nextTick);

    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error when async fn rejects', async () => {
    const error = new Error('async failure');
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);

    wrapped(req as Request, res as Response, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with error when async fn throws', async () => {
    const error = new Error('thrown error');
    const fn = jest.fn().mockImplementation(async () => {
      throw error;
    });
    const wrapped = asyncHandler(fn);

    wrapped(req as Request, res as Response, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should return a synchronous function', () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);

    expect(typeof wrapped).toBe('function');
    const result = wrapped(req as Request, res as Response, next);
    expect(result).toBeUndefined();
  });

  it('should forward next() calls made inside the handler', async () => {
    const fn = jest.fn().mockImplementation(async (_req, _res, innerNext) => {
      innerNext();
    });
    const wrapped = asyncHandler(fn);

    wrapped(req as Request, res as Response, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith();
  });
});
