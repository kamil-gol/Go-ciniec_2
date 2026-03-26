/**
 * AuthController — Unit Tests
 * Tests real controller logic: validation, status codes, response format, error handling.
 * Service layer is mocked (correct for unit tests), but we verify
 * the controller's own behavior: input validation, response shaping, edge cases.
 *
 * authController methods are wrapped in asyncHandler, so errors go to next().
 */

jest.mock('../../../services/auth.service', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
  },
}));

jest.mock('../../../utils/password', () => ({
  validatePassword: jest.fn().mockReturnValue({
    requirements: [
      { label: 'Min. 8 znaków', met: false },
      { label: 'Wielka litera', met: false },
    ],
  }),
}));

import { authController } from '../../../controllers/auth.controller';
import authService from '../../../services/auth.service';
import { AppError } from '../../../utils/AppError';

const svc = authService as jest.Mocked<typeof authService>;

const mockReq = (overrides: any = {}): any => ({
  body: {},
  params: {},
  query: {},
  user: undefined,
  ...overrides,
});

const mockRes = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

// Helper: call controller method (asyncHandler signature: (req, res, next) => void)
const call = (method: Function, req: any, res: any) => {
  return new Promise<void>((resolve) => {
    const next = (err?: any) => {
      mockNext(err);
      resolve();
    };
    method(req, res, next);
    // If no error, asyncHandler resolves normally — give it a tick
    setTimeout(resolve, 10);
  });
};

describe('AuthController', () => {
  // ════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════
  describe('register()', () => {
    const validBody = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should return 400 when email is missing', async () => {
      const req = mockReq({ body: { ...validBody, email: undefined } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const req = mockReq({ body: { ...validBody, password: '' } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when firstName is missing', async () => {
      const req = mockReq({ body: { ...validBody, firstName: undefined } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when lastName is missing', async () => {
      const req = mockReq({ body: { ...validBody, lastName: undefined } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 for invalid email format', async () => {
      const req = mockReq({ body: { ...validBody, email: 'not-an-email' } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid email format');
    });

    it('should return 400 when firstName is too short', async () => {
      const req = mockReq({ body: { ...validBody, firstName: 'J' } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockNext.mock.calls[0][0].message).toContain('at least 2 characters');
    });

    it('should return 400 when lastName is too short', async () => {
      const req = mockReq({ body: { ...validBody, lastName: 'D' } });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 201 with correct response on success', async () => {
      const serviceResult = {
        user: { id: 'u1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        token: 'jwt-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      svc.register.mockResolvedValue(serviceResult as any);

      const req = mockReq({ body: validBody });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: serviceResult,
          token: 'jwt-token',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: serviceResult.user,
          message: 'User registered successfully',
        })
      );
    });

    it('should call authService.register with correct params', async () => {
      svc.register.mockResolvedValue({ user: {}, token: 't', accessToken: 'a', refreshToken: 'r' } as any);

      const req = mockReq({ body: validBody });
      await call(authController.register, req, mockRes());

      expect(svc.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should forward service errors to next()', async () => {
      svc.register.mockRejectedValue(new AppError('Email already exists', 409));

      const req = mockReq({ body: validBody });
      const res = mockRes();
      await call(authController.register, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409, message: 'Email already exists' })
      );
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════
  describe('login()', () => {
    it('should return 400 when email is missing', async () => {
      const req = mockReq({ body: { password: 'pass' } });
      const res = mockRes();
      await call(authController.login, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when password is missing', async () => {
      const req = mockReq({ body: { email: 'test@example.com' } });
      const res = mockRes();
      await call(authController.login, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when both email and password are missing', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await call(authController.login, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(svc.login).not.toHaveBeenCalled();
    });

    it('should return 200 with correct response on success', async () => {
      const serviceResult = {
        user: { id: 'u1', email: 'test@example.com' },
        token: 'jwt-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      svc.login.mockResolvedValue(serviceResult as any);

      const req = mockReq({ body: { email: 'test@example.com', password: 'Password123!' } });
      const res = mockRes();
      await call(authController.login, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: serviceResult,
          token: 'jwt-token',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: serviceResult.user,
          message: 'Logged in successfully',
        })
      );
    });

    it('should not set explicit status (defaults to 200)', async () => {
      svc.login.mockResolvedValue({
        user: {}, token: 't', accessToken: 'a', refreshToken: 'r',
      } as any);

      const req = mockReq({ body: { email: 'a@b.c', password: 'pass' } });
      const res = mockRes();
      await call(authController.login, req, res);

      // login uses res.json() directly without res.status()
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should forward service auth errors to next()', async () => {
      svc.login.mockRejectedValue(new AppError('Invalid credentials', 401));

      const req = mockReq({ body: { email: 'test@example.com', password: 'wrong' } });
      const res = mockRes();
      await call(authController.login, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  // ════════════════════════════════════════
  // REFRESH
  // ════════════════════════════════════════
  describe('refresh()', () => {
    it('should return 400 when refreshToken is missing', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await call(authController.refresh, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return success with new tokens', async () => {
      const serviceResult = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      };
      svc.refresh.mockResolvedValue(serviceResult as any);

      const req = mockReq({ body: { refreshToken: 'old-token' } });
      const res = mockRes();
      await call(authController.refresh, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: serviceResult,
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        })
      );
    });

    it('should call authService.refresh with the token', async () => {
      svc.refresh.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' } as any);

      const req = mockReq({ body: { refreshToken: 'the-token' } });
      await call(authController.refresh, req, mockRes());

      expect(svc.refresh).toHaveBeenCalledWith('the-token');
    });

    it('should forward expired token error to next()', async () => {
      svc.refresh.mockRejectedValue(new AppError('Token expired', 401));

      const req = mockReq({ body: { refreshToken: 'expired-token' } });
      const res = mockRes();
      await call(authController.refresh, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  // ════════════════════════════════════════
  // LOGOUT
  // ════════════════════════════════════════
  describe('logout()', () => {
    it('should return success even without refreshToken', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await call(authController.logout, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(svc.logout).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Wylogowano pomyślnie',
        })
      );
    });

    it('should call authService.logout when refreshToken is provided', async () => {
      svc.logout.mockResolvedValue(undefined as any);

      const req = mockReq({ body: { refreshToken: 'token-to-revoke' } });
      const res = mockRes();
      await call(authController.logout, req, res);

      expect(svc.logout).toHaveBeenCalledWith('token-to-revoke');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should forward service errors on logout to next()', async () => {
      svc.logout.mockRejectedValue(new Error('DB connection lost'));

      const req = mockReq({ body: { refreshToken: 'some-token' } });
      const res = mockRes();
      await call(authController.logout, req, res);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ════════════════════════════════════════
  // GET ME
  // ════════════════════════════════════════
  describe('getMe()', () => {
    it('should return 401 when req.user is undefined', async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();
      await call(authController.getMe, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return 401 when req.user is null', async () => {
      const req = mockReq({ user: null });
      const res = mockRes();
      await call(authController.getMe, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return user data on success', async () => {
      const userData = {
        id: 'u1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: { id: 'r1', name: 'Admin', slug: 'admin', color: '#f00' },
        permissions: ['READ', 'WRITE'],
      };
      svc.getMe.mockResolvedValue(userData as any);

      const req = mockReq({ user: { id: 'u1' } });
      const res = mockRes();
      await call(authController.getMe, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(svc.getMe).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: userData },
      });
    });

    it('should forward service errors to next()', async () => {
      svc.getMe.mockRejectedValue(new AppError('User not found', 404));

      const req = mockReq({ user: { id: 'deleted-user' } });
      const res = mockRes();
      await call(authController.getMe, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });
  });

  // ════════════════════════════════════════
  // GET PASSWORD REQUIREMENTS
  // ════════════════════════════════════════
  describe('getPasswordRequirements()', () => {
    it('should return requirements without needing auth', () => {
      const req = mockReq();
      const res = mockRes();

      // This is a synchronous handler (not wrapped in asyncHandler)
      authController.getPasswordRequirements(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requirements: expect.arrayContaining([
            expect.objectContaining({ label: expect.any(String), met: expect.any(Boolean) }),
          ]),
        },
      });
    });
  });

  // ════════════════════════════════════════
  // FORGOT PASSWORD
  // ════════════════════════════════════════
  describe('forgotPassword()', () => {
    it('should return 400 when email is missing', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await call(authController.forgotPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 for invalid email format', async () => {
      const req = mockReq({ body: { email: 'invalid-email' } });
      const res = mockRes();
      await call(authController.forgotPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return success even if email does not exist (anti-enumeration)', async () => {
      svc.forgotPassword.mockResolvedValue(undefined as any);

      const req = mockReq({ body: { email: 'nobody@example.com' } });
      const res = mockRes();
      await call(authController.forgotPassword, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );
    });

    it('should call authService.forgotPassword with email', async () => {
      svc.forgotPassword.mockResolvedValue(undefined as any);

      const req = mockReq({ body: { email: 'user@example.com' } });
      await call(authController.forgotPassword, req, mockRes());

      expect(svc.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    it('should forward unexpected service errors to next()', async () => {
      svc.forgotPassword.mockRejectedValue(new Error('SMTP down'));

      const req = mockReq({ body: { email: 'user@example.com' } });
      const res = mockRes();
      await call(authController.forgotPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ════════════════════════════════════════
  // RESET PASSWORD
  // ════════════════════════════════════════
  describe('resetPassword()', () => {
    it('should return 400 when token is missing', async () => {
      const req = mockReq({ body: { newPassword: 'NewPass123!' } });
      const res = mockRes();
      await call(authController.resetPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when newPassword is missing', async () => {
      const req = mockReq({ body: { token: 'some-token' } });
      const res = mockRes();
      await call(authController.resetPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when both token and newPassword are missing', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await call(authController.resetPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(svc.resetPassword).not.toHaveBeenCalled();
    });

    it('should return success on valid reset', async () => {
      svc.resetPassword.mockResolvedValue(undefined as any);

      const req = mockReq({ body: { token: 'valid-token', newPassword: 'NewPass123!' } });
      const res = mockRes();
      await call(authController.resetPassword, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(svc.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPass123!');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );
    });

    it('should forward invalid token error to next()', async () => {
      svc.resetPassword.mockRejectedValue(new AppError('Token invalid', 400));

      const req = mockReq({ body: { token: 'bad-token', newPassword: 'NewPass123!' } });
      const res = mockRes();
      await call(authController.resetPassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });
  });

  // ════════════════════════════════════════
  // CHANGE PASSWORD
  // ════════════════════════════════════════
  describe('changePassword()', () => {
    it('should return 401 when req.user is missing', async () => {
      const req = mockReq({ body: { oldPassword: 'old', newPassword: 'new' } });
      const res = mockRes();
      await call(authController.changePassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return 400 when oldPassword is missing', async () => {
      const req = mockReq({ user: { id: 'u1' }, body: { newPassword: 'NewPass123!' } });
      const res = mockRes();
      await call(authController.changePassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return 400 when newPassword is missing', async () => {
      const req = mockReq({ user: { id: 'u1' }, body: { oldPassword: 'OldPass123!' } });
      const res = mockRes();
      await call(authController.changePassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should return success on valid password change', async () => {
      svc.changePassword.mockResolvedValue(undefined as any);

      const req = mockReq({
        user: { id: 'u1' },
        body: { oldPassword: 'OldPass123!', newPassword: 'NewPass456!' },
      });
      const res = mockRes();
      await call(authController.changePassword, req, res);

      expect(mockNext).not.toHaveBeenCalled();
      expect(svc.changePassword).toHaveBeenCalledWith('u1', 'OldPass123!', 'NewPass456!');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );
    });

    it('should forward wrong password error to next()', async () => {
      svc.changePassword.mockRejectedValue(new AppError('Wrong password', 400));

      const req = mockReq({
        user: { id: 'u1' },
        body: { oldPassword: 'wrong', newPassword: 'NewPass456!' },
      });
      const res = mockRes();
      await call(authController.changePassword, req, res);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });
  });
});
