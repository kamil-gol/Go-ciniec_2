/**
 * RolesService — Branch Coverage Tests
 * Covers: createRole slug/name/perms validation, updateRole conditional fields,
 * updateRolePermissions validation, deleteRole guards (system, hasUsers),
 * formatRole fallbacks (_count?.users, permissions || [])
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        role: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        permission: { count: jest.fn() },
        rolePermission: {
            deleteMany: jest.fn(),
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
jest.mock('../../../utils/audit-logger', () => ({
    logActivity: jest.fn().mockResolvedValue(undefined),
    logChange: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../middlewares/permissions', () => ({
    invalidateAllPermissionCaches: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import rolesService from '../../../services/roles.service';
import { prisma } from '../../../lib/prisma';
import { invalidateAllPermissionCaches } from '../../../middlewares/permissions';
const db = prisma;
const makeRole = (o = {}) => ({
    id: 'r-1', name: 'Admin', slug: 'admin',
    description: 'Admin role', color: '#FF0000',
    isSystem: false, isActive: true,
    permissions: [{
            permission: { id: 'p-1', module: 'users', action: 'read', slug: 'users:read', name: 'Read', description: 'Read users' },
        }],
    _count: { users: 0 },
    createdAt: new Date(), updatedAt: new Date(),
    ...o,
});
beforeEach(() => jest.resetAllMocks());
describe('RolesService — branches', () => {
    // ═══ getRoleById ═══
    describe('getRoleById()', () => {
        it('should throw when role not found', async () => {
            db.role.findUnique.mockResolvedValue(null);
            await expect(rolesService.getRoleById('bad')).rejects.toThrow('Rola');
        });
        it('should return formatted role', async () => {
            db.role.findUnique.mockResolvedValue(makeRole());
            const result = await rolesService.getRoleById('r-1');
            expect(result.name).toBe('Admin');
            expect(result.usersCount).toBe(0);
            expect(result.permissions).toHaveLength(1);
        });
    });
    // ═══ createRole ═══
    describe('createRole()', () => {
        it('should throw when slug already exists', async () => {
            db.role.findUnique.mockResolvedValueOnce({ id: 'existing' }); // slug check
            await expect(rolesService.createRole({ name: 'New', slug: 'admin', permissionIds: [] }, 'user-1')).rejects.toThrow('slug');
        });
        it('should throw when name already exists', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(null) // slug check → OK
                .mockResolvedValueOnce({ id: 'existing' }); // name check
            await expect(rolesService.createRole({ name: 'Admin', slug: 'new-slug', permissionIds: [] }, 'user-1')).rejects.toThrow('nazw');
        });
        it('should throw when some permissions do not exist', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(null) // slug
                .mockResolvedValueOnce(null); // name
            db.permission.count.mockResolvedValue(1); // only 1 of 2 found
            await expect(rolesService.createRole({ name: 'New', slug: 'new', permissionIds: ['p-1', 'p-999'] }, 'user-1')).rejects.toThrow('uprawnienia');
        });
        it('should create role with description and color', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            db.permission.count.mockResolvedValue(1);
            db.role.create.mockResolvedValue(makeRole());
            const result = await rolesService.createRole({ name: 'New', slug: 'new', description: 'Desc', color: '#00F', permissionIds: ['p-1'] }, 'user-1');
            expect(result.name).toBe('Admin');
        });
        it('should create role without description and color', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            db.permission.count.mockResolvedValue(0);
            db.role.create.mockResolvedValue(makeRole({ description: null, color: null }));
            const result = await rolesService.createRole({ name: 'Basic', slug: 'basic', permissionIds: [] }, 'user-1');
            expect(result.description).toBeNull();
        });
    });
    // ═══ updateRole ═══
    describe('updateRole()', () => {
        it('should throw when role not found', async () => {
            db.role.findUnique.mockResolvedValue(null);
            await expect(rolesService.updateRole('bad', { name: 'X' }, 'u-1'))
                .rejects.toThrow('Rola');
        });
        it('should check name uniqueness when name changes', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(makeRole()) // existing
                .mockResolvedValueOnce({ id: 'other' }); // nameTaken
            await expect(rolesService.updateRole('r-1', { name: 'Taken' }, 'u-1'))
                .rejects.toThrow('nazw');
        });
        it('should skip name check when name is same as existing', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole({ name: 'Admin' }));
            db.role.update.mockResolvedValue(makeRole());
            // name === existing.name → skip uniqueness check
            await rolesService.updateRole('r-1', { name: 'Admin' }, 'u-1');
            // findUnique called only ONCE (for existing), not twice (no name check)
            expect(db.role.findUnique).toHaveBeenCalledTimes(1);
        });
        it('should skip name check when name not provided', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole());
            db.role.update.mockResolvedValue(makeRole());
            await rolesService.updateRole('r-1', { description: 'New desc' }, 'u-1');
            expect(db.role.findUnique).toHaveBeenCalledTimes(1);
        });
        it('should update only name field', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(makeRole())
                .mockResolvedValueOnce(null); // name not taken
            db.role.update.mockResolvedValue(makeRole({ name: 'New' }));
            await rolesService.updateRole('r-1', { name: 'New' }, 'u-1');
            expect(db.role.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'New' } }));
        });
        it('should update only description field', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole());
            db.role.update.mockResolvedValue(makeRole());
            await rolesService.updateRole('r-1', { description: 'Updated' }, 'u-1');
            expect(db.role.update).toHaveBeenCalledWith(expect.objectContaining({ data: { description: 'Updated' } }));
        });
        it('should update only color field', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole());
            db.role.update.mockResolvedValue(makeRole());
            await rolesService.updateRole('r-1', { color: '#00FF00' }, 'u-1');
            expect(db.role.update).toHaveBeenCalledWith(expect.objectContaining({ data: { color: '#00FF00' } }));
        });
        it('should update only isActive field', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole());
            db.role.update.mockResolvedValue(makeRole({ isActive: false }));
            await rolesService.updateRole('r-1', { isActive: false }, 'u-1');
            expect(db.role.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
        });
        it('should update all fields at once', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(makeRole())
                .mockResolvedValueOnce(null); // name check
            db.role.update.mockResolvedValue(makeRole());
            await rolesService.updateRole('r-1', {
                name: 'Super', description: 'D', color: '#FFF', isActive: false,
            }, 'u-1');
            expect(db.role.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { name: 'Super', description: 'D', color: '#FFF', isActive: false },
            }));
            expect(invalidateAllPermissionCaches).toHaveBeenCalled();
        });
        it('should update with no fields (empty object)', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole());
            db.role.update.mockResolvedValue(makeRole());
            await rolesService.updateRole('r-1', {}, 'u-1');
            expect(db.role.update).toHaveBeenCalledWith(expect.objectContaining({ data: {} }));
        });
    });
    // ═══ updateRolePermissions ═══
    describe('updateRolePermissions()', () => {
        it('should throw when role not found', async () => {
            db.role.findUnique.mockResolvedValue(null);
            await expect(rolesService.updateRolePermissions('bad', ['p-1'], 'u-1'))
                .rejects.toThrow('Rola');
        });
        it('should throw when permissions invalid', async () => {
            db.role.findUnique.mockResolvedValueOnce(makeRole());
            db.permission.count.mockResolvedValue(0); // none found
            await expect(rolesService.updateRolePermissions('r-1', ['p-999'], 'u-1'))
                .rejects.toThrow('uprawnienia');
        });
        it('should update permissions via transaction', async () => {
            db.role.findUnique
                .mockResolvedValueOnce(makeRole()) // initial check
                .mockResolvedValueOnce(makeRole()); // after update
            db.permission.count.mockResolvedValue(2);
            db.$transaction.mockResolvedValue([]);
            const result = await rolesService.updateRolePermissions('r-1', ['p-1', 'p-2'], 'u-1');
            expect(db.$transaction).toHaveBeenCalled();
            expect(result.name).toBe('Admin');
        });
    });
    // ═══ deleteRole ═══
    describe('deleteRole()', () => {
        it('should throw when role not found', async () => {
            db.role.findUnique.mockResolvedValue(null);
            await expect(rolesService.deleteRole('bad', 'u-1')).rejects.toThrow('Rola');
        });
        it('should throw when role is system', async () => {
            db.role.findUnique.mockResolvedValue(makeRole({ isSystem: true }));
            await expect(rolesService.deleteRole('r-1', 'u-1')).rejects.toThrow('systemow');
        });
        it('should throw when role has assigned users', async () => {
            db.role.findUnique.mockResolvedValue(makeRole({ _count: { users: 3 } }));
            await expect(rolesService.deleteRole('r-1', 'u-1')).rejects.toThrow('przypisanej');
        });
        it('should delete successfully', async () => {
            db.role.findUnique.mockResolvedValue(makeRole({ _count: { users: 0 } }));
            db.role.delete.mockResolvedValue(undefined);
            await rolesService.deleteRole('r-1', 'u-1');
            expect(db.role.delete).toHaveBeenCalledWith({ where: { id: 'r-1' } });
            expect(invalidateAllPermissionCaches).toHaveBeenCalled();
        });
    });
    // ═══ formatRole fallbacks ═══
    describe('formatRole fallbacks (via createRole)', () => {
        const setupCreate = () => {
            db.role.findUnique
                .mockResolvedValueOnce(null) // slug
                .mockResolvedValueOnce(null); // name
            db.permission.count.mockResolvedValue(0);
        };
        it('should handle missing _count (usersCount=0 fallback)', async () => {
            setupCreate();
            db.role.create.mockResolvedValue(makeRole({ _count: undefined }));
            const result = await rolesService.createRole({ name: 'New', slug: 'new', permissionIds: [] }, 'u-1');
            expect(result.usersCount).toBe(0);
        });
        it('should handle null _count.users (|| 0 fallback)', async () => {
            setupCreate();
            db.role.create.mockResolvedValue(makeRole({ _count: { users: null } }));
            const result = await rolesService.createRole({ name: 'New', slug: 'new', permissionIds: [] }, 'u-1');
            expect(result.usersCount).toBe(0);
        });
        it('should handle missing permissions array', async () => {
            setupCreate();
            db.role.create.mockResolvedValue(makeRole({ permissions: undefined }));
            const result = await rolesService.createRole({ name: 'New', slug: 'new', permissionIds: [] }, 'u-1');
            expect(result.permissions).toEqual([]);
        });
        it('should handle null permissions array', async () => {
            setupCreate();
            db.role.create.mockResolvedValue(makeRole({ permissions: null }));
            const result = await rolesService.createRole({ name: 'New', slug: 'new', permissionIds: [] }, 'u-1');
            expect(result.permissions).toEqual([]);
        });
    });
    // ═══ getRoles ═══
    describe('getRoles()', () => {
        it('should return formatted list', async () => {
            db.role.findMany.mockResolvedValue([makeRole()]);
            const result = await rolesService.getRoles();
            expect(result).toHaveLength(1);
            expect(result[0].usersCount).toBe(0);
            expect(result[0].permissions).toHaveLength(1);
        });
        it('should return empty list', async () => {
            db.role.findMany.mockResolvedValue([]);
            const result = await rolesService.getRoles();
            expect(result).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=roles.service.branches.test.js.map