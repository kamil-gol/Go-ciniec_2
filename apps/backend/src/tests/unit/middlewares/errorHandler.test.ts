import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { errorHandler } from '../../../middlewares/errorHandler';
import { AppError } from '../../../utils/AppError';

describe('errorHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  // --- AppError ---

  describe('AppError handling', () => {
    it('should return correct status and message for AppError', () => {
      const error = new AppError(400, 'Bad request data');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request data',
      });
    });

    it('should handle AppError with 404', () => {
      const error = new AppError(404, 'Not found');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle AppError with 401', () => {
      const error = new AppError(401, 'Unauthorized');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle AppError created with new-style constructor', () => {
      const error = new AppError('Custom error', 422);

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error',
      });
    });
  });

  // --- Zod errors ---

  describe('Zod validation errors', () => {
    it('should return 400 with validation details for ZodError', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      let zodError: z.ZodError;
      try {
        schema.parse({ name: 123, age: 'not a number' });
      } catch (e) {
        zodError = e as z.ZodError;
      }

      errorHandler(zodError!, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Błąd walidacji',
        details: expect.any(Array),
      });
    });
  });

  // --- Prisma errors ---

  describe('Prisma errors', () => {
    it('should return 409 for P2002 (unique constraint)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      });

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Zduplikowana wartość dla: email',
      });
    });

    it('should return 409 with fallback for P2002 without meta.target', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Zduplikowana wartość dla: pole',
      });
    });

    it('should return 404 for P2025 (record not found)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nie znaleziono rekordu',
      });
    });

    it('should return 400 for P2003 (foreign key constraint)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Powiązany rekord nie istnieje',
      });
    });

    it('should return 400 for PrismaClientValidationError', () => {
      const error = new Prisma.PrismaClientValidationError('Invalid data', { clientVersion: '5.0.0' });

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Podano nieprawidłowe dane',
      });
    });
  });

  // --- Legacy bridge patterns ---

  describe('legacy bridge patterns', () => {
    it('should return 404 for errors with "not found" in message', () => {
      const error = new Error('Reservation not found');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Reservation not found',
      });
    });

    it('should return 409 for errors with "already exists" in message', () => {
      const error = new Error('Email already exists');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists',
      });
    });

    it('should return 409 for errors with "already booked" in message', () => {
      const error = new Error('Hall already booked for this date');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 409 for errors with "conflict" in message', () => {
      const error = new Error('Schedule conflict detected');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // --- Unknown / 500 errors ---

  describe('unknown errors (500)', () => {
    it('should return 500 for generic errors in dev mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Something broke');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something broke',
      });
    });

    it('should hide error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive internal error');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Wewnętrzny błąd serwera',
      });
    });

    it('should log unknown errors to console', () => {
      const error = new Error('Unexpected crash');

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(console.error).toHaveBeenCalledWith('[ERROR]', error);
    });

    it('should return fallback message when error has no message', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error();
      error.message = '';

      errorHandler(error, req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Wewnętrzny błąd serwera',
      });
    });
  });
});
