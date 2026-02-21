/**
 * Custom Application Error class
 * Replaces fragile string-matching on error.message for HTTP status codes
 */
export class AppError extends Error {
    constructor(messageOrCode, codeOrMessage, isOperational = true) {
        // Support both signatures:
        //   new AppError('message', 400)      — new style
        //   new AppError(400, 'message')      — legacy auth.controller style
        let message;
        let statusCode;
        if (typeof messageOrCode === 'number') {
            // Legacy: new AppError(400, 'message')
            statusCode = messageOrCode;
            message = typeof codeOrMessage === 'string' ? codeOrMessage : 'Error';
        }
        else {
            // New: new AppError('message', 400)
            message = messageOrCode;
            statusCode = typeof codeOrMessage === 'number' ? codeOrMessage : 500;
        }
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, AppError.prototype);
    }
    // ——— Factory methods for common errors ———
    static badRequest(message) {
        return new AppError(message, 400);
    }
    static unauthorized(message = 'User not authenticated') {
        return new AppError(message, 401);
    }
    static forbidden(message = 'Access denied') {
        return new AppError(message, 403);
    }
    static notFound(resource = 'Resource') {
        return new AppError(`${resource} not found`, 404);
    }
    static conflict(message) {
        return new AppError(message, 409);
    }
    static internal(message = 'Internal server error') {
        return new AppError(message, 500, false);
    }
}
//# sourceMappingURL=AppError.js.map