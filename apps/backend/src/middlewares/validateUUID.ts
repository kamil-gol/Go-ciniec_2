/**
 * UUID Validation Middleware
 * Validates that route params matching common ID patterns are valid UUIDs.
 * Returns 400 instead of letting invalid IDs reach Prisma (which would 500).
 *
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 *
 * Usage:
 *   router.get('/:id', validateUUID('id'), handler);
 *   router.get('/:id/items/:itemId', validateUUID('id', 'itemId'), handler);
 */
import { Request, Response, NextFunction } from 'express';
import { VALIDATION } from '../i18n/pl';

// Accepts any UUID-shaped string (v1-v8, nil UUID, etc.)
// Goal: block garbage like "not-a-uuid" before it hits Prisma
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !UUID_REGEX.test(value)) {
        res.status(400).json({
          success: false,
          error: VALIDATION.INVALID_UUID(param),
        });
        return;
      }
    }
    next();
  };
}
