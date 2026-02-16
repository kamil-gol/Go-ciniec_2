import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '@types/index';
import { AppError } from './errorHandler';
import logger from '@utils/logger';

// Fail-fast: crash on startup if JWT_SECRET is missing in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. ' +
    'The server cannot start without it in production.'
  );
}

if (!JWT_SECRET) {
  logger.warn(
    'JWT_SECRET is not set — using insecure dev fallback. ' +
    'DO NOT deploy to production without setting JWT_SECRET.'
  );
}

const secret = JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRY,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new AppError(401, 'Invalid or expired token');
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
      throw new AppError(401, 'No token provided');
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
      next(new AppError(401, 'Authentication failed'));
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
      next(new AppError(401, 'User not authenticated'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role})`);
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
};
