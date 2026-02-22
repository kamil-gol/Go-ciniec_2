/**
 * Auth Middleware — JWT verification
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH } from '../i18n/pl';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: AUTH.NO_TOKEN });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || decoded.legacyRole || 'user',
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: AUTH.TOKEN_INVALID });
      return;
    }
    res.status(401).json({ success: false, error: AUTH.AUTH_FAILED });
  }
};
