/**
 * Custom Application Error class
 * Replaces fragile string-matching on error.message for HTTP status codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(messageOrCode: string | number, codeOrMessage?: number | string, isOperational = true) {
    // Support both signatures:
    //   new AppError('message', 400)      — new style
    //   new AppError(400, 'message')      — legacy auth.controller style
    let message: string;
    let statusCode: number;

    if (typeof messageOrCode === 'number') {
      // Legacy: new AppError(400, 'message')
      statusCode = messageOrCode;
      message = typeof codeOrMessage === 'string' ? codeOrMessage : 'Error';
    } else {
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
