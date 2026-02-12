/**
 * Async Handler Wrapper
 * Wraps async route handlers to automatically catch errors
 * and forward them to the global error middleware.
 *
 * Usage:
 *   router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
 *     const item = await service.getById(req.params.id);
 *     res.json({ success: true, data: item });
 *   }));
 *
 * No more try/catch in every controller method!
 */
import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
