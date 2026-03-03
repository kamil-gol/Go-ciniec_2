/**
 * Auth Controller — Unit Tests
 */

jest.mock('../../../services/auth.service', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    refreshToken: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(msg?: string) { return new MockAppError(msg || 'Unauthorized', 401); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
  }
  return { AppError: MockAppError };
});

import { AuthController } from '../../../controllers/auth.controller';
import authService from '../../../services/auth.service';

const ctrl = new AuthController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should login successfully', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'test@test.pl' },
      accessToken: 'token123',
      refreshToken: 'refresh123'
    });
    const req = { body: { email: 'test@test.pl', password: 'pass' } } as any;
    const res = mockRes();
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw badRequest when email missing', async () => {
    const req = { body: { password: 'pass' } } as any;
    await expect(ctrl.login(req, mockRes())).rejects.toThrow(/required/);
  });

  it('should throw badRequest when password missing', async () => {
    const req = { body: { email: 'test@test.pl' } } as any;
    await expect(ctrl.login(req, mockRes())).rejects.toThrow(/required/);
  });

  it('should refresh token successfully', async () => {
    (authService.refreshToken as jest.Mock).mockResolvedValue({
      accessToken: 'newToken',
      refreshToken: 'newRefresh'
    });
    const req = { body: { refreshToken: 'oldRefresh' } } as any;
    const res = mockRes();
    await ctrl.refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should verify token successfully', async () => {
    (authService.verifyToken as jest.Mock).mockResolvedValue({ id: '1', email: 'test@test.pl' });
    const req = { body: { token: 'validToken' } } as any;
    const res = mockRes();
    await ctrl.verifyToken(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw unauthorized when login fails', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    const req = { body: { email: 'wrong@test.pl', password: 'wrong' } } as any;
    await expect(ctrl.login(req, mockRes())).rejects.toThrow(/Invalid credentials/);
  });

  it('should throw unauthorized when token is invalid', async () => {
    (authService.verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
    const req = { body: { token: 'badToken' } } as any;
    await expect(ctrl.verifyToken(req, mockRes())).rejects.toThrow(/Invalid token/);
  });

  it('should set cookies on successful login', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      user: { id: '1' },
      accessToken: 'token',
      refreshToken: 'refresh'
    });
    const req = { body: { email: 'test@test.pl', password: 'pass' } } as any;
    const res = mockRes();
    await ctrl.login(req, res);
    expect(res.cookie).toHaveBeenCalled();
  });

  it('should handle missing refresh token', async () => {
    const req = { body: {} } as any;
    await expect(ctrl.refreshToken(req, mockRes())).rejects.toThrow(/required/);
  });

  it('should handle missing token in verify', async () => {
    const req = { body: {} } as any;
    await expect(ctrl.verifyToken(req, mockRes())).rejects.toThrow(/required/);
  });

  it('should handle login with invalid credentials (coverage line ~157)', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    const req = { body: { email: 'bad@test.pl', password: 'bad' } } as any;
    await expect(ctrl.login(req, mockRes())).rejects.toThrow(/Invalid credentials/);
  });
});
