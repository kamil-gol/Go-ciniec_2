import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Mock logger before importing auth module
jest.mock('../../../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { generateToken, verifyToken, authMiddleware, requireRole } from '../../../middlewares/auth';
import { AppError } from '../../../utils/AppError';

describe('auth middleware', () => {
  const SECRET = process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';

  describe('generateToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateToken({ id: '1', email: 'a@b.com', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' });

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should embed payload data in the token', () => {
      const payload = { id: 'u1', email: 'test@test.com', role: 'EMPLOYEE', roleId: 'r2', roleSlug: 'employee' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, SECRET) as any;

      expect(decoded.id).toBe('u1');
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.role).toBe('EMPLOYEE');
      expect(decoded.roleId).toBe('r2');
      expect(decoded.roleSlug).toBe('employee');
    });

    it('should include iat and exp in the token', () => {
      const token = generateToken({ id: '1', email: 'a@b.com', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' });
      const decoded = jwt.verify(token, SECRET) as any;

      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for valid token', () => {
      const token = generateToken({ id: 'u1', email: 'a@b.com', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' });
      const result = verifyToken(token);

      expect(result.id).toBe('u1');
      expect(result.email).toBe('a@b.com');
      expect(result.role).toBe('ADMIN');
    });

    it('should throw AppError 401 for invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow(AppError);
      try {
        verifyToken('invalid.token.here');
      } catch (e: any) {
        expect(e.statusCode).toBe(401);
        expect(e.message).toBe('Invalid or expired token');
      }
    });

    it('should throw AppError 401 for expired token', () => {
      const token = jwt.sign({ id: '1', email: 'a@b.com', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' }, SECRET, { expiresIn: '0s' });

      expect(() => verifyToken(token)).toThrow(AppError);
    });

    it('should throw AppError 401 for token signed with wrong secret', () => {
      const token = jwt.sign({ id: '1' }, 'wrong-secret');

      expect(() => verifyToken(token)).toThrow(AppError);
    });
  });

  describe('authMiddleware', () => {
    let req: any;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
      req = {
        headers: {},
        query: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('should set req.user and call next for valid Bearer token', () => {
      const token = generateToken({ id: 'u1', email: 'a@b.com', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res as Response, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('u1');
      expect(req.user.email).toBe('a@b.com');
      expect(req.user.role).toBe('ADMIN');
      expect(req.user.roleId).toBe('r1');
      expect(req.user.roleSlug).toBe('admin');
      expect(next).toHaveBeenCalledWith();
    });

    it('should accept token from query string', () => {
      const token = generateToken({ id: 'u2', email: 'b@b.com', role: 'EMPLOYEE', roleId: 'r2', roleSlug: 'employee' });
      req.query.token = token;

      authMiddleware(req, res as Response, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('u2');
      expect(next).toHaveBeenCalledWith();
    });

    it('should prefer Authorization header over query token', () => {
      const headerToken = generateToken({ id: 'header-user', email: 'h@b.com', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' });
      const queryToken = generateToken({ id: 'query-user', email: 'q@b.com', role: 'EMPLOYEE', roleId: 'r2', roleSlug: 'employee' });
      req.headers.authorization = `Bearer ${headerToken}`;
      req.query.token = queryToken;

      authMiddleware(req, res as Response, next);

      expect(req.user.id).toBe('header-user');
    });

    it('should call next with AppError 401 when no token', () => {
      authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('No token provided');
    });

    it('should call next with AppError 401 for invalid token', () => {
      req.headers.authorization = 'Bearer invalid.token';

      authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should call next with AppError 401 for malformed Authorization header', () => {
      req.headers.authorization = 'NotBearer token';

      authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('No token provided');
    });
  });

  describe('requireRole (legacy from auth.ts)', () => {
    let req: any;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('should call next when user has required role', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'ADMIN' };
      const middleware = requireRole('ADMIN');

      middleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with 403 when user lacks role', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE' };
      const middleware = requireRole('ADMIN');

      middleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should call next with 401 when no user', () => {
      req.user = undefined;
      const middleware = requireRole('ADMIN');

      middleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should accept user with one of multiple roles', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE' };
      const middleware = requireRole('ADMIN', 'EMPLOYEE');

      middleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
