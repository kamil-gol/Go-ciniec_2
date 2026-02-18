/**
 * AuthController — Unit Tests
 * Tests register/login validation, getMe auth check, password requirements.
 */

jest.mock('../../../services/auth.service', () => ({
  authService: {
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

// Auth controller uses asyncHandler wrapper, so we test the inner logic directly
// by extracting the handler from the wrapper
import { authService } from '../../../services/auth.service';
import { getPasswordRequirements } from '../../../utils/password';
const svc = authService as any;
const getPwdReqs = getPasswordRequirements as jest.Mock;

// Since authController uses asyncHandler, we need to call the handler inside it
// Let's import and unwrap
import { authController } from '../../../controllers/auth.controller';

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: undefined,
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('AuthController', () => {
  // ======= register =======
  describe('register', () => {
    it('should throw 400 when email missing', async () => {
      const r = req({ body: { password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski' } });
      await expect(authController.register(r, res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when password missing', async () => {
      const r = req({ body: { email: 'a@b.pl', firstName: 'Jan', lastName: 'Kowalski' } });
      await expect(authController.register(r, res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 on invalid email format', async () => {
      const r = req({ body: { email: 'not-email', password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski' } });
      await expect(authController.register(r, res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when firstName too short', async () => {
      const r = req({ body: { email: 'a@b.pl', password: 'Test123!', firstName: 'J', lastName: 'Kowalski' } });
      await expect(authController.register(r, res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 201 on valid registration', async () => {
      svc.register.mockResolvedValue({ user: { id: 1 }, token: 'tok-123' });
      const r = req({ body: { email: 'jan@test.pl', password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski' } });
      const response = res();
      await authController.register(r, response);
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User registered successfully' })
      );
    });
  });

  // ======= login =======
  describe('login', () => {
    it('should throw 400 when email missing', async () => {
      const r = req({ body: { password: 'pass' } });
      await expect(authController.login(r, res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when password missing', async () => {
      const r = req({ body: { email: 'a@b.pl' } });
      await expect(authController.login(r, res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200 on valid login', async () => {
      svc.login.mockResolvedValue({ user: { id: 1 }, token: 'tok-123' });
      const r = req({ body: { email: 'jan@test.pl', password: 'Test123!' } });
      const response = res();
      await authController.login(r, response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Logged in successfully' })
      );
    });
  });

  // ======= getMe =======
  describe('getMe', () => {
    it('should throw 401 when no user on request', async () => {
      await expect(authController.getMe(req(), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return user data when authenticated', async () => {
      svc.getMe.mockResolvedValue({ id: 5, email: 'admin@test.pl', role: 'ADMIN' });
      const r = req({ user: { id: 5, email: 'admin@test.pl', role: 'ADMIN' } });
      const response = res();
      await authController.getMe(r, response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { user: expect.objectContaining({ id: 5 }) } })
      );
    });
  });

  // ======= getPasswordRequirements =======
  describe('getPasswordRequirements', () => {
    it('should return requirements', () => {
      const response = res();
      authController.getPasswordRequirements(req(), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { requirements: expect.any(Object) } })
      );
    });
  });
});
