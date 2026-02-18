/**
 * AuthService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    role: { findUnique: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed_pw'),
}));

jest.mock('../../../middlewares/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

jest.mock('../../../utils/password', () => ({
  validatePassword: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { authService } from '../../../services/auth.service';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../middlewares/auth';
import { validatePassword } from '../../../utils/password';

const mockPrisma = prisma as any;

const USER_DB = {
  id: 'u-001',
  email: 'admin@go-ciniec.pl',
  password: 'hashed_pw',
  firstName: 'Jan',
  lastName: 'Admin',
  isActive: true,
  legacyRole: 'ADMIN',
  roleId: 'role-001',
  lastLoginAt: null,
  assignedRole: {
    id: 'role-001',
    name: 'Administrator',
    slug: 'admin',
    color: '#FF0000',
    permissions: [{ permission: { slug: 'reservations.manage' } }],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue(USER_DB);
  mockPrisma.user.create.mockResolvedValue(USER_DB);
  mockPrisma.user.update.mockResolvedValue(USER_DB);
  mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-001', slug: 'employee' });
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
});

describe('AuthService', () => {
  describe('login()', () => {
    it('should return token and user on valid credentials', async () => {
      const result = await authService.login('admin@go-ciniec.pl', 'password');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('admin@go-ciniec.pl');
      expect(result.user.permissions).toContain('reservations.manage');
      expect(generateToken).toHaveBeenCalledTimes(1);
    });

    it('should throw on invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('bad@x.pl', 'pw')).rejects.toThrow('Invalid credentials');
    });

    it('should throw on wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login('admin@go-ciniec.pl', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('should throw when user is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...USER_DB, isActive: false });
      await expect(authService.login('admin@go-ciniec.pl', 'pw')).rejects.toThrow('inactive');
    });
  });

  describe('register()', () => {
    it('should create user and return token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // no existing user
      const result = await authService.register({
        email: 'new@test.pl', password: 'Test1234!', firstName: 'Nowy', lastName: 'User',
      });
      expect(result.token).toBe('mock-jwt-token');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw when email already taken', async () => {
      await expect(authService.register({
        email: 'admin@go-ciniec.pl', password: 'Test1234!', firstName: 'A', lastName: 'B',
      })).rejects.toThrow('already exists');
    });

    it('should call validatePassword', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await authService.register({
        email: 'new@x.pl', password: 'Abc12345!', firstName: 'A', lastName: 'B',
      });
      expect(validatePassword).toHaveBeenCalledWith('Abc12345!');
    });
  });

  describe('getMe()', () => {
    it('should return current user with permissions', async () => {
      const result = await authService.getMe('u-001');
      expect(result.email).toBe('admin@go-ciniec.pl');
      expect(result.permissions).toContain('reservations.manage');
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.getMe('x')).rejects.toThrow('User not found');
    });
  });
});
