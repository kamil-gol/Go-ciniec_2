/**
 * Auth Middleware — JWT verification, token generation & validation
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 *
 * Exports:
 *  - generateToken(payload)  — create JWT
 *  - verifyToken(token)      — verify & decode JWT
 *  - authMiddleware          — Express middleware
 *  - requireRole(...roles)   — legacy role check (deprecated, use permissions.ts)
 *  - authenticate            — alias for authMiddleware
 *  - AuthRequest             — alias for AuthenticatedRequest
 */
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { AppError } from './errorHandler';
import logger from '@utils/logger';
import { AUTH } from '../i18n/pl';

// Fail-fast: crash on startup if JWT_SECRET is missing in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/* istanbul ignore next */
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. ' +
    'The server cannot start without it in production.'
  );
}

/* istanbul ignore next */
if (!JWT_SECRET) {
  logger.warn(
    'JWT_SECRET is not set \u2014 using insecure dev fallback. ' +
    'DO NOT deploy to production without setting JWT_SECRET.'
  );
}

/* istanbul ignore next -- env-dependent: JWT_SECRET always falsy in test */
const secret = JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRY as any,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new AppError(401, AUTH.TOKEN_INVALID);
  }
}

/**
 * Extract token from request.
 * Priority: Authorization header > query string ?token=
 */
function extractToken(req: AuthenticatedRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const queryToken = req.query.token as string | undefined;
  if (queryToken) {
    return queryToken;
  }

  return null;
}

/**
 * Authentication middleware
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError(401, AUTH.NO_TOKEN);
    }

    const payload = verifyToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      roleId: payload.roleId,
      roleSlug: payload.roleSlug,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, AUTH.AUTH_FAILED));
    }
  }
};

/**
 * Role-based access control middleware (legacy)
 * @deprecated Use requirePermission from permissions.ts instead
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, AUTH.AUTH_REQUIRED));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role})`);
      next(new AppError(403, AUTH.INSUFFICIENT_PERMISSIONS));
      return;
    }

    next();
  };
};

// Aliases for backward compatibility with newer code
export { authMiddleware as authenticate };
export type AuthRequest = AuthenticatedRequest;
