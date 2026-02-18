/**
 * AuthService — Comprehensive Unit Tests
 * Expands 58.82% branches → target ~95%.
 * Missing branches: null assignedRole, null legacyRole, null roleId,
 * register with/without roleId, employee role not found, lastLogin update catch.
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
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { authService } from '../../../services/auth.service';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../middlewares/auth';
import { validatePassword } from '../../../utils/password';

const db = prisma as any;

const USER_WITH_ROLE = {
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

const USER_NO_ROLE = {
  ...USER_WITH_ROLE,
  assignedRole: null,
  roleId: null,
  legacyRole: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  db.user.findUnique.mockResolvedValue(USER_WITH_ROLE);
  db.user.create.mockResolvedValue(USER_WITH_ROLE);
  db.user.update.mockResolvedValue(USER_WITH_ROLE);
  db.role.findUnique.mockResolvedValue({ id: 'role-001', slug: 'employee' });
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
});

describe('AuthService', () => {
  // ========== login() ==========
  describe('login()', () => {
    it('should return token and user on valid credentials', async () => {
      const result = await authService.login('admin@go-ciniec.pl', 'password');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('admin@go-ciniec.pl');
      expect(result.user.permissions).toContain('reservations.manage');
      expect(generateToken).toHaveBeenCalledTimes(1);
    });

    it('should throw on invalid email (user not found)', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('bad@x.pl', 'pw')).rejects.toThrow('Invalid credentials');
    });

    it('should throw on wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login('admin@go-ciniec.pl', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('should throw when user is inactive', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER_WITH_ROLE, isActive: false });
      await expect(authService.login('admin@go-ciniec.pl', 'pw')).rejects.toThrow('inactive');
    });

    // --- Missing branch: null assignedRole → empty permissions, null assignedRole in response ---
    it('should return empty permissions when user has no assignedRole', async () => {
      db.user.findUnique.mockResolvedValue(USER_NO_ROLE);
      const result = await authService.login('admin@go-ciniec.pl', 'pw');
      expect(result.user.permissions).toEqual([]);
      expect(result.user.assignedRole).toBeNull();
    });

    // --- Missing branch: null legacyRole → defaults to 'EMPLOYEE' ---
    it('should default role to EMPLOYEE when legacyRole is null', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER_WITH_ROLE, legacyRole: null });
      const result = await authService.login('admin@go-ciniec.pl', 'pw');
      expect(result.user.role).toBe('EMPLOYEE');
    });

    // --- Missing branch: generateToken with null roleId/roleSlug ---
    it('should pass undefined roleId/roleSlug to generateToken when missing', async () => {
      db.user.findUnique.mockResolvedValue(USER_NO_ROLE);
      await authService.login('admin@go-ciniec.pl', 'pw');
      expect(generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'EMPLOYEE',
          roleId: undefined,
          roleSlug: undefined,
        })
      );
    });

    // --- Missing branch: lastLogin update .catch() ---
    it('should not throw when lastLogin update fails', async () => {
      db.user.update.mockRejectedValue(new Error('DB connection lost'));
      const result = await authService.login('admin@go-ciniec.pl', 'pw');
      expect(result.token).toBe('mock-jwt-token');
    });
  });

  // ========== register() ==========
  describe('register()', () => {
    it('should create user and return token', async () => {
      db.user.findUnique.mockResolvedValue(null);
      const result = await authService.register({
        email: 'new@test.pl', password: 'Test1234!', firstName: 'Nowy', lastName: 'User',
      });
      expect(result.token).toBe('mock-jwt-token');
      expect(db.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw when email already taken', async () => {
      await expect(authService.register({
        email: 'admin@go-ciniec.pl', password: 'Test1234!', firstName: 'A', lastName: 'B',
      })).rejects.toThrow('already exists');
    });

    it('should call validatePassword', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await authService.register({
        email: 'new@x.pl', password: 'Abc12345!', firstName: 'A', lastName: 'B',
      });
      expect(validatePassword).toHaveBeenCalledWith('Abc12345!');
    });

    // --- Missing branch: register WITH explicit roleId ---
    it('should use provided roleId and skip employee role lookup', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await authService.register({
        email: 'new@x.pl', password: 'Pass1!', firstName: 'A', lastName: 'B', roleId: 'custom-role',
      });
      expect(db.role.findUnique).not.toHaveBeenCalled();
      expect(db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roleId: 'custom-role' }),
        })
      );
    });

    // --- Missing branch: no roleId AND employee role not found ---
    it('should handle missing employee role gracefully (roleId undefined)', async () => {
      db.user.findUnique.mockResolvedValue(null);
      db.role.findUnique.mockResolvedValue(null); // employee role not found
      await authService.register({
        email: 'new@x.pl', password: 'Pass1!', firstName: 'A', lastName: 'B',
      });
      expect(db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roleId: undefined }),
        })
      );
    });

    // --- Missing branch: created user with no assignedRole ---
    it('should return null assignedRole when created user has none', async () => {
      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockResolvedValue({ ...USER_WITH_ROLE, assignedRole: null, legacyRole: null, roleId: null });
      const result = await authService.register({
        email: 'new@x.pl', password: 'Pass1!', firstName: 'A', lastName: 'B',
      });
      expect(result.user.assignedRole).toBeNull();
      expect(result.user.role).toBe('EMPLOYEE');
    });

    // --- Missing branch: created user with assignedRole but null roleId ---
    it('should pass undefined roleSlug when user has no assignedRole', async () => {
      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockResolvedValue({ ...USER_NO_ROLE });
      await authService.register({
        email: 'new@x.pl', password: 'Pass1!', firstName: 'A', lastName: 'B',
      });
      expect(generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: undefined,
          roleSlug: undefined,
        })
      );
    });
  });

  // ========== getMe() ==========
  describe('getMe()', () => {
    it('should return current user with permissions', async () => {
      const result = await authService.getMe('u-001');
      expect(result.email).toBe('admin@go-ciniec.pl');
      expect(result.permissions).toContain('reservations.manage');
      expect(result.assignedRole).toEqual({
        id: 'role-001', name: 'Administrator', slug: 'admin', color: '#FF0000',
      });
    });

    it('should throw when user not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(authService.getMe('x')).rejects.toThrow('User not found');
    });

    // --- Missing branch: no assignedRole → empty permissions, null assignedRole ---
    it('should return empty permissions and null assignedRole when no role', async () => {
      db.user.findUnique.mockResolvedValue(USER_NO_ROLE);
      const result = await authService.getMe('u-001');
      expect(result.permissions).toEqual([]);
      expect(result.assignedRole).toBeNull();
    });

    // --- Missing branch: null legacyRole defaults to 'EMPLOYEE' ---
    it('should default role to EMPLOYEE when legacyRole is null', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER_WITH_ROLE, legacyRole: null });
      const result = await authService.getMe('u-001');
      expect(result.role).toBe('EMPLOYEE');
    });
  });
});
