/**
 * Auth Middleware — Extra branch coverage
 * Covers: authMiddleware non-AppError catch (line 95), module-level JWT_SECRET branches (lines 12, 19)
 */

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { generateToken, authMiddleware } from '../../../middlewares/auth';

describe('Auth middleware — non-AppError catch branch', () => {
  it('should wrap non-AppError with Authentication failed (line 95)', () => {
    const mockNext = jest.fn();
    const token = generateToken({
      id: 'u-001', email: 'a@b.pl', role: 'ADMIN', roleId: 'r1', roleSlug: 'admin',
    });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      query: {},
    };
    // Force a non-AppError by making user property throw on assignment
    Object.defineProperty(req, 'user', {
      set() { throw new TypeError('Cannot set user property'); },
      get() { return undefined; },
      configurable: true,
    });

    authMiddleware(req, {} as any, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toBe('Authentication failed');
  });
});

describe('Auth module-level branches', () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
    jest.resetModules();
  });

  it('should throw FATAL when JWT_SECRET missing in production (line 12)', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    expect(() => {
      jest.isolateModules(() => {
        require('../../../middlewares/auth');
      });
    }).toThrow('FATAL');
  });

  it('should load successfully with warn when JWT_SECRET missing in non-production (line 19)', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'test';

    jest.isolateModules(() => {
      const auth = require('../../../middlewares/auth');
      expect(auth.generateToken).toBeDefined();
      expect(auth.verifyToken).toBeDefined();
    });
  });
});
