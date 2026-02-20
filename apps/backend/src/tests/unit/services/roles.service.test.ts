/**
 * Unit tests for roles.service.ts
 * Covers: getRoles, getRoleById, createRole, updateRole, updateRolePermissions, deleteRole
 * Issue: #96
 */

// ── Mocks ────────────────────────────────────────────────
const mockPrisma = {
  role: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  permission: {
    count: jest.fn(),
  },
  rolePermission: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@utils/AppError', () => ({
  AppError: {
    notFound: (msg: string) => { const e = new Error(`${msg} nie znaleziono`); (e as any).statusCode = 404; return e; },
    conflict: (msg: string) => { const e = new Error(msg); (e as any).statusCode = 409; return e; },
    badRequest: (msg: string) => { const e = new Error(msg); (e as any).statusCode = 400; return e; },
  },
}));
jest.mock('@utils/audit-logger', () => ({
  logActivity: jest.fn(),
}));
jest.mock('@middlewares/permissions', () => ({
  invalidateAllPermissionCaches: jest.fn(),
}));
jest.mock('@utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));

import RolesService from '@services/roles.service';
import { invalidateAllPermissionCaches } from '@middlewares/permissions';
import { logActivity } from '@utils/audit-logger';

// ── Fixtures ─────────────────────────────────────────────
const mockPermission = {
  id: 'perm-1',
  module: 'reservations',
  action: 'read',
  slug: 'reservations:read',
  name: 'Odczyt rezerwacji',
  description: 'Pozwala przeglądać rezerwacje',
};

const mockRoleData = {
  id: 'role-1',
  name: 'Administrator',
  slug: 'admin',
  description: 'Pełny dostęp',
  color: '#FF0000',
  isSystem: true,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  permissions: [{ permission: mockPermission }],
  _count: { users: 3 },
};

const mockCustomRole = {
  ...mockRoleData,
  id: 'role-custom',
  name: 'Kelner',
  slug: 'waiter',
  isSystem: false,
  _count: { users: 0 },
};

describe('RolesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════ getRoles ═══════════════
  describe('getRoles', () => {
    it('should return all roles with permissions and user count', async () => {
      mockPrisma.role.findMany.mockResolvedValue([mockRoleData]);

      const result = await RolesService.getRoles();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Administrator');
      expect(result[0].usersCount).toBe(3);
      expect(result[0].permissions[0].slug).toBe('reservations:read');
    });
  });

  // ═══════════════ getRoleById ═══════════════
  describe('getRoleById', () => {
    it('should return role with permissions', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRoleData);

      const result = await RolesService.getRoleById('role-1');

      expect(result.name).toBe('Administrator');
      expect(result.permissions).toHaveLength(1);
    });

    it('should throw 404 when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(RolesService.getRoleById('nonexistent'))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ createRole ═══════════════
  describe('createRole', () => {
    const createData = {
      name: 'Kelner',
      slug: 'waiter',
      description: 'Obsługa kelnerska',
      color: '#00FF00',
      permissionIds: ['perm-1', 'perm-2'],
    };

    it('should create role with permissions and log activity', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(null)  // slug unique
        .mockResolvedValueOnce(null); // name unique
      mockPrisma.permission.count.mockResolvedValue(2);
      mockPrisma.role.create.mockResolvedValue({
        ...mockCustomRole,
        permissions: [{ permission: mockPermission }],
      });

      const result = await RolesService.createRole(createData, 'actor-1');

      expect(result.name).toBe('Kelner');
      expect(result.isSystem).toBe(false);
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROLE_CREATED' })
      );
    });

    it('should throw conflict when slug already exists', async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(mockRoleData);

      await expect(RolesService.createRole(createData, 'actor-1'))
        .rejects.toThrow(/slug/);
    });

    it('should throw conflict when name already exists', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(null)   // slug OK
        .mockResolvedValueOnce(mockRoleData); // name taken

      await expect(RolesService.createRole(createData, 'actor-1'))
        .rejects.toThrow(/nazwą/);
    });

    it('should throw when some permission IDs are invalid', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.permission.count.mockResolvedValue(1); // only 1 of 2 found

      await expect(RolesService.createRole(createData, 'actor-1'))
        .rejects.toThrow(/uprawnienia/);
    });
  });

  // ═══════════════ updateRole ═══════════════
  describe('updateRole', () => {
    it('should update role and invalidate all permission caches', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(mockRoleData)  // existing role check
        .mockResolvedValueOnce(null);         // name uniqueness check — not taken
      mockPrisma.role.update.mockResolvedValue({
        ...mockRoleData,
        name: 'Super Admin',
      });

      const result = await RolesService.updateRole('role-1', { name: 'Super Admin' }, 'actor-1');

      expect(result.name).toBe('Super Admin');
      expect(invalidateAllPermissionCaches).toHaveBeenCalled();
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROLE_UPDATED' })
      );
    });

    it('should throw conflict when new name is taken by another role', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(mockRoleData) // existing role
        .mockResolvedValueOnce({ ...mockRoleData, id: 'other-role' }); // name taken

      await expect(RolesService.updateRole('role-1', { name: 'Taken Name' }, 'actor-1'))
        .rejects.toThrow(/nazwą/);
    });
  });

  // ═══════════════ updateRolePermissions ═══════════════
  describe('updateRolePermissions', () => {
    it('should replace permissions in a transaction and invalidate caches', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(mockRoleData)   // initial check
        .mockResolvedValueOnce(mockRoleData);  // after update reload
      mockPrisma.permission.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await RolesService.updateRolePermissions('role-1', ['perm-1', 'perm-2'], 'actor-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(invalidateAllPermissionCaches).toHaveBeenCalled();
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROLE_PERMISSIONS_UPDATED' })
      );
    });

    it('should throw when some permission IDs are invalid', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRoleData);
      mockPrisma.permission.count.mockResolvedValue(1); // only 1 of 3

      await expect(RolesService.updateRolePermissions('role-1', ['p1', 'p2', 'p3'], 'actor-1'))
        .rejects.toThrow(/uprawnienia/);
    });
  });

  // ═══════════════ deleteRole ════════════════
  describe('deleteRole', () => {
    it('should delete non-system role with 0 users', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockCustomRole);
      mockPrisma.role.delete.mockResolvedValue(mockCustomRole);

      await RolesService.deleteRole('role-custom', 'actor-1');

      expect(mockPrisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-custom' } });
      expect(invalidateAllPermissionCaches).toHaveBeenCalled();
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROLE_DELETED' })
      );
    });

    it('should throw when trying to delete system role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRoleData); // isSystem: true

      await expect(RolesService.deleteRole('role-1', 'actor-1'))
        .rejects.toThrow(/systemowej/);
    });

    it('should throw when role has assigned users', async () => {
      const roleWithUsers = { ...mockCustomRole, _count: { users: 5 } };
      mockPrisma.role.findUnique.mockResolvedValue(roleWithUsers);

      await expect(RolesService.deleteRole('role-custom', 'actor-1'))
        .rejects.toThrow(/5 użytkowników/);
    });

    it('should throw 404 when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(RolesService.deleteRole('nonexistent', 'actor-1'))
        .rejects.toThrow(/nie znaleziono/);
    });
  });
});
