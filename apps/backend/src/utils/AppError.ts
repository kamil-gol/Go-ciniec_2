/**
 * Custom Application Error class
 * Replaces fragile string-matching on error.message for HTTP status codes
 * 🇵🇱 Polish defaults for user-facing error messages
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
      message = typeof codeOrMessage === 'string' ? codeOrMessage : 'Błąd';
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

  static unauthorized(message = 'Wymagane uwierzytelnienie'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Brak dost\u0119pu'): AppError {
    return new AppError(message, 403);
  }

  static notFound(resource = 'Zas\u00f3b'): AppError {
    return new AppError(`Nie znaleziono: ${resource}`, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message = 'Wewn\u0119trzny b\u0142\u0105d serwera'): AppError {
    return new AppError(message, 500, false);
  }
}
