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
interface CachedPermissions {
    permissions: Set<string>;
    roleName: string;
    roleSlug: string;
    cachedAt: number;
}
/**
 * Load permissions for a user from database.
 * Uses in-memory cache to avoid DB hits on every request.
 */
export declare function loadUserPermissions(userId: string): Promise<CachedPermissions>;
/**
 * Invalidate permission cache for a user.
 * Call this when a user's role or permissions change.
 */
export declare function invalidatePermissionCache(userId: string): void;
/**
 * Invalidate all permission caches.
 * Call this when roles or permissions are modified globally.
 */
export declare function invalidateAllPermissionCaches(): void;
/**
 * Middleware: Require ALL specified permissions.
 * User must have every listed permission to proceed.
 *
 * @example requirePermission('reservations:read')
 * @example requirePermission('reservations:update', 'reservations:manage_discount')
 */
export declare const requirePermission: (...requiredPermissions: string[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware: Require ANY of the specified permissions.
 * User must have at least one of the listed permissions.
 *
 * @example requireAnyPermission('menu:manage_templates', 'menu:manage_packages')
 */
export declare const requireAnyPermission: (...requiredPermissions: string[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware: Check if user has a specific permission (non-blocking).
 * Attaches result to request but doesn't reject.
 * Useful for conditional UI rendering on server-side.
 *
 * @example attachPermissionCheck('reservations:delete')
 */
export declare const attachPermissionCheck: (...permissionsToCheck: string[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=permissions.d.ts.map