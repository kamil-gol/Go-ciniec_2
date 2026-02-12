/**
 * Global Error Handler Middleware
 *
 * Also re-exports AppError and asyncHandler for backward compatibility
 * with files that import from '@middlewares/errorHandler'.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './asyncHandler';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Re-export for backward compatibility (auth.controller imports from here)
export { AppError, asyncHandler };

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ——— AppError (known, operational errors) ———
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Zod validation errors ———
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  // ——— Prisma known errors ———
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

  // ——— Bridge: legacy service errors with 'not found' pattern ———
  if (err.message && err.message.toLowerCase().includes('not found')) {
    res.status(404).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: legacy 'already exists' / 'already' conflict pattern ———
  if (err.message && (
    err.message.toLowerCase().includes('already exists') ||
    err.message.toLowerCase().includes('already booked') ||
    err.message.toLowerCase().includes('conflict')
  )) {
    res.status(409).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Unknown errors (500) ———
  console.error('[ERROR]', err);

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
}
