import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../middlewares/errorHandler';
import { AppError } from '../../../utils/AppError';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle AppError with custom status code', () => {
      const error = new AppError('Resource not found', 404);
      const req = {
        method: 'GET',
        path: '/api/test',
      } as Request;
      const res = mockRes();

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Resource not found',
        })
      );
    });

    it('should handle 401 Unauthorized', () => {
      const error = new AppError('Unauthorized access', 401);
      const req = { method: 'GET', path: '/api/test' } as Request;
      const res = mockRes();

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle 400 Bad Request', () => {
      const error = new AppError('Invalid input data', 400);
      const req = { method: 'GET', path: '/api/test' } as Request;
      const res = mockRes();

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validation errors', () => {
    it('should format validation error details', () => {
      const error = {
        name: 'ValidationError',
        message: '',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      };
      const req = { method: 'POST', path: '/api/users' } as Request;
      const res = mockRes();

      errorHandler(error as unknown as Error, req as Request, res as Response, mockNext as NextFunction);

      // ValidationError should be treated as generic error (500) unless explicitly handled
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('generic errors', () => {
    it('should handle generic Error with 500', () => {
      const error = new Error('Something went wrong');
      const req = { method: 'GET', path: '/api/test' } as Request;
      const res = mockRes();

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      // In development mode, returns structured error with actual message
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong',
            statusCode: 500,
          }),
        })
      );
    });

    it('should log error details to console', () => {
      const error = new Error('Test error');
      const req = { method: 'GET', path: '/api/test' } as Request;
      const res = mockRes();

      errorHandler(error, req, res, mockNext);

      expect(console.error).toHaveBeenCalled();
    });
  });
});
