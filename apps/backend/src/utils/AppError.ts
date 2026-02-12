/**
 * Custom Application Error class
 * Replaces fragile string-matching on error.message for HTTP status codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ─── Factory methods for common errors ───

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'User not authenticated'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(message, 403);
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, false);
  }
}
