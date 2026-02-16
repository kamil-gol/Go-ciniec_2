import { apiClient } from '../api-client'

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: Permission[]
  _count?: { users: number }
}

export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  module: string
  createdAt: string
}

export interface PermissionGroup {
  module: string
  label: string
  permissions: Permission[]
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  legacyRole: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  role: Role | null
  roleId: string | null
}

export interface CompanySettings {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  nip: string | null
  regon: string | null
  bankAccount: string | null
  bankName: string | null
  logoUrl: string | null
  website: string | null
  description: string | null
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: string
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  firstName?: string
  lastName?: string
  roleId?: string
  isActive?: boolean
}

export interface CreateRoleInput {
  name: string
  slug: string
  description?: string
  color?: string
  permissionIds: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  color?: string
}

export interface UpdateCompanyInput {
  name?: string
  address?: string
  phone?: string
  email?: string
  nip?: string
  regon?: string
  bankAccount?: string
  bankName?: string
  website?: string
  description?: string
}

// ═══════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════

export const settingsApi = {
  // ── Users ────────────────────────────────────────────
  async getUsers(): Promise<User[]> {
    const { data } = await apiClient.get('/settings/users')
    return data.data || data
  },

  async getUserById(id: string): Promise<User> {
    const { data } = await apiClient.get(`/settings/users/${id}`)
    return data.data || data
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const { data } = await apiClient.post('/settings/users', input)
    return data.data || data
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const { data } = await apiClient.put(`/settings/users/${id}`, input)
    return data.data || data
  },

  async changePassword(id: string, password: string): Promise<void> {
    await apiClient.patch(`/settings/users/${id}/password`, { password })
  },

  async toggleActive(id: string): Promise<User> {
    const { data } = await apiClient.patch(`/settings/users/${id}/toggle-active`)
    return data.data || data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/settings/users/${id}`)
  },

  // ── Roles ────────────────────────────────────────────
  async getRoles(): Promise<Role[]> {
    const { data } = await apiClient.get('/settings/roles')
    return data.data || data
  },

  async getRoleById(id: string): Promise<Role> {
    const { data } = await apiClient.get(`/settings/roles/${id}`)
    return data.data || data
  },

  async createRole(input: CreateRoleInput): Promise<Role> {
    const { data } = await apiClient.post('/settings/roles', input)
    return data.data || data
  },

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    const { data } = await apiClient.put(`/settings/roles/${id}`, input)
    return data.data || data
  },

  async updateRolePermissions(id: string, permissionIds: string[]): Promise<Role> {
    const { data } = await apiClient.put(`/settings/roles/${id}/permissions`, { permissionIds })
    return data.data || data
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/settings/roles/${id}`)
  },

  // ── Permissions ──────────────────────────────────────
  async getPermissions(): Promise<Permission[]> {
    const { data } = await apiClient.get('/settings/permissions')
    return data.data || data
  },

  async getPermissionsGrouped(): Promise<PermissionGroup[]> {
    const { data } = await apiClient.get('/settings/permissions/grouped')
    return data.data || data
  },

  // ── Company ─────────────────────────────────────────
  async getCompanySettings(): Promise<CompanySettings> {
    const { data } = await apiClient.get('/settings/company')
    return data.data || data
  },

  async updateCompanySettings(input: UpdateCompanyInput): Promise<CompanySettings> {
    const { data } = await apiClient.put('/settings/company', input)
    return data.data || data
  },
}
