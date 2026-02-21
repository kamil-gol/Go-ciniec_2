/**
 * Permission constants — single source of truth for RBAC
 *
 * Used by:
 *  - prisma/seeds/rbac.seed.ts (seeding DB)
 *  - services/permissions.service.ts (grouping for UI)
 *  - middlewares/permissions.ts (reference only)
 */
export declare const MODULE_LABELS: Record<string, string>;
export declare const ACTION_LABELS: Record<string, string>;
export type PermissionTuple = [string, string, string, string, string];
export declare const PERMISSION_DEFINITIONS: PermissionTuple[];
export interface RoleDefinition {
    name: string;
    slug: string;
    description: string;
    color: string;
    isSystem: boolean;
    permissions: string[] | 'ALL';
}
export declare const ROLE_DEFINITIONS: Record<string, RoleDefinition>;
export declare const DEFAULT_EMPLOYEE_PERMISSIONS: string[];
//# sourceMappingURL=permissions.d.ts.map