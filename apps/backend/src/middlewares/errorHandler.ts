/**
 * Global Error Handler Middleware
 * 🇵🇱 Polish error messages for user-facing responses
 *
 * Also re-exports AppError and asyncHandler for backward compatibility
 * with files that import from '@middlewares/errorHandler'.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './asyncHandler';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import pl from '../i18n/pl';

// Re-export for backward compatibility (auth.controller imports from here)
export { AppError, asyncHandler };

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ——— AppError (known, operational errors) ———
  // FIX: Also check for statusCode property as fallback when instanceof fails
  // (can happen with path aliases / different module instances)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    const statusCode = (err as any).statusCode;
    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Zod validation errors ———
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: pl.errors.validationError,
      details: err.errors,
    });
    return;
  }

  // ——— Prisma known errors ———
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'pole';
        res.status(409).json({
          success: false,
          error: pl.errors.duplicateValue(target),
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          success: false,
          error: pl.errors.recordNotFound,
        });
        return;
      }
      case 'P2003': {
        res.status(400).json({
          success: false,
          error: pl.errors.referencedNotExist,
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
      error: pl.errors.invalidData,
    });
    return;
  }

  // ——— Bridge: auth service errors (nieprawidłowe dane logowania → 401) ———
  if (err.message && (
    err.message.toLowerCase().includes('nieprawid\u0142owe dane logowania') ||
    err.message.toLowerCase().includes('invalid credentials') ||
    err.message.toLowerCase().includes('invalid email or password')
  )) {
    res.status(401).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: inactive/blocked account → 403 ———
  if (err.message && (
    err.message.toLowerCase().includes('nieaktywne') ||
    err.message.toLowerCase().includes('inactive') ||
    err.message.toLowerCase().includes('blocked') ||
    err.message.toLowerCase().includes('disabled')
  )) {
    res.status(403).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: password validation errors → 422 ———
  if (err.message && (
    err.message.toLowerCase().includes('has\u0142o') ||
    err.message.toLowerCase().includes('password')
  ) && (
    err.message.toLowerCase().includes('musi') ||
    err.message.toLowerCase().includes('must') ||
    err.message.toLowerCase().includes('weak') ||
    err.message.toLowerCase().includes('too short')
  )) {
    res.status(422).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: legacy service errors with 'not found' / 'nie znaleziono' pattern ———
  if (err.message && (
    err.message.toLowerCase().includes('not found') ||
    err.message.toLowerCase().includes('nie znaleziono')
  )) {
    res.status(404).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: legacy 'already exists' / 'już istnieje' conflict pattern ———
  if (err.message && (
    err.message.toLowerCase().includes('already exists') ||
    err.message.toLowerCase().includes('already booked') ||
    err.message.toLowerCase().includes('ju\u017c istnieje') ||
    err.message.toLowerCase().includes('ju\u017c zarezerwowany') ||
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
        ? pl.errors.internalError
        : err.message || pl.errors.internalError,
  });
}
