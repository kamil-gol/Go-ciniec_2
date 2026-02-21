import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, JwtPayload } from '@types/index';
/**
 * Generate JWT token
 */
export declare function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
/**
 * Verify JWT token
 */
export declare function verifyToken(token: string): JwtPayload;
/**
 * Authentication middleware
 */
export declare const authMiddleware: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
/**
 * Role-based access control middleware (legacy)
 * @deprecated Use requirePermission from permissions.ts instead
 */
export declare const requireRole: (...roles: string[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map