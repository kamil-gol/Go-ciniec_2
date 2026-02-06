import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';
import { ApiResponse } from '@types/index';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn(`Operational Error: ${err.message}`);
      const response: ApiResponse = {
        success: false,
        error: err.message,
      };
      res.status(err.statusCode).json(response);
    } else {
      logger.error('Non-operational error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  } else {
    logger.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
