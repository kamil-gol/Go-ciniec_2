/**
 * Auth Middleware — Branch coverage tests
 * Covers: extractToken (header / query / null), authMiddleware (valid / no token / AppError / generic),
 * requireRole (no user / wrong role / valid), verifyToken (valid / invalid)
 */
jest.mock('../../../utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import jwt from 'jsonwebtoken';
const TEST_SECRET = process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';
import { generateToken, verifyToken, authMiddleware, requireRole } from '../../../middlewares/auth';
const mockNext = jest.fn();
const VALID_PAYLOAD = {
    id: 'u-001',
    email: 'admin@test.pl',
    role: 'ADMIN',
    roleId: 'role-001',
    roleSlug: 'admin',
};
describe('Auth Middleware branches', () => {
    beforeEach(() => jest.clearAllMocks());
    // ===== generateToken =====
    describe('generateToken()', () => {
        it('should return a valid JWT string', () => {
            const token = generateToken(VALID_PAYLOAD);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
    });
    // ===== verifyToken =====
    describe('verifyToken()', () => {
        it('should return decoded payload for valid token', () => {
            const token = generateToken(VALID_PAYLOAD);
            const decoded = verifyToken(token);
            expect(decoded.id).toBe('u-001');
            expect(decoded.email).toBe('admin@test.pl');
        });
        it('should throw on invalid token', () => {
            expect(() => verifyToken('invalid.token.here')).toThrow('Invalid or expired token');
        });
        it('should throw on expired token', () => {
            const expiredToken = jwt.sign(VALID_PAYLOAD, TEST_SECRET, { expiresIn: '-1s' });
            expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');
        });
    });
    // ===== extractToken (tested via authMiddleware) =====
    describe('authMiddleware — extractToken branches', () => {
        it('should extract token from Authorization Bearer header', () => {
            const token = generateToken(VALID_PAYLOAD);
            const req = {
                headers: { authorization: `Bearer ${token}` },
                query: {},
            };
            const res = {};
            authMiddleware(req, res, mockNext);
            expect(req.user).toBeDefined();
            expect(req.user.id).toBe('u-001');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should extract token from query string', () => {
            const token = generateToken(VALID_PAYLOAD);
            const req = {
                headers: {},
                query: { token },
            };
            const res = {};
            authMiddleware(req, res, mockNext);
            expect(req.user).toBeDefined();
            expect(req.user.email).toBe('admin@test.pl');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next with error when no token provided', () => {
            const req = {
                headers: {},
                query: {},
            };
            const res = {};
            authMiddleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('No token') }));
        });
        it('should ignore Authorization header without Bearer prefix', () => {
            const req = {
                headers: { authorization: 'Basic abc123' },
                query: {},
            };
            const res = {};
            authMiddleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('No token') }));
        });
    });
    // ===== authMiddleware error handling =====
    describe('authMiddleware — error handling', () => {
        it('should forward AppError for invalid token', () => {
            const req = {
                headers: { authorization: 'Bearer invalid.token.data' },
                query: {},
            };
            const res = {};
            authMiddleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });
        it('should set user with all payload fields on valid token', () => {
            const token = generateToken(VALID_PAYLOAD);
            const req = {
                headers: { authorization: `Bearer ${token}` },
                query: {},
            };
            const res = {};
            authMiddleware(req, res, mockNext);
            expect(req.user).toEqual(expect.objectContaining({
                id: 'u-001',
                email: 'admin@test.pl',
                role: 'ADMIN',
                roleId: 'role-001',
                roleSlug: 'admin',
            }));
        });
    });
    // ===== requireRole =====
    describe('requireRole()', () => {
        it('should call next() when user has required role', () => {
            const middleware = requireRole('ADMIN', 'MANAGER');
            const req = { user: { ...VALID_PAYLOAD } };
            const res = {};
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next with 401 when no user on request', () => {
            const middleware = requireRole('ADMIN');
            const req = { user: undefined };
            const res = {};
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });
        it('should call next with 403 when user role not in allowed list', () => {
            const middleware = requireRole('ADMIN', 'MANAGER');
            const req = { user: { ...VALID_PAYLOAD, role: 'EMPLOYEE' } };
            const res = {};
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        });
        it('should work with single role', () => {
            const middleware = requireRole('EMPLOYEE');
            const req = { user: { ...VALID_PAYLOAD, role: 'EMPLOYEE' } };
            const res = {};
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
});
//# sourceMappingURL=auth.branches.test.js.map