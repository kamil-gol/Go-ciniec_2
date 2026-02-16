/**
 * 🔐 Settings & RBAC Types
 */

// ─── Role types ─────────────────────────────────────────────
export interface RoleResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  usersCount: number;
  permissions: PermissionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateRolePermissionsInput {
  permissionIds: string[];
}

// ─── Permission types ───────────────────────────────────────
export interface PermissionResponse {
  id: string;
  module: string;
  action: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface PermissionGroupResponse {
  module: string;
  moduleLabel: string;
  permissions: PermissionResponse[];
}

// ─── User management types ──────────────────────────────────
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  role: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  legacyRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface ChangePasswordInput {
  currentPassword?: string;  // not required if admin changes another user's pw
  newPassword: string;
}

// ─── Company settings types ─────────────────────────────────
export interface CompanySettingsResponse {
  id: string;
  companyName: string;
  nip: string | null;
  regon: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  timezone: string;
  invoicePrefix: string | null;
  receiptPrefix: string | null;
  updatedAt: string;
}

export interface UpdateCompanySettingsInput {
  companyName?: string;
  nip?: string;
  regon?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  defaultCurrency?: string;
  timezone?: string;
  invoicePrefix?: string;
  receiptPrefix?: string;
}

// ─── Query filters ──────────────────────────────────────────
export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}
