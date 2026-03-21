/**
 * Unit tests for middlewares/permissions.ts
 * Covers: loadUserPermissions, cache, requirePermission, requireAnyPermission, attachPermissionCheck
 * Issue: #96
 */

// ── Mocks ────────────────────────────────────────────────
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/prisma-client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

jest.mock('@utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('@middlewares/errorHandler', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'AppError';
    }
  },
}));

import {
  loadUserPermissions,
  invalidatePermissionCache,
  invalidateAllPermissionCaches,
  requirePermission,
  requireAnyPermission,
  attachPermissionCheck,
} from '@middlewares/permissions';

// ── Helpers ──────────────────────────────────────────────
const mockRequest = (overrides: any = {}) => ({
  headers: {},
  query: {},
  user: undefined,
  ...overrides,
});

const mockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const mockNext = jest.fn();

const adminUser = {
  id: 'admin-1',
  legacyRole: 'ADMIN',
  assignedRole: {
    name: 'Administrator',
    slug: 'admin',
    permissions: [
      { permission: { slug: '*' } },
      { permission: { slug: 'reservations:read' } },
      { permission: { slug: 'reservations:create' } },
      { permission: { slug: 'reservations:update' } },
      { permission: { slug: 'settings:manage' } },
    ],
  },
};

const employeeUser = {
  id: 'emp-1',
  legacyRole: 'EMPLOYEE',
  assignedRole: {
    name: 'Pracownik',
    slug: 'employee',
    permissions: [
      { permission: { slug: 'reservations:read' } },
      { permission: { slug: 'reservations:create' } },
    ],
  },
};

const legacyAdminUser = {
  id: 'legacy-admin',
  legacyRole: 'ADMIN',
  assignedRole: null, // not migrated to RBAC yet
};

const noRoleUser = {
  id: 'norole-1',
  legacyRole: null,
  assignedRole: null,
};

describe('Permissions Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateAllPermissionCaches();
  });

  // ══════════════════════════════════════════════════════
  // loadUserPermissions
  // ══════════════════════════════════════════════════════
  describe('loadUserPermissions', () => {
    it('should load permissions from database for user with assigned role', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(adminUser);

      const result = await loadUserPermissions('admin-1');

      expect(result.permissions).toBeInstanceOf(Set);
      expect(result.permissions.has('reservations:read')).toBe(true);
      expect(result.permissions.has('settings:manage')).toBe(true);
      expect(result.roleName).toBe('Administrator');
      expect(result.roleSlug).toBe('admin');
    });

    it('should return cached permissions on second call (no DB hit)', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(adminUser);

      await loadUserPermissions('admin-1');
      await loadUserPermissions('admin-1');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache and reload from DB', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(adminUser);

      await loadUserPermissions('admin-1');
      invalidatePermissionCache('admin-1');
      await loadUserPermissions('admin-1');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should fall back to legacy ADMIN permissions (wildcard *)', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(legacyAdminUser);

      const result = await loadUserPermissions('legacy-admin');

      expect(result.permissions.has('*')).toBe(true);
      expect(result.roleName).toBe('ADMIN');
    });

    it('should fall back to legacy EMPLOYEE permissions', async () => {
      const legacyEmp = { ...noRoleUser, legacyRole: 'EMPLOYEE' };
      mockPrismaClient.user.findUnique.mockResolvedValue(legacyEmp);

      const result = await loadUserPermissions('legacy-emp');

      expect(result.permissions.has('reservations:read')).toBe(true);
      expect(result.permissions.has('settings:manage')).toBe(false);
    });

    it('should return minimal permissions for unknown legacy role', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(noRoleUser);

      const result = await loadUserPermissions('norole-1');

      expect(result.permissions.has('dashboard:read')).toBe(true);
      expect(result.permissions.size).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════
  // requirePermission
  // ══════════════════════════════════════════════════════
  describe('requirePermission', () => {
    it('should call next() when user has required permission', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(adminUser);
      const req = mockRequest({ user: { id: 'admin-1', email: 'admin@test.pl' } });
      const middleware = requirePermission('reservations:read');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AppError(403) when user lacks permission', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(employeeUser);
      const req = mockRequest({ user: { id: 'emp-1', email: 'emp@test.pl' } });
      const middleware = requirePermission('settings:manage');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('should bypass all checks for wildcard * permission (legacy admin)', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(legacyAdminUser);
      const req = mockRequest({ user: { id: 'legacy-admin', email: 'admin@test.pl' } });
      const middleware = requirePermission('anything:here');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should bypass all checks for RBAC admin with wildcard * in assigned role', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(adminUser);
      const req = mockRequest({ user: { id: 'admin-1', email: 'admin@test.pl' } });
      const middleware = requirePermission('catering:manage_orders');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AppError(401) when user is not authenticated', async () => {
      const req = mockRequest({ user: undefined });
      const middleware = requirePermission('reservations:read');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  // ══════════════════════════════════════════════════════
  // requireAnyPermission
  // ══════════════════════════════════════════════════════
  describe('requireAnyPermission', () => {
    it('should call next() when user has at least one of the permissions', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(employeeUser);
      const req = mockRequest({ user: { id: 'emp-1', email: 'emp@test.pl' } });
      const middleware = requireAnyPermission('settings:manage', 'reservations:read');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AppError(403) when user has none of the permissions', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(employeeUser);
      const req = mockRequest({ user: { id: 'emp-1', email: 'emp@test.pl' } });
      const middleware = requireAnyPermission('settings:manage', 'roles:manage');

      await middleware(req as any, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });

  // ══════════════════════════════════════════════════════
  // attachPermissionCheck (non-blocking)
  // ══════════════════════════════════════════════════════
  describe('attachPermissionCheck', () => {
    it('should attach permission results to request without blocking', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(employeeUser);
      const req = mockRequest({ user: { id: 'emp-1', email: 'emp@test.pl' } }) as any;
      const middleware = attachPermissionCheck('reservations:read', 'settings:manage');

      await middleware(req, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.permissionResults['reservations:read']).toBe(true);
      expect(req.permissionResults['settings:manage']).toBe(false);
    });

    it('should return empty results when user is not authenticated', async () => {
      const req = mockRequest({ user: undefined }) as any;
      const middleware = attachPermissionCheck('reservations:read');

      await middleware(req, mockResponse() as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.permissionResults).toEqual({});
    });
  });
});
