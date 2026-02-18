/**
 * UsersService — Comprehensive Unit Tests
 * Targets 52.63% branches. Covers: getUsers all filters, getUserById
 * with/without role, createUser (duplicate, role not found, admin/employee slug),
 * updateUser (email conflict, role check, cache invalidation, conditional fields),
 * changePassword, toggleActive (self-block, active/inactive), deleteUser.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
    role: { findUnique: jest.fn() },
  },
}));
jest.mock('../../../utils/audit-logger', () => ({ logChange: jest.fn() }));
jest.mock('../../../utils/logger', () => ({ __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../../middlewares/permissions', () => ({ invalidatePermissionCache: jest.fn() }));
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed123') }));
jest.mock('../../../utils/password', () => ({ validatePassword: jest.fn() }));

import UsersService from '../../../services/users.service';
import { prisma } from '../../../lib/prisma';
import { invalidatePermissionCache } from '../../../middlewares/permissions';
import { validatePassword } from '../../../utils/password';

const db = prisma as any;
const svc = UsersService;

const USER = {
  id: 'u1', email: 'jan@test.pl', firstName: 'Jan', lastName: 'K',
  isActive: true, lastLoginAt: null, legacyRole: 'EMPLOYEE', createdAt: new Date(), updatedAt: new Date(),
  assignedRole: { id: 'r1', name: 'Employee', slug: 'employee', color: '#000',
    permissions: [{ permission: { slug: 'clients:read' } }]
  },
};

beforeEach(() => jest.clearAllMocks());

describe('UsersService', () => {
  // ========== getUsers ==========
  describe('getUsers()', () => {
    beforeEach(() => {
      db.user.findMany.mockResolvedValue([USER]);
      db.user.count.mockResolvedValue(1);
    });

    it('should use defaults', async () => {
      const result = await svc.getUsers({});
      expect(result.users).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by search', async () => {
      await svc.getUsers({ search: 'Jan' });
      const call = db.user.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(3);
    });

    it('should filter by roleId', async () => {
      await svc.getUsers({ roleId: 'r1' });
      const call = db.user.findMany.mock.calls[0][0];
      expect(call.where.roleId).toBe('r1');
    });

    it('should filter by isActive', async () => {
      await svc.getUsers({ isActive: true });
      const call = db.user.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(true);
    });

    it('should not set isActive when undefined', async () => {
      await svc.getUsers({});
      const call = db.user.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBeUndefined();
    });
  });

  // ========== getUserById ==========
  describe('getUserById()', () => {
    it('should throw when not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(svc.getUserById('x')).rejects.toThrow();
    });

    it('should return user with role and permissions', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      const result = await svc.getUserById('u1');
      expect(result.role).toEqual({ id: 'r1', name: 'Employee', slug: 'employee', color: '#000' });
      expect(result.permissions).toEqual(['clients:read']);
    });

    it('should return null role/empty permissions when no assignedRole', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER, assignedRole: null });
      const result = await svc.getUserById('u1');
      expect(result.role).toBeNull();
      expect(result.permissions).toEqual([]);
    });
  });

  // ========== createUser ==========
  describe('createUser()', () => {
    const CREATE_DATA = { email: 'new@test.pl', password: 'Password1!', firstName: 'A', lastName: 'B', roleId: 'r1' };

    it('should throw on duplicate email', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(svc.createUser(CREATE_DATA, 'actor')).rejects.toThrow('email');
    });

    it('should throw when role not found', async () => {
      db.user.findUnique.mockResolvedValueOnce(null); // email check
      db.role.findUnique.mockResolvedValue(null);
      await expect(svc.createUser(CREATE_DATA, 'actor')).rejects.toThrow();
    });

    it('should set legacyRole to ADMIN when role slug is admin', async () => {
      db.user.findUnique.mockResolvedValueOnce(null);
      db.role.findUnique.mockResolvedValue({ id: 'r-admin', name: 'Admin', slug: 'admin' });
      db.user.create.mockResolvedValue({ ...USER, legacyRole: 'ADMIN', assignedRole: { id: 'r-admin', name: 'Admin', slug: 'admin', color: '#f00' } });
      const result = await svc.createUser(CREATE_DATA, 'actor');
      expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ legacyRole: 'ADMIN' }),
      }));
    });

    it('should set legacyRole to EMPLOYEE when role slug is not admin', async () => {
      db.user.findUnique.mockResolvedValueOnce(null);
      db.role.findUnique.mockResolvedValue({ id: 'r1', name: 'Employee', slug: 'employee' });
      db.user.create.mockResolvedValue(USER);
      await svc.createUser(CREATE_DATA, 'actor');
      expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ legacyRole: 'EMPLOYEE' }),
      }));
    });
  });

  // ========== updateUser ==========
  describe('updateUser()', () => {
    it('should throw when not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(svc.updateUser('x', {}, 'actor')).rejects.toThrow();
    });

    it('should throw on email conflict', async () => {
      db.user.findUnique
        .mockResolvedValueOnce(USER)
        .mockResolvedValueOnce({ id: 'other' }); // email taken
      await expect(svc.updateUser('u1', { email: 'taken@test.pl' }, 'actor')).rejects.toThrow('email');
    });

    it('should not check email uniqueness when same email', async () => {
      db.user.findUnique.mockResolvedValueOnce(USER);
      db.user.update.mockResolvedValue(USER);
      await svc.updateUser('u1', { email: 'jan@test.pl' }, 'actor');
      expect(db.user.findUnique).toHaveBeenCalledTimes(1); // only existing check
    });

    it('should throw when role not found', async () => {
      db.user.findUnique.mockResolvedValueOnce(USER);
      db.role.findUnique.mockResolvedValue(null);
      await expect(svc.updateUser('u1', { roleId: 'bad-role' }, 'actor')).rejects.toThrow();
    });

    it('should invalidate permission cache when roleId changed', async () => {
      db.user.findUnique.mockResolvedValueOnce(USER);
      db.role.findUnique.mockResolvedValue({ id: 'r2', name: 'Manager', slug: 'manager' });
      db.user.update.mockResolvedValue({ ...USER, assignedRole: { id: 'r2', name: 'Manager', slug: 'manager', color: '#0f0' } });
      await svc.updateUser('u1', { roleId: 'r2' }, 'actor');
      expect(invalidatePermissionCache).toHaveBeenCalledWith('u1');
    });

    it('should not invalidate cache without roleId change', async () => {
      db.user.findUnique.mockResolvedValueOnce(USER);
      db.user.update.mockResolvedValue({ ...USER, firstName: 'Anna' });
      await svc.updateUser('u1', { firstName: 'Anna' }, 'actor');
      expect(invalidatePermissionCache).not.toHaveBeenCalled();
    });

    it('should only include defined fields in updateData', async () => {
      db.user.findUnique.mockResolvedValueOnce(USER);
      db.user.update.mockResolvedValue(USER);
      await svc.updateUser('u1', { firstName: 'Anna', isActive: false }, 'actor');
      const call = db.user.update.mock.calls[0][0];
      expect(call.data.firstName).toBe('Anna');
      expect(call.data.isActive).toBe(false);
      expect(call.data.lastName).toBeUndefined();
    });
  });

  // ========== changePassword ==========
  describe('changePassword()', () => {
    it('should throw when not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(svc.changePassword('x', 'New1!', 'actor')).rejects.toThrow();
    });

    it('should change password successfully', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue(USER);
      await svc.changePassword('u1', 'NewPass1!', 'actor');
      expect(validatePassword).toHaveBeenCalledWith('NewPass1!');
      expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { password: 'hashed123' },
      }));
    });

    it('should log changedBy self when actorId = userId', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue(USER);
      await svc.changePassword('u1', 'NewPass1!', 'u1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: { changedBy: 'self' },
      }));
    });

    it('should log changedBy admin when actorId != userId', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue(USER);
      await svc.changePassword('u1', 'NewPass1!', 'admin-id');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: { changedBy: 'admin' },
      }));
    });
  });

  // ========== toggleActive ==========
  describe('toggleActive()', () => {
    it('should throw when not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(svc.toggleActive('x', 'actor')).rejects.toThrow();
    });

    it('should throw when trying to deactivate self', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      await expect(svc.toggleActive('u1', 'u1')).rejects.toThrow('w\u0142asnego');
    });

    it('should deactivate active user', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER, isActive: true });
      db.user.update.mockResolvedValue({ ...USER, isActive: false });
      const result = await svc.toggleActive('u1', 'other');
      expect(result.isActive).toBe(false);
    });

    it('should activate inactive user', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER, isActive: false });
      db.user.update.mockResolvedValue({ ...USER, isActive: true });
      const result = await svc.toggleActive('u1', 'other');
      expect(result.isActive).toBe(true);
    });
  });

  // ========== deleteUser ==========
  describe('deleteUser()', () => {
    it('should throw when not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(svc.deleteUser('x', 'actor')).rejects.toThrow();
    });

    it('should throw when deleting self', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      await expect(svc.deleteUser('u1', 'u1')).rejects.toThrow('w\u0142asnego');
    });

    it('should soft-delete user', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue(undefined);
      await svc.deleteUser('u1', 'other');
      expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { isActive: false },
      }));
      expect(invalidatePermissionCache).toHaveBeenCalledWith('u1');
    });
  });
});
