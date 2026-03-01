/**
 * Unit tests for middlewares/auth.ts
 * Covers: generateToken, verifyToken, extractToken, authMiddleware, requireRole
 * Issue: #96
 * FIX: spolonizowane komunikaty błędów
 */
import jwt from 'jsonwebtoken';

// Must set env BEFORE importing the module
process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';
process.env.JWT_EXPIRY = '1h';

jest.mock('@utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { generateToken, verifyToken, authMiddleware, requireRole } from '@middlewares/auth';
import { AppError } from '@middlewares/errorHandler';

// ── Helpers ──────────────────────────────────────────────
const mockRequest = (overrides: any = {}) => ({
  headers: {},
  query: {},
  user: undefined,
  ...overrides,
});

const mockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const mockNext = jest.fn();

const validPayload = {
  id: 'user-1',
  email: 'admin@test.pl',
  role: 'ADMIN',
  roleId: 'role-1',
  roleSlug: 'admin',
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════
  // generateToken & verifyToken
  // ══════════════════════════════════════════════════════
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in the token', () => {
      const token = generateToken(validPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.id).toBe('user-1');
      expect(decoded.email).toBe('admin@test.pl');
      expect(decoded.role).toBe('ADMIN');
      expect(decoded.roleSlug).toBe('admin');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return payload', () => {
      const token = generateToken(validPayload);
      const result = verifyToken(token);

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('admin@test.pl');
    });

    it('should throw AppError(401) for invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
      try {
        verifyToken('invalid.token.here');
      } catch (e: any) {
        expect(e).toBeInstanceOf(AppError);
        expect(e.statusCode).toBe(401);
        expect(e.message).toBe('Nieprawidłowy lub wygasły token');
      }
    });

    it('should throw AppError(401) for expired token', () => {
      const expiredToken = jwt.sign(
        validPayload,
        'test-secret-key-do-not-use-in-production',
        { expiresIn: '0s' }
      );

      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });

  // ══════════════════════════════════════════════════════
  // authMiddleware
  // ══════════════════════════════════════════════════════
  describe('authMiddleware', () => {
    it('should authenticate request with valid Bearer token', () => {
      const token = generateToken(validPayload);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` },
      });

      authMiddleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-1');
      expect(req.user.email).toBe('admin@test.pl');
      expect(req.user.role).toBe('ADMIN');
    });

    it('should authenticate request with token in query string', () => {
      const token = generateToken(validPayload);
      const req = mockRequest({ query: { token } });

      authMiddleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-1');
    });

    it('should call next with AppError(401) when no token provided', () => {
      const req = mockRequest();

      authMiddleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Brak tokena uwierzytelniającego',
        })
      );
    });

    it('should call next with AppError(401) for malformed token', () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid.garbage.token' },
      });

      authMiddleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should prefer Authorization header over query token', () => {
      const headerToken = generateToken(validPayload);
      const queryToken = generateToken({ ...validPayload, id: 'user-other' });
      const req = mockRequest({
        headers: { authorization: `Bearer ${headerToken}` },
        query: { token: queryToken },
      });

      authMiddleware(req as any, mockResponse() as any, mockNext);

      expect(req.user.id).toBe('user-1'); // from header, not query
    });
  });

  // ══════════════════════════════════════════════════════
  // requireRole (legacy)
  // ══════════════════════════════════════════════════════
  describe('requireRole', () => {
    it('should call next() when user has matching role', () => {
      const req = mockRequest({ user: { ...validPayload } });
      const middleware = requireRole('ADMIN', 'MANAGER');

      middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AppError(403) when user has wrong role', () => {
      const req = mockRequest({ user: { ...validPayload, role: 'EMPLOYEE' } });
      const middleware = requireRole('ADMIN');

      middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Niewystarczające uprawnienia',
        })
      );
    });

    it('should call next with AppError(401) when user is not authenticated', () => {
      const req = mockRequest({ user: undefined });
      const middleware = requireRole('ADMIN');

      middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Wymagane uwierzytelnienie',
        })
      );
    });
  });
});
