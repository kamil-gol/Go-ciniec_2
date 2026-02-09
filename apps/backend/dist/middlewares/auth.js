import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import logger from '@utils/logger';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
/**
 * Generate JWT token
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
    });
}
/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        logger.warn('Invalid token:', error);
        throw new AppError(401, 'Invalid or expired token');
    }
}
/**
 * Authentication middleware
 */
export const authMiddleware = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'No token provided');
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = verifyToken(token);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
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
 * Role-based access control middleware
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