/**
 * 🔐 Granular Permission Middleware
 * 
 * Replaces the old requireRole() with fine-grained permission checks.
 * Permissions are loaded from User → Role → RolePermission → Permission.
 * 
 * Usage in routes:
 *   router.get('/', authMiddleware, requirePermission('reservations:read'), controller.list);
 *   router.delete('/:id', authMiddleware, requirePermission('reservations:delete'), controller.delete);
 *   router.post('/', authMiddleware, requireAnyPermission('menu:manage_templates', 'menu:manage_packages'), controller.create);
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory permission cache (per-user, TTL-based)
interface CachedPermissions {
  permissions: Set<string>;
  roleName: string;
  roleSlug: string;
  cachedAt: number;
}

const permissionCache = new Map<string, CachedPermissions>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load permissions for a user from database.
 * Uses in-memory cache to avoid DB hits on every request.
 */
export async function loadUserPermissions(userId: string): Promise<CachedPermissions> {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  // Load from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedRole: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.assignedRole) {
    // Fallback: if user has no role assigned yet (migration period),
    // check legacy role field and provide basic permissions
    const legacyPerms = getLegacyPermissions((user as any)?.legacyRole);
    const result: CachedPermissions = {
      permissions: new Set(legacyPerms),
      roleName: (user as any)?.legacyRole || 'UNKNOWN',
      roleSlug: ((user as any)?.legacyRole || 'unknown').toLowerCase(),
      cachedAt: Date.now(),
    };
    permissionCache.set(userId, result);
    return result;
  }

  const permissions = new Set(
    user.assignedRole.permissions.map((rp) => rp.permission.slug)
  );

  const result: CachedPermissions = {
    permissions,
    roleName: user.assignedRole.name,
    roleSlug: user.assignedRole.slug,
    cachedAt: Date.now(),
  };

  permissionCache.set(userId, result);
  return result;
}

/**
 * Fallback for users not yet migrated to RBAC.
 * Maps legacy role strings to basic permission sets.
 */
function getLegacyPermissions(legacyRole?: string): string[] {
  switch (legacyRole) {
    case 'ADMIN':
      return ['*']; // admin gets everything
    case 'EMPLOYEE':
      return [
        'dashboard:read',
        'reservations:read', 'reservations:create', 'reservations:update', 'reservations:export_pdf',
        'clients:read', 'clients:create', 'clients:update',
        'halls:read', 'menu:read', 'queue:read',
        'deposits:read', 'deposits:create', 'deposits:mark_paid',
        'event_types:read', 'attachments:read', 'attachments:upload',
      ];
    default:
      return ['dashboard:read'];
  }
}

/**
 * Invalidate permission cache for a user.
 * Call this when a user's role or permissions change.
 */
export function invalidatePermissionCache(userId: string): void {
  permissionCache.delete(userId);
  logger.debug(`Permission cache invalidated for user ${userId}`);
}

/**
 * Invalidate all permission caches.
 * Call this when roles or permissions are modified globally.
 */
export function invalidateAllPermissionCaches(): void {
  permissionCache.clear();
  logger.debug('All permission caches invalidated');
}

/**
 * Middleware: Require ALL specified permissions.
 * User must have every listed permission to proceed.
 * 
 * @example requirePermission('reservations:read')
 * @example requirePermission('reservations:update', 'reservations:manage_discount')
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Wymagane uwierzytelnienie'));
      }

      const { permissions, roleName } = await loadUserPermissions(req.user.id);

      // Wildcard: admins with '*' permission bypass all checks
      if (permissions.has('*')) {
        return next();
      }

      const missing = requiredPermissions.filter((p) => !permissions.has(p));

      if (missing.length > 0) {
        logger.warn(
          `Brak uprawnień: ${req.user.email} (${roleName}) ` +
          `próbował wykonać akcję wymagającą: ${missing.join(', ')}`
        );
        return next(
          new AppError(403, `Brak wymaganych uprawnień: ${missing.join(', ')}`)
        );
      }

      // Attach permissions to request for downstream use
      (req as any).userPermissions = permissions;
      (req as any).userRoleName = roleName;

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      next(new AppError(500, 'Błąd weryfikacji uprawnień'));
    }
  };
};

/**
 * Middleware: Require ANY of the specified permissions.
 * User must have at least one of the listed permissions.
 * 
 * @example requireAnyPermission('menu:manage_templates', 'menu:manage_packages')
 */
export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Wymagane uwierzytelnienie'));
      }

      const { permissions, roleName } = await loadUserPermissions(req.user.id);

      // Wildcard bypass
      if (permissions.has('*')) {
        return next();
      }

      const hasAny = requiredPermissions.some((p) => permissions.has(p));

      if (!hasAny) {
        logger.warn(
          `Brak uprawnień: ${req.user.email} (${roleName}) ` +
          `potrzebuje jednego z: ${requiredPermissions.join(', ')}`
        );
        return next(
          new AppError(403, 'Brak wymaganych uprawnień')
        );
      }

      (req as any).userPermissions = permissions;
      (req as any).userRoleName = roleName;

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      next(new AppError(500, 'Błąd weryfikacji uprawnień'));
    }
  };
};

/**
 * Middleware: Check if user has a specific permission (non-blocking).
 * Attaches result to request but doesn't reject.
 * Useful for conditional UI rendering on server-side.
 * 
 * @example attachPermissionCheck('reservations:delete')
 */
export const attachPermissionCheck = (...permissionsToCheck: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        (req as any).permissionResults = {};
        return next();
      }

      const { permissions } = await loadUserPermissions(req.user.id);
      const results: Record<string, boolean> = {};

      for (const perm of permissionsToCheck) {
        results[perm] = permissions.has('*') || permissions.has(perm);
      }

      (req as any).permissionResults = results;
      (req as any).userPermissions = permissions;

      next();
    } catch (error) {
      (req as any).permissionResults = {};
      next();
    }
  };
};
