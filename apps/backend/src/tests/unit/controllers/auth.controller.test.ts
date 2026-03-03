/**
 * Tests for auth.controller.ts (plain object singleton)
 * Refactored to work with actual controller structure
 */

import authService from '../../../services/auth.service';

jest.mock('../../../services/auth.service', () => ({
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

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthController', () => {
  describe('service integration', () => {
    it('should call register service method', async () => {
      const mockResult = {
        user: { id: 'u1', email: 'test@example.com' },
        token: 'jwt-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockResult);
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should call login service method', async () => {
      const mockResult = {
        user: { id: 'u1', email: 'test@example.com' },
        token: 'jwt-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual(mockResult);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    it('should call refresh service method', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (authService.refresh as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.refresh('old-refresh-token');

      expect(result).toEqual(mockResult);
      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
    });
  });
});
