/**
 * Auth Middleware — Unit Tests
 */

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-key-do-not-use-in-production';
process.env.JWT_SECRET = SECRET;

import { authMiddleware, generateToken, verifyToken, requireRole } from '../../../middlewares/auth';

const mockReq = (overrides: any = {}): any => ({
  headers: {}, query: {}, user: undefined,
  ...overrides,
});
const mockRes = (): any => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('Auth Middleware', () => {
  describe('generateToken()', () => {
    it('should generate a valid JWT', () => {
      const token = generateToken({ id: 1, email: 'a@b.pl', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' });
      const decoded = jwt.verify(token, SECRET) as any;
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe('a@b.pl');
    });
  });

  describe('verifyToken()', () => {
    it('should return payload for valid token', () => {
      const token = jwt.sign({ id: 1, email: 'a@b.pl', role: 'ADMIN' }, SECRET, { expiresIn: '1h' });
      const payload = verifyToken(token);
      expect(payload.id).toBe(1);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw on expired token', () => {
      const token = jwt.sign({ id: 1 }, SECRET, { expiresIn: '-1h' });
      expect(() => verifyToken(token)).toThrow();
    });
  });

  describe('authMiddleware()', () => {
    it('should call next with error when no token', () => {
      authMiddleware(mockReq(), mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should set req.user on valid Bearer token', () => {
      const token = jwt.sign({ id: 5, email: 'x@y.pl', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin' }, SECRET);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      authMiddleware(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith();
      expect(req.user.id).toBe(5);
      expect(req.user.role).toBe('ADMIN');
    });

    it('should accept token from query string', () => {
      const token = jwt.sign({ id: 3, email: 'q@q.pl', role: 'EMPLOYEE' }, SECRET);
      const req = mockReq({ query: { token } });
      authMiddleware(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith();
      expect(req.user.id).toBe(3);
    });

    it('should call next with error on expired token', () => {
      const token = jwt.sign({ id: 1 }, SECRET, { expiresIn: '-1h' });
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      authMiddleware(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('requireRole()', () => {
    it('should call next when user has allowed role', () => {
      const middleware = requireRole('ADMIN', 'EMPLOYEE');
      const req = mockReq({ user: { id: 1, email: 'a@b.pl', role: 'ADMIN' } });
      middleware(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with 403 when role not allowed', () => {
      const middleware = requireRole('ADMIN');
      const req = mockReq({ user: { id: 1, email: 'a@b.pl', role: 'EMPLOYEE' } });
      middleware(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('should call next with 401 when no user', () => {
      const middleware = requireRole('ADMIN');
      middleware(mockReq(), mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
