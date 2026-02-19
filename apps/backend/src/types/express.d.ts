/**
 * Express namespace augmentation
 *
 * Adds `user` property to Express.Request so that
 * controllers using plain `Request` type (not AuthenticatedRequest)
 * can access req.user after authMiddleware sets it.
 *
 * Without this, req.user?.id evaluates to undefined at the type level
 * on plain Request, and with strict TypeScript the optional chaining
 * may behave unexpectedly in some transpilation modes.
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        /** New RBAC: Role UUID from the roles table */
        roleId?: string;
        /** New RBAC: Role slug, e.g. 'admin', 'employee', 'manager' */
        roleSlug?: string;
      };
      /** RBAC: Permission slugs populated by permission middleware */
      userPermissions?: Set<string>;
      /** RBAC: Role name populated by permission middleware */
      userRoleName?: string;
      /** RBAC: Permission check results */
      permissionResults?: Record<string, boolean>;
    }
  }
}

export {};
