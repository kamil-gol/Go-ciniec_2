/**
 * Role-based Authorization Middleware
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AUTH } from '../i18n/pl';

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: AUTH.AUTH_REQUIRED });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: AUTH.INSUFFICIENT_PERMISSIONS });
      return;
    }

    next();
  };
};
