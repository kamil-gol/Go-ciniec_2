import { AppError } from '../../../utils/AppError';
// Mock logger
jest.mock('../../../utils/logger', () => ({
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));
// Mock PrismaClient
const mockFindUnique = jest.fn();
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            user: { findUnique: mockFindUnique },
        })),
        Prisma: {
            PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
                constructor(message, opts) {
                    super(message);
                    this.code = opts.code;
                }
            },
        },
    };
});
import { requirePermission, requireAnyPermission, attachPermissionCheck, loadUserPermissions, invalidatePermissionCache, invalidateAllPermissionCaches, } from '../../../middlewares/permissions';
describe('permissions middleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = {
            user: { id: 'user-1', email: 'test@test.com', role: 'EMPLOYEE', roleId: 'r1', roleSlug: 'employee' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        mockFindUnique.mockReset();
        invalidateAllPermissionCaches();
    });
    // Helper: mock DB user with permissions
    function mockUserWithPermissions(permissions) {
        mockFindUnique.mockResolvedValue({
            id: 'user-1',
            assignedRole: {
                name: 'Employee',
                slug: 'employee',
                permissions: permissions.map((p) => ({
                    permission: { slug: p },
                })),
            },
        });
    }
    function mockUserWithoutRole() {
        mockFindUnique.mockResolvedValue({
            id: 'user-1',
            assignedRole: null,
            legacyRole: undefined,
        });
    }
    function mockAdminLegacy() {
        mockFindUnique.mockResolvedValue({
            id: 'user-1',
            assignedRole: null,
            legacyRole: 'ADMIN',
        });
    }
    function mockEmployeeLegacy() {
        mockFindUnique.mockResolvedValue({
            id: 'user-1',
            assignedRole: null,
            legacyRole: 'EMPLOYEE',
        });
    }
    // --- loadUserPermissions ---
    describe('loadUserPermissions', () => {
        it('should load permissions from DB', async () => {
            mockUserWithPermissions(['reservations:read', 'reservations:create']);
            const result = await loadUserPermissions('user-1');
            expect(result.permissions.has('reservations:read')).toBe(true);
            expect(result.permissions.has('reservations:create')).toBe(true);
            expect(result.roleName).toBe('Employee');
            expect(result.roleSlug).toBe('employee');
        });
        it('should cache permissions on second call', async () => {
            mockUserWithPermissions(['reservations:read']);
            await loadUserPermissions('user-1');
            await loadUserPermissions('user-1');
            expect(mockFindUnique).toHaveBeenCalledTimes(1);
        });
        it('should return legacy ADMIN permissions with wildcard', async () => {
            mockAdminLegacy();
            const result = await loadUserPermissions('user-1');
            expect(result.permissions.has('*')).toBe(true);
        });
        it('should return legacy EMPLOYEE permissions', async () => {
            mockEmployeeLegacy();
            const result = await loadUserPermissions('user-1');
            expect(result.permissions.has('reservations:read')).toBe(true);
            expect(result.permissions.has('dashboard:read')).toBe(true);
        });
        it('should return minimal permissions for unknown legacy role', async () => {
            mockUserWithoutRole();
            const result = await loadUserPermissions('user-1');
            expect(result.permissions.has('dashboard:read')).toBe(true);
            expect(result.permissions.size).toBe(1);
        });
    });
    // --- invalidatePermissionCache ---
    describe('cache invalidation', () => {
        it('should invalidate single user cache', async () => {
            mockUserWithPermissions(['reservations:read']);
            await loadUserPermissions('user-1');
            invalidatePermissionCache('user-1');
            mockUserWithPermissions(['reservations:read', 'reservations:delete']);
            const result = await loadUserPermissions('user-1');
            expect(result.permissions.has('reservations:delete')).toBe(true);
            expect(mockFindUnique).toHaveBeenCalledTimes(2);
        });
        it('should invalidate all caches', async () => {
            mockUserWithPermissions(['reservations:read']);
            await loadUserPermissions('user-1');
            invalidateAllPermissionCaches();
            await loadUserPermissions('user-1');
            expect(mockFindUnique).toHaveBeenCalledTimes(2);
        });
    });
    // --- requirePermission ---
    describe('requirePermission', () => {
        it('should call next() when user has required permission', async () => {
            mockUserWithPermissions(['reservations:read']);
            const middleware = requirePermission('reservations:read');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });
        it('should call next() when user has wildcard permission', async () => {
            mockUserWithPermissions(['*']);
            const middleware = requirePermission('anything:here');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });
        it('should call next with 403 when user lacks permission', async () => {
            mockUserWithPermissions(['reservations:read']);
            const middleware = requirePermission('reservations:delete');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
        it('should require ALL permissions when multiple specified', async () => {
            mockUserWithPermissions(['reservations:read']);
            const middleware = requirePermission('reservations:read', 'reservations:delete');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
        it('should pass when user has all required permissions', async () => {
            mockUserWithPermissions(['reservations:read', 'reservations:delete']);
            const middleware = requirePermission('reservations:read', 'reservations:delete');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });
        it('should return 401 when no user on request', async () => {
            req.user = undefined;
            const middleware = requirePermission('reservations:read');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(401);
        });
        it('should attach permissions to request on success', async () => {
            mockUserWithPermissions(['reservations:read']);
            const middleware = requirePermission('reservations:read');
            await middleware(req, res, next);
            expect(req.userPermissions).toBeDefined();
            expect(req.userRoleName).toBe('Employee');
        });
        it('should return 500 when DB fails', async () => {
            mockFindUnique.mockRejectedValue(new Error('DB down'));
            const middleware = requirePermission('reservations:read');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(500);
        });
    });
    // --- requireAnyPermission ---
    describe('requireAnyPermission', () => {
        it('should pass when user has at least one of the permissions', async () => {
            mockUserWithPermissions(['menu:manage_templates']);
            const middleware = requireAnyPermission('menu:manage_templates', 'menu:manage_packages');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });
        it('should reject when user has none of the permissions', async () => {
            mockUserWithPermissions(['reservations:read']);
            const middleware = requireAnyPermission('menu:manage_templates', 'menu:manage_packages');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
        it('should pass with wildcard permission', async () => {
            mockUserWithPermissions(['*']);
            const middleware = requireAnyPermission('anything:a', 'anything:b');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });
        it('should return 401 when no user', async () => {
            req.user = undefined;
            const middleware = requireAnyPermission('reservations:read');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(401);
        });
        it('should return 500 on DB error', async () => {
            mockFindUnique.mockRejectedValue(new Error('DB down'));
            const middleware = requireAnyPermission('reservations:read');
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(500);
        });
    });
    // --- attachPermissionCheck ---
    describe('attachPermissionCheck', () => {
        it('should attach permission results to request', async () => {
            mockUserWithPermissions(['reservations:read', 'reservations:create']);
            const middleware = attachPermissionCheck('reservations:read', 'reservations:delete');
            await middleware(req, res, next);
            expect(req.permissionResults).toEqual({
                'reservations:read': true,
                'reservations:delete': false,
            });
            expect(next).toHaveBeenCalled();
        });
        it('should set all true for wildcard user', async () => {
            mockUserWithPermissions(['*']);
            const middleware = attachPermissionCheck('anything:a', 'anything:b');
            await middleware(req, res, next);
            expect(req.permissionResults).toEqual({
                'anything:a': true,
                'anything:b': true,
            });
        });
        it('should set empty results when no user', async () => {
            req.user = undefined;
            const middleware = attachPermissionCheck('reservations:read');
            await middleware(req, res, next);
            expect(req.permissionResults).toEqual({});
            expect(next).toHaveBeenCalled();
        });
        it('should not block on error - set empty results and continue', async () => {
            mockFindUnique.mockRejectedValue(new Error('DB down'));
            const middleware = attachPermissionCheck('reservations:read');
            await middleware(req, res, next);
            expect(req.permissionResults).toEqual({});
            expect(next).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=permissions.test.js.map