import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  // RBAC extensions (populated by permission middleware)
  userPermissions?: Set<string>;
  userRoleName?: string;
  permissionResults?: Record<string, boolean>;
}

// Legacy role type — kept for backward compatibility
export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  // New RBAC fields (added after migration)
  roleId?: string;
  roleSlug?: string;
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
