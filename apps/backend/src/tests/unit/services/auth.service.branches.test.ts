/**
 * AuthService — Branch Coverage Tests
 * Targets: null assignedRole, null legacyRole, null roleId fallbacks,
 * lastLoginAt update failure (.catch), default role lookup in register
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    role: { findUnique: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../middlewares/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

jest.mock('../../../utils/password', () => ({
  validatePassword: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { authService } from '../../../services/auth.service';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../middlewares/auth';

const mockPrisma = prisma as any;

describe('AuthService — branch coverage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  // ── login: null assignedRole branches ──────────────────────────
  describe('login — null assignedRole', () => {

    const userNoRole = {
      id: 'u1', email: 'test@test.pl', password: 'hashed',
      firstName: 'Jan', lastName: 'Kowalski',
      isActive: true, legacyRole: null, roleId: null,
      assignedRole: null, lastLoginAt: null,
    };

    it('should return empty permissions when user has no assignedRole', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userNoRole);
      mockPrisma.user.update.mockResolvedValue(userNoRole);

      const result = await authService.login('test@test.pl', 'password');

      expect(result.user.permissions).toEqual([]);
      expect(result.user.assignedRole).toBeNull();
    });

    it('should fallback legacyRole to EMPLOYEE when null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userNoRole);
      mockPrisma.user.update.mockResolvedValue(userNoRole);

      const result = await authService.login('test@test.pl', 'password');

      expect(result.user.role).toBe('EMPLOYEE');
    });

    it('should pass roleId=undefined and roleSlug=undefined to generateToken when null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userNoRole);
      mockPrisma.user.update.mockResolvedValue(userNoRole);

      await authService.login('test@test.pl', 'password');

      expect(generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'EMPLOYEE',
          roleId: undefined,
          roleSlug: undefined,
        })
      );
    });

    it('should handle lastLoginAt update failure gracefully via .catch', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userNoRole);
      mockPrisma.user.update.mockRejectedValue(new Error('DB write failed'));

      const result = await authService.login('test@test.pl', 'password');

      expect(result.token).toBe('mock-jwt-token');
    });
  });

  // ── login: with full assignedRole (truthy branch) ─────────────
  describe('login — with assignedRole', () => {

    const userWithRole = {
      id: 'u2', email: 'admin@test.pl', password: 'hashed',
      firstName: 'Anna', lastName: 'Nowak',
      isActive: true, legacyRole: 'ADMIN', roleId: 'role-1',
      assignedRole: {
        id: 'role-1', name: 'Admin', slug: 'admin', color: '#ff0000',
        permissions: [
          { permission: { slug: 'reservations.read' } },
          { permission: { slug: 'reservations.write' } },
        ],
      },
      lastLoginAt: null,
    };

    it('should map permissions from assignedRole', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithRole);
      mockPrisma.user.update.mockResolvedValue(userWithRole);

      const result = await authService.login('admin@test.pl', 'password');

      expect(result.user.permissions).toEqual(['reservations.read', 'reservations.write']);
      expect(result.user.assignedRole).toEqual({
        id: 'role-1', name: 'Admin', slug: 'admin', color: '#ff0000',
      });
      expect(result.user.role).toBe('ADMIN');
    });

    it('should pass roleId and roleSlug to generateToken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithRole);
      mockPrisma.user.update.mockResolvedValue(userWithRole);

      await authService.login('admin@test.pl', 'password');

      expect(generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: 'role-1',
          roleSlug: 'admin',
        })
      );
    });
  });

  // ── register: default role lookup branches ────────────────────
  describe('register — default role branches', () => {

    it('should lookup default employee role when roleId not provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-emp', slug: 'employee' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-new', email: 'new@test.pl', firstName: 'Nowy', lastName: 'User',
        legacyRole: 'EMPLOYEE', roleId: 'role-emp',
        assignedRole: { id: 'role-emp', name: 'Employee', slug: 'employee', color: '#00f' },
      });

      await authService.register({
        email: 'new@test.pl', password: 'Password1!',
        firstName: 'Nowy', lastName: 'User',
      });

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({ where: { slug: 'employee' } });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roleId: 'role-emp' }),
        })
      );
    });

    it('should handle missing default role (roleId=undefined)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-new', email: 'new@test.pl', firstName: 'Nowy', lastName: 'User',
        legacyRole: null, roleId: null, assignedRole: null,
      });

      const result = await authService.register({
        email: 'new@test.pl', password: 'Password1!',
        firstName: 'Nowy', lastName: 'User',
      });

      expect(result.user.assignedRole).toBeNull();
      expect(result.user.role).toBe('EMPLOYEE');
    });

    it('should skip role lookup when roleId is provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-new', email: 'new@test.pl', firstName: 'Nowy', lastName: 'User',
        legacyRole: 'ADMIN', roleId: 'role-admin',
        assignedRole: { id: 'role-admin', name: 'Admin', slug: 'admin', color: '#f00' },
      });

      const result = await authService.register({
        email: 'new@test.pl', password: 'Password1!',
        firstName: 'Nowy', lastName: 'User', roleId: 'role-admin',
      });

      expect(mockPrisma.role.findUnique).not.toHaveBeenCalled();
      expect(result.user.assignedRole).toEqual({
        id: 'role-admin', name: 'Admin', slug: 'admin', color: '#f00',
      });
    });

    it('should pass roleId=undefined and roleSlug=undefined when no assignedRole after create', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-new', email: 'new@test.pl', firstName: 'Nowy', lastName: 'User',
        legacyRole: null, roleId: null, assignedRole: null,
      });

      await authService.register({
        email: 'new@test.pl', password: 'Password1!',
        firstName: 'Nowy', lastName: 'User',
      });

      expect(generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'EMPLOYEE',
          roleId: undefined,
          roleSlug: undefined,
        })
      );
    });
  });

  // ── getMe: null assignedRole branches ─────────────────────────
  describe('getMe — null assignedRole', () => {

    it('should return empty permissions and null assignedRole', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'test@test.pl', firstName: 'Jan', lastName: 'Kowalski',
        legacyRole: null, isActive: true, lastLoginAt: null,
        assignedRole: null,
      });

      const result = await authService.getMe('u1');

      expect(result.permissions).toEqual([]);
      expect(result.assignedRole).toBeNull();
      expect(result.role).toBe('EMPLOYEE');
    });

    it('should return mapped permissions when assignedRole exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u2', email: 'admin@test.pl', firstName: 'Anna', lastName: 'Nowak',
        legacyRole: 'ADMIN', isActive: true, lastLoginAt: new Date(),
        assignedRole: {
          id: 'r1', name: 'Admin', slug: 'admin', color: '#f00',
          permissions: [{ permission: { slug: 'all' } }],
        },
      });

      const result = await authService.getMe('u2');

      expect(result.permissions).toEqual(['all']);
      expect(result.assignedRole).toEqual({
        id: 'r1', name: 'Admin', slug: 'admin', color: '#f00',
      });
      expect(result.role).toBe('ADMIN');
    });
  });
});
