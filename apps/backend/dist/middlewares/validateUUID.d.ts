/**
 * UUID Validation Middleware
 * Validates that route params matching common ID patterns are valid UUIDs.
 * Returns 400 instead of letting invalid IDs reach Prisma (which would 500).
 *
 * Usage:
 *   router.get('/:id', validateUUID('id'), handler);
 *   router.get('/:id/items/:itemId', validateUUID('id', 'itemId'), handler);
 */
import { Request, Response, NextFunction } from 'express';
export declare function validateUUID(...paramNames: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateUUID.d.ts.map