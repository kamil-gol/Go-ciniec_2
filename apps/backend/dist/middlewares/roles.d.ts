/**
 * Role-Based Access Control Middleware
 * Restrict access based on user roles
 */
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
/**
 * Middleware to check if user has required role
 */
export declare const requireRole: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Shorthand for ADMIN only access
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Shorthand for ADMIN or EMPLOYEE access
 */
export declare const requireStaff: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=roles.d.ts.map