/**
 * Global Error Handler Middleware
 *
 * 🇵🇱 Spolonizowany — wszystkie komunikaty po polsku
 * Also re-exports AppError and asyncHandler for backward compatibility
 * with files that import from '@middlewares/errorHandler'.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './asyncHandler';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import { ERRORS } from '../i18n/pl';

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
    console.warn(`[APP_ERROR ${err.statusCode}] ${_req.method} ${_req.path}: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    const statusCode = (err as any).statusCode;
    console.warn(`[APP_ERROR ${statusCode}] ${_req.method} ${_req.path}: ${err.message}`);
    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Zod validation errors ———
  if (err instanceof z.ZodError) {
    console.warn(`[VALIDATION 400] ${_req.method} ${_req.path}:`, JSON.stringify(err.errors));
    res.status(400).json({
      success: false,
      error: ERRORS.VALIDATION_ERROR,
      details: err.errors,
    });
    return;
  }

  // ——— Prisma known errors ———
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'pole';
        console.warn(`[PRISMA P2002 409] ${_req.method} ${_req.path}: duplicate ${target}`);
        res.status(409).json({
          success: false,
          error: ERRORS.DUPLICATE_VALUE(target),
        });
        return;
      }
      case 'P2025': {
        console.warn(`[PRISMA P2025 404] ${_req.method} ${_req.path}: record not found`);
        res.status(404).json({
          success: false,
          error: ERRORS.RECORD_NOT_FOUND,
        });
        return;
      }
      case 'P2003': {
        console.warn(`[PRISMA P2003 400] ${_req.method} ${_req.path}: referenced record not found`);
        res.status(400).json({
          success: false,
          error: ERRORS.REFERENCED_NOT_EXIST,
        });
        return;
      }
      default:
        break;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.warn(`[PRISMA_VALIDATION 400] ${_req.method} ${_req.path}: ${err.message.slice(0, 200)}`);
    res.status(400).json({
      success: false,
      error: ERRORS.INVALID_DATA,
    });
    return;
  }

  // ——— Bridge: auth service errors (Invalid credentials / Nieprawidłowe dane) → 401 ———
  if (err.message && (
    err.message.toLowerCase().includes('invalid credentials') ||
    err.message.toLowerCase().includes('invalid email or password') ||
    err.message.toLowerCase().includes('nieprawidłowe dane logowania') ||
    err.message.toLowerCase().includes('nieprawidłowy lub wygasły token')
  )) {
    console.warn(`[AUTH 401] ${_req.method} ${_req.path}: ${err.message}`);
    res.status(401).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: inactive/blocked account → 403 ———
  if (err.message && (
    err.message.toLowerCase().includes('inactive') ||
    err.message.toLowerCase().includes('nieaktywne') ||
    err.message.toLowerCase().includes('blocked') ||
    err.message.toLowerCase().includes('disabled')
  )) {
    console.warn(`[FORBIDDEN 403] ${_req.method} ${_req.path}: ${err.message}`);
    res.status(403).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Bridge: password validation errors → 422 ———
  if (err.message && (
    (err.message.toLowerCase().includes('password') && (
      err.message.toLowerCase().includes('must') ||
      err.message.toLowerCase().includes('weak') ||
      err.message.toLowerCase().includes('too short') ||
      err.message.toLowerCase().includes('requires')
    )) ||
    err.message.toLowerCase().includes('hasło musi')
  )) {
    console.warn(`[VALIDATION 422] ${_req.method} ${_req.path}: ${err.message}`);
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
    console.warn(`[NOT_FOUND 404] ${_req.method} ${_req.path}: ${err.message}`);
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
    err.message.toLowerCase().includes('już istnieje') ||
    err.message.toLowerCase().includes('już zajęty') ||
    err.message.toLowerCase().includes('conflict')
  )) {
    console.warn(`[CONFLICT 409] ${_req.method} ${_req.path}: ${err.message}`);
    res.status(409).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ——— Unknown errors (500) ———
  console.error(`[ERROR 500] ${_req.method} ${_req.path}:`, err);

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? ERRORS.INTERNAL_ERROR
        : err.message || ERRORS.INTERNAL_ERROR,
  });
}
