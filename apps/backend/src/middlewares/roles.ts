/**
 * Role-Based Access Control Middleware
 * Restrict access based on user roles
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { pl } from '../i18n/pl';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: pl.auth.authRequired
      });
      return;
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: pl.auth.insufficientPermissions
      });
      return;
    }

    next();
  };
};

/**
 * Shorthand for ADMIN only access
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Shorthand for ADMIN or EMPLOYEE access
 */
export const requireStaff = requireRole('ADMIN', 'EMPLOYEE');
