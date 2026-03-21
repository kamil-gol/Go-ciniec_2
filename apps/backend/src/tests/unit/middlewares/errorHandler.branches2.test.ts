/**
 * ErrorHandler middleware — Branch Coverage (line 67: PrismaClientValidationError)
 * Also covers: 'already exists' conflict, 'already booked' conflict, default Prisma code fallthrough
 */
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@/prisma-client';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = {} as Request;
const mockNext = jest.fn() as NextFunction;

let errorHandler: any;

beforeAll(() => {
  const mod = require('../../../middlewares/errorHandler');
  errorHandler = mod.errorHandler;
});

beforeEach(() => jest.clearAllMocks());

describe('errorHandler — PrismaClientValidationError (line 67)', () => {

  it('should return 400 for PrismaClientValidationError', () => {
    const res = mockRes();
    // PrismaClientValidationError constructor requires specific params.
    // We create an object that passes instanceof via prototype chain.
    const validationError = new Prisma.PrismaClientValidationError('Invalid data', { clientVersion: '5.0.0' });

    errorHandler(validationError, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Podano nieprawidłowe dane',
    }));
  });
});

describe('errorHandler — Prisma default code fallthrough', () => {

  it('should fall through to 500 for unknown Prisma error code', () => {
    const res = mockRes();
    // Create a PrismaClientKnownRequestError with an unhandled code
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unknown', {
      code: 'P2024',
      clientVersion: '5.0.0',
    });

    errorHandler(prismaError, mockReq, res, mockNext);

    // Should fall through to the 500 handler since P2024 isn't handled
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('errorHandler — conflict patterns', () => {

  it('should return 409 for "already exists" error', () => {
    const res = mockRes();
    errorHandler(new Error('Użytkownik z tym adresem email już istnieje'), mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 409 for "already booked" error', () => {
    const res = mockRes();
    errorHandler(new Error('Hall already booked for this date'), mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 409 for "conflict" error', () => {
    const res = mockRes();
    errorHandler(new Error('Schedule conflict detected'), mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('errorHandler — 500 with NODE_ENV production', () => {

  it('should hide error message in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = mockRes();

    errorHandler(new Error('secret info'), mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Wewnętrzny błąd serwera',
    }));
    process.env.NODE_ENV = origEnv;
  });
});
