import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        /** New RBAC: Role UUID from the roles table */
        roleId?: string;
        /** New RBAC: Role slug, e.g. 'admin', 'employee', 'manager' */
        roleSlug?: string;
    };
    userPermissions?: Set<string>;
    userRoleName?: string;
    permissionResults?: Record<string, boolean>;
}
export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
export interface JwtPayload {
    id: string;
    email: string;
    role: UserRole;
    roleId?: string;
    roleSlug?: string;
    iat?: number;
    exp?: number;
}
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=index.d.ts.map