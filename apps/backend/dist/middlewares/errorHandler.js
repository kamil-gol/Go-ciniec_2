import logger from '@utils/logger';
export class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Global error handling middleware
 */
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        if (err.isOperational) {
            logger.warn(`Operational Error: ${err.message}`);
            const response = {
                success: false,
                error: err.message,
            };
            res.status(err.statusCode).json(response);
        }
        else {
            logger.error('Non-operational error:', err);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    else {
        logger.error('Unexpected error:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
//# sourceMappingURL=errorHandler.js.map