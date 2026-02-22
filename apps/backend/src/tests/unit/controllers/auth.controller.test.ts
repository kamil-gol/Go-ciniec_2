/**
 * AuthController — Unit Tests
 *
 * authController methods are wrapped in asyncHandler(fn),
 * which requires (req, res, next). Errors are forwarded to next().
 */

jest.mock('../../../services/auth.service', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
  },
}));

jest.mock('../../../utils/password', () => ({
  getPasswordRequirements: jest.fn(() => ({
    minLength: 8, requireUppercase: true, requireNumber: true,
  })),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import authService from '../../../services/auth.service';
import { authController } from '../../../controllers/auth.controller';

const svc = authService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, headers: {}, user: undefined,
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

let next: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  next = jest.fn();
});

describe('AuthController', () => {
  // ======= register =======
  describe('register', () => {
    it('should pass 400 to next when email missing', async () => {
      await authController.register(
        req({ body: { password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski' } }),
        res(), next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should pass 400 to next when password missing', async () => {
      await authController.register(
        req({ body: { email: 'a@b.pl', firstName: 'Jan', lastName: 'Kowalski' } }),
        res(), next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should pass 400 to next on invalid email format', async () => {
      await authController.register(
        req({ body: { email: 'not-email', password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski' } }),
        res(), next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should pass 400 to next when firstName too short', async () => {
      await authController.register(
        req({ body: { email: 'a@b.pl', password: 'Test123!', firstName: 'J', lastName: 'Kowalski' } }),
        res(), next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 201 on valid registration', async () => {
      svc.register.mockResolvedValue({ user: { id: 1 }, token: 'tok-123' });
      const response = res();
      await authController.register(
        req({ body: { email: 'jan@test.pl', password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski' } }),
        response, next
      );
      expect(next).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User registered successfully' })
      );
    });
  });

  // ======= login =======
  describe('login', () => {
    it('should pass 400 to next when email missing', async () => {
      await authController.login(req({ body: { password: 'pass' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should pass 400 to next when password missing', async () => {
      await authController.login(req({ body: { email: 'a@b.pl' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 200 on valid login', async () => {
      svc.login.mockResolvedValue({ user: { id: 1 }, token: 'tok-123' });
      const response = res();
      await authController.login(
        req({ body: { email: 'jan@test.pl', password: 'Test123!' } }),
        response, next
      );
      expect(next).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Logged in successfully' })
      );
    });
  });

  // ======= getMe =======
  describe('getMe', () => {
    it('should pass 401 to next when no user on request', async () => {
      await authController.getMe(req(), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return user data when authenticated', async () => {
      svc.getMe.mockResolvedValue({ id: 5, email: 'admin@test.pl', role: 'ADMIN' });
      const response = res();
      await authController.getMe(
        req({ user: { id: 5, email: 'admin@test.pl', role: 'ADMIN' } }),
        response, next
      );
      expect(next).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { user: expect.objectContaining({ id: 5 }) } })
      );
    });
  });

  // ======= getPasswordRequirements =======
  describe('getPasswordRequirements', () => {
    it('should return password requirements', () => {
      const response = res();
      authController.getPasswordRequirements(req(), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { requirements: expect.any(Object) } })
      );
    });
  });
});
