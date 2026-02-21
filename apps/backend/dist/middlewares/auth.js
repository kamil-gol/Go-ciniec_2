import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import logger from '@utils/logger';
// Fail-fast: crash on startup if JWT_SECRET is missing in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
/* istanbul ignore next */
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. ' +
        'The server cannot start without it in production.');
}
/* istanbul ignore next */
if (!JWT_SECRET) {
    logger.warn('JWT_SECRET is not set \u2014 using insecure dev fallback. ' +
        'DO NOT deploy to production without setting JWT_SECRET.');
}
/* istanbul ignore next -- env-dependent: JWT_SECRET always falsy in test */
const secret = JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';
/**
 * Generate JWT token
 */
export function generateToken(payload) {
    return jwt.sign(payload, secret, {
        expiresIn: JWT_EXPIRY,
    });
}
/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, secret);
    }
    catch (error) {
        throw new AppError(401, 'Invalid or expired token');
    }
}
/**
 * Extract token from request.
 * Priority: Authorization header > query string ?token=
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    const queryToken = req.query.token;
    if (queryToken) {
        return queryToken;
    }
    return null;
}
/**
 * Authentication middleware
 */
export const authMiddleware = (req, _res, next) => {
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
    }
    catch (error) {
        if (error instanceof AppError) {
            next(error);
        }
        else {
            next(new AppError(401, 'Authentication failed'));
        }
    }
};
/**
 * Role-based access control middleware (legacy)
 * @deprecated Use requirePermission from permissions.ts instead
 */
export const requireRole = (...roles) => {
    return (req, _res, next) => {
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
//# sourceMappingURL=auth.js.map