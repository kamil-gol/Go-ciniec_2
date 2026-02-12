/**
 * Typed Express Request extensions
 * Replaces unsafe `(req as any).user` pattern across all controllers.
 *
 * After this, use:
 *   const userId = req.user?.id;  // ✅ typed, no cast needed
 *
 * Instead of:
 *   const userId = (req as any).user?.id;  // ❌ unsafe
 */
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Helper type for route handlers that require authentication.
 * Guarantees req.user is defined (use after authMiddleware).
 */
export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
