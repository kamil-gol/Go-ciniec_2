/**
 * Global Error Handler Middleware — Polish-first
 *
 * Re-exports AppError and asyncHandler for backward compatibility.
 * Bridge patterns match both Polish and English error messages
 * for backward compatibility during migration.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './asyncHandler';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { pl } from '../i18n/pl';

// Re-export for backward compatibility
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

  // ——— Bridge: auth errors → 401 (PL + EN patterns) ———
  if (err.message && (
    err.message.toLowerCase().includes('invalid credentials') ||
    err.message.toLowerCase().includes('nieprawidłowy email') ||
    err.message.toLowerCase().includes('nieprawidłowe dane logowania')
  )) {
    res.status(401).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: inactive/blocked → 403 (PL + EN) ———
  if (err.message && (
    err.message.toLowerCase().includes('inactive') ||
    err.message.toLowerCase().includes('nieaktywne') ||
    err.message.toLowerCase().includes('blocked') ||
    err.message.toLowerCase().includes('disabled')
  )) {
    res.status(403).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: password validation → 422 (PL + EN) ———
  if (err.message && (
    err.message.toLowerCase().includes('hasło') ||
    (err.message.toLowerCase().includes('password') && (
      err.message.toLowerCase().includes('must') ||
      err.message.toLowerCase().includes('weak') ||
      err.message.toLowerCase().includes('too short') ||
      err.message.toLowerCase().includes('requires')
    ))
  )) {
    res.status(422).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: not found → 404 (PL + EN) ———
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

  // ——— Bridge: conflict → 409 (PL + EN) ———
  if (err.message && (
    err.message.toLowerCase().includes('already exists') ||
    err.message.toLowerCase().includes('already booked') ||
    err.message.toLowerCase().includes('już istnieje') ||
    err.message.toLowerCase().includes('już zajęty') ||
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
