import { AppError } from '../../../utils/AppError';

describe('AppError', () => {
  // ─── Constructor ───
  describe('constructor — new style (message, code)', () => {
    it('should set message and statusCode', () => {
      const err = new AppError('Something failed', 400);
      expect(err.message).toBe('Something failed');
      expect(err.statusCode).toBe(400);
      expect(err.isOperational).toBe(true);
    });

    it('should default statusCode to 500 when not provided', () => {
      const err = new AppError('Oops');
      expect(err.statusCode).toBe(500);
    });

    it('should accept isOperational = false', () => {
      const err = new AppError('Fatal', 500, false);
      expect(err.isOperational).toBe(false);
    });
  });

  describe('constructor — legacy style (code, message)', () => {
    it('should accept (number, string) signature', () => {
      const err = new AppError(401, 'Unauthorized');
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
    });

    it('should default message to "Error" when no string given', () => {
      const err = new AppError(500);
      expect(err.message).toBe('Error');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('prototype chain', () => {
    it('should be an instance of Error', () => {
      const err = new AppError('test', 400);
      expect(err).toBeInstanceOf(Error);
    });

    it('should be an instance of AppError', () => {
      const err = new AppError('test', 400);
      expect(err).toBeInstanceOf(AppError);
    });

    it('should have a stack trace', () => {
      const err = new AppError('test', 400);
      expect(err.stack).toBeDefined();
    });
  });

  // ─── Factory methods ───
  describe('badRequest()', () => {
    it('should create 400 error with given message', () => {
      const err = AppError.badRequest('Invalid input');
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Invalid input');
      expect(err.isOperational).toBe(true);
    });
  });

  describe('unauthorized()', () => {
    it('should create 401 error with default message (PL)', () => {
      const err = AppError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Wymagane uwierzytelnienie');
    });

    it('should create 401 error with custom message', () => {
      const err = AppError.unauthorized('Token expired');
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Token expired');
    });
  });

  describe('forbidden()', () => {
    it('should create 403 error with default message (PL)', () => {
      const err = AppError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Brak dost\u0119pu');
    });

    it('should create 403 error with custom message', () => {
      const err = AppError.forbidden('Admins only');
      expect(err.message).toBe('Admins only');
    });
  });

  describe('notFound()', () => {
    it('should create 404 with default resource (PL)', () => {
      const err = AppError.notFound();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Zas\u00f3b \u2014 nie znaleziono');
    });

    it('should create 404 with custom resource name', () => {
      const err = AppError.notFound('Klient');
      expect(err.message).toBe('Klient \u2014 nie znaleziono');
    });
  });

  describe('conflict()', () => {
    it('should create 409 error', () => {
      const err = AppError.conflict('Already exists');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Already exists');
    });
  });

  describe('internal()', () => {
    it('should create 500 error with isOperational = false (PL)', () => {
      const err = AppError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Wewn\u0119trzny b\u0142\u0105d serwera');
      expect(err.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const err = AppError.internal('DB connection lost');
      expect(err.message).toBe('DB connection lost');
      expect(err.isOperational).toBe(false);
    });
  });
});
