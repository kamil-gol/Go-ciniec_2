/**
 * UsersService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: { findUnique: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
}));

jest.mock('../../../utils/password', () => ({
  validatePassword: jest.fn(),
}));

jest.mock('../../../middlewares/permissions', () => ({
  invalidatePermissionCache: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import usersService from '../../../services/users.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';
import { invalidatePermissionCache } from '../../../middlewares/permissions';
import { validatePassword } from '../../../utils/password';

const mockPrisma = prisma as any;
const ACTOR = 'actor-001';

const USER_DB = {
  id: 'u-001', email: 'jan@test.pl', firstName: 'Jan', lastName: 'Kowalski',
  isActive: true, lastLoginAt: null, legacyRole: 'EMPLOYEE', roleId: 'role-001',
  createdAt: new Date(), updatedAt: new Date(),
  assignedRole: { id: 'role-001', name: 'Employee', slug: 'employee', color: '#3B82F6',
    permissions: [{ permission: { slug: 'reservations.view' } }] },
};

const ROLE = { id: 'role-001', name: 'Employee', slug: 'employee' };

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findMany.mockResolvedValue([USER_DB]);
  mockPrisma.user.findUnique.mockResolvedValue(USER_DB);
  mockPrisma.user.create.mockResolvedValue(USER_DB);
  mockPrisma.user.update.mockResolvedValue({ ...USER_DB, isActive: false });
  mockPrisma.user.count.mockResolvedValue(1);
  mockPrisma.role.findUnique.mockResolvedValue(ROLE);
});

describe('UsersService', () => {
  describe('getUsers()', () => {
    it('should return paginated users', async () => {
      const result = await usersService.getUsers({ page: 1, limit: 20 });
      expect(result.users).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      await usersService.getUsers({ search: 'jan' });
      const call = mockPrisma.user.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(3);
    });
  });

  describe('getUserById()', () => {
    it('should return user with permissions', async () => {
      const result = await usersService.getUserById('u-001');
      expect(result.email).toBe('jan@test.pl');
      expect(result.permissions).toContain('reservations.view');
    });

    it('should throw when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(usersService.getUserById('x')).rejects.toThrow();
    });
  });

  describe('createUser()', () => {
    it('should create user and audit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // no existing
      await usersService.createUser({
        email: 'new@test.pl', password: 'Test1234!', firstName: 'A', lastName: 'B', roleId: 'role-001',
      }, ACTOR);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATED' }));
    });

    it('should throw on duplicate email', async () => {
      await expect(usersService.createUser({
        email: 'jan@test.pl', password: 'Test1234!', firstName: 'A', lastName: 'B', roleId: 'role-001',
      }, ACTOR)).rejects.toThrow(/email/);
    });

    it('should throw when role not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);
      await expect(usersService.createUser({
        email: 'x@x.pl', password: 'Test1234!', firstName: 'A', lastName: 'B', roleId: 'bad',
      }, ACTOR)).rejects.toThrow();
    });
  });

  describe('updateUser()', () => {
    it('should update and audit', async () => {
      mockPrisma.user.update.mockResolvedValue(USER_DB);
      await usersService.updateUser('u-001', { firstName: 'Janek' }, ACTOR);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_UPDATED' }));
    });

    it('should invalidate permission cache on role change', async () => {
      mockPrisma.user.update.mockResolvedValue(USER_DB);
      await usersService.updateUser('u-001', { roleId: 'role-002' }, ACTOR);
      expect(invalidatePermissionCache).toHaveBeenCalledWith('u-001');
    });
  });

  describe('changePassword()', () => {
    it('should hash and update password', async () => {
      await usersService.changePassword('u-001', 'NewPass1!', ACTOR);
      expect(validatePassword).toHaveBeenCalledWith('NewPass1!');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_PASSWORD_CHANGED' }));
    });
  });

  describe('toggleActive()', () => {
    it('should toggle and audit', async () => {
      await usersService.toggleActive('u-001', ACTOR);
      expect(logChange).toHaveBeenCalled();
    });

    it('should throw when toggling self', async () => {
      await expect(usersService.toggleActive('u-001', 'u-001')).rejects.toThrow(/własnego/);
    });
  });

  describe('deleteUser()', () => {
    it('should soft-delete and audit', async () => {
      await usersService.deleteUser('u-001', ACTOR);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
      expect(invalidatePermissionCache).toHaveBeenCalledWith('u-001');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_DELETED' }));
    });

    it('should throw when deleting self', async () => {
      await expect(usersService.deleteUser('u-001', 'u-001')).rejects.toThrow(/własnego/);
    });
  });
});
