/**
 * RolesService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: { count: jest.fn() },
    rolePermission: { deleteMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../middlewares/permissions', () => ({
  invalidateAllPermissionCaches: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import rolesService from '../../../services/roles.service';
import { prisma } from '../../../lib/prisma';
import { logActivity } from '../../../utils/audit-logger';
import { invalidateAllPermissionCaches } from '../../../middlewares/permissions';

const mockPrisma = prisma as any;
const ACTOR = 'actor-001';

const ROLE_DB = {
  id: 'role-001', name: 'Editor', slug: 'editor', description: 'Can edit',
  color: '#22C55E', isSystem: false, isActive: true,
  createdAt: new Date(), updatedAt: new Date(),
  _count: { users: 3 },
  permissions: [{ permission: { id: 'p-001', module: 'reservations', action: 'manage', slug: 'reservations.manage', name: 'Manage Reservations', description: '' } }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.role.findMany.mockResolvedValue([ROLE_DB]);
  mockPrisma.role.findUnique.mockResolvedValue(ROLE_DB);
  mockPrisma.role.create.mockResolvedValue(ROLE_DB);
  mockPrisma.role.update.mockResolvedValue(ROLE_DB);
  mockPrisma.role.delete.mockResolvedValue(ROLE_DB);
  mockPrisma.permission.count.mockResolvedValue(2);
  mockPrisma.$transaction.mockResolvedValue([]);
});

describe('RolesService', () => {
  describe('getRoles()', () => {
    it('should return formatted roles with permissions', async () => {
      const result = await rolesService.getRoles();
      expect(result).toHaveLength(1);
      expect(result[0].usersCount).toBe(3);
      expect(result[0].permissions[0].slug).toBe('reservations.manage');
    });
  });

  describe('getRoleById()', () => {
    it('should return role', async () => {
      const result = await rolesService.getRoleById('role-001');
      expect(result.name).toBe('Editor');
    });

    it('should throw when not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);
      await expect(rolesService.getRoleById('x')).rejects.toThrow();
    });
  });

  describe('createRole()', () => {
    it('should create role and audit', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null); // no slug/name conflict
      await rolesService.createRole({
        name: 'New', slug: 'new', permissionIds: ['p-001', 'p-002'],
      }, ACTOR);
      expect(mockPrisma.role.create).toHaveBeenCalledTimes(1);
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'ROLE_CREATED' }));
    });

    it('should throw on duplicate slug', async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(ROLE_DB); // slug exists
      await expect(rolesService.createRole({
        name: 'X', slug: 'editor', permissionIds: [],
      }, ACTOR)).rejects.toThrow(/slug/);
    });

    it('should throw when permission IDs invalid', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);
      mockPrisma.permission.count.mockResolvedValue(1); // only 1 of 2 found
      await expect(rolesService.createRole({
        name: 'X', slug: 'x', permissionIds: ['p-001', 'p-bad'],
      }, ACTOR)).rejects.toThrow(/uprawnienia/);
    });
  });

  describe('updateRole()', () => {
    it('should update and invalidate cache', async () => {
      await rolesService.updateRole('role-001', { name: 'Editor Pro' }, ACTOR);
      expect(invalidateAllPermissionCaches).toHaveBeenCalledTimes(1);
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'ROLE_UPDATED' }));
    });

    it('should throw on duplicate name', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(ROLE_DB) // existing check
        .mockResolvedValueOnce({ id: 'other', name: 'Taken' }); // name taken
      await expect(rolesService.updateRole('role-001', { name: 'Taken' }, ACTOR)).rejects.toThrow(/nazw/);
    });
  });

  describe('updateRolePermissions()', () => {
    it('should replace permissions in transaction', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(ROLE_DB)  // initial check
        .mockResolvedValueOnce(ROLE_DB); // after update
      await rolesService.updateRolePermissions('role-001', ['p-001', 'p-002'], ACTOR);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(invalidateAllPermissionCaches).toHaveBeenCalledTimes(1);
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'ROLE_PERMISSIONS_UPDATED' }));
    });
  });

  describe('deleteRole()', () => {
    it('should delete and audit', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ ...ROLE_DB, _count: { users: 0 } });
      await rolesService.deleteRole('role-001', ACTOR);
      expect(mockPrisma.role.delete).toHaveBeenCalledTimes(1);
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'ROLE_DELETED' }));
    });

    it('should throw when system role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ ...ROLE_DB, isSystem: true, _count: { users: 0 } });
      await expect(rolesService.deleteRole('role-001', ACTOR)).rejects.toThrow(/systemow/);
    });

    it('should throw when role has users', async () => {
      await expect(rolesService.deleteRole('role-001', ACTOR)).rejects.toThrow(/3 użytkownik/);
    });

    it('should throw when not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);
      await expect(rolesService.deleteRole('x', ACTOR)).rejects.toThrow();
    });
  });
});
