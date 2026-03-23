/**
 * Custom Application Error class
 * Replaces fragile string-matching on error.message for HTTP status codes
 *
 * 🇵🇱 Polskie defaulty — importowane z i18n/pl.ts
 *
 * Supports optional ErrorCode for structured error responses.
 * ErrorCode is additive — all existing signatures remain valid.
 */
import { ERRORS, AUTH } from '../i18n/pl';
import { ErrorCode, getStatusForErrorCode } from './error-codes';

export { ErrorCode } from './error-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: ErrorCode;

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

  /**
   * Set ErrorCode on an existing AppError instance (builder pattern).
   * Returns `this` for chaining: `AppError.notFound('X').withCode(ErrorCode.NOT_FOUND_RESERVATION)`
   */
  withCode(code: ErrorCode): this {
    (this as { errorCode?: ErrorCode }).errorCode = code;
    return this;
  }

  /**
   * Create an AppError from an ErrorCode.
   * The HTTP status is derived automatically from the ErrorCode mapping.
   */
  static fromCode(code: ErrorCode, message: string, isOperational = true): AppError {
    const statusCode = getStatusForErrorCode(code);
    const err = new AppError(message, statusCode, isOperational);
    (err as { errorCode?: ErrorCode }).errorCode = code;
    return err;
  }

  // ——— Factory methods for common errors ———

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = AUTH.AUTH_REQUIRED): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string = ERRORS.ACCESS_DENIED): AppError {
    return new AppError(message, 403);
  }

  static notFound(resource: string = 'Zasób'): AppError {
    return new AppError(ERRORS.NOT_FOUND(resource), 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message: string = ERRORS.INTERNAL_ERROR): AppError {
    return new AppError(message, 500, false);
  }
}
