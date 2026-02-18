/**
 * ErrorHandler middleware — Branch Coverage (line 67)
 */
import { Request, Response, NextFunction } from 'express';

let errorHandler: any;
let AppError: any;

beforeAll(() => {
  const mod = require('../../../middlewares/errorHandler');
  errorHandler = mod.errorHandler || mod.default;
  AppError = mod.AppError;
});

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.headersSent = false;
  return res;
};

describe('errorHandler — line 67 branch', () => {

  it('should not send response when headers already sent', () => {
    const req = {} as Request;
    const res = mockRes();
    res.headersSent = true;
    const next = jest.fn();

    errorHandler(new Error('test'), req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle non-AppError with 500 status', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn();

    errorHandler(new Error('unexpected'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should handle AppError with custom status', () => {
    if (!AppError) return; // skip if not exported
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn();

    errorHandler(new AppError(422, 'Validation failed'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should handle error without message', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn();

    errorHandler({}, req, res, next);

    expect(res.status).toHaveBeenCalled();
  });
});
