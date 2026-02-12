/**
 * Global Error Handler Middleware
 * Single point of error handling for the entire application.
 *
 * Must be registered LAST in Express middleware chain:
 *   app.use(errorHandler);
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ─── AppError (known, operational errors) ───
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ─── Prisma known errors ───
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        res.status(409).json({
          success: false,
          error: `Duplicate value for: ${target}`,
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      }
      case 'P2003': {
        res.status(400).json({
          success: false,
          error: 'Referenced record does not exist',
        });
        return;
      }
      default:
        break;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: 'Invalid data provided',
    });
    return;
  }

  // ─── Bridge: legacy service errors with 'not found' pattern ───
  // Maintains backward compatibility while services are migrated to AppError
  if (err.message && err.message.toLowerCase().includes('not found')) {
    res.status(404).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ─── Unknown errors (500) ───
  console.error('[ERROR]', err);

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
}
