/**
 * Global Error Handler Middleware
 *
 * Also re-exports AppError and asyncHandler for backward compatibility
 * with files that import from '@middlewares/errorHandler'.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './asyncHandler';
export { AppError, asyncHandler };
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map