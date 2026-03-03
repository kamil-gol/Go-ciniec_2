/**
 * errorHandler middleware tests
 * Covers: AppError handling, validation errors, unknown errors
 */

import type { Request, Response, NextFunction } from 'express';

class MockAppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

jest.mock('../../../utils/AppError', () => ({ AppError: MockAppError }));

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

import { errorHandler } from '../../../middlewares/errorHandler';
import { AppError } from '../../../utils/AppError';

describe('errorHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'GET',
      path: '/api/test',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle AppError with custom message and status', () => {
      const error = new AppError('Resource not found', 404);

      errorHandler(error, req as Request, res as Response, next as NextFunction);

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

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle 400 Bad Request', () => {
      const error = new AppError('Invalid input data', 400);

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validation errors', () => {
    it('should format validation error details', () => {
      const error: any = new Error('Validation failed');
      error.name = 'ValidationError';
      error.details = [
        { message: 'Email is required', path: ['email'] },
        { message: 'Password too short', path: ['password'] },
      ];

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Validation'),
        })
      );
    });
  });

  describe('unknown errors (500)', () => {
    it('should log unknown errors to console', () => {
      const error = new Error('Unexpected crash');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR.*500/),
        error
      );
    });

    it('should return fallback message when error has no message', () => {
      const error: any = { name: 'WeirdError' };

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 500 for non-AppError exceptions', () => {
      const error = new Error('Database connection failed');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });
});
