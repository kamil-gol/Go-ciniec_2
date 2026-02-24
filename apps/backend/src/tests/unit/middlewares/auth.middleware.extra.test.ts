/**
 * Auth Middleware — Extra branch coverage
 * Covers: authMiddleware non-AppError catch (line 95)
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
    Object.defineProperty(req, 'user', {
      set() { throw new TypeError('Cannot set user property'); },
      get() { return undefined; },
      configurable: true,
    });

    authMiddleware(req, {} as any, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toBe('Uwierzytelnienie nie powiodło się');
  });
});
