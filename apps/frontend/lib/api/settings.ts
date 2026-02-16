/**
 * Settings API client — Users, Roles, Permissions, Company Settings
 */
import { apiClient } from '@/lib/api-client'

// ─── Types ──────────────────────────────────────────────

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  lastLoginAt: string | null
  role: {
    id: string
    name: string
    slug: string
    color: string
  } | null
  legacyRole?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  module: string
  action: string
  slug: string
  name: string
  description: string
}

export interface PermissionGroup {
  module: string
  moduleLabel: string
  permissions: Permission[]
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  isSystem: boolean
  isActive: boolean
  usersCount: number
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface CompanySettings {
  id: string
  companyName: string
  nip: string | null
  regon: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  defaultCurrency: string
  timezone: string
  invoicePrefix: string | null
  receiptPrefix: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateCompanyInput {
  companyName?: string
  nip?: string
  regon?: string
  address?: string
  city?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: string
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
  color: string
  permissionIds?: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  color?: string
}

// ─── API ────────────────────────────────────────────────

export const settingsApi = {
  // ── Users ──
  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/api/settings/users')
    return data.data
  },

  createUser: async (input: CreateUserInput): Promise<User> => {
    const { data } = await apiClient.post('/api/settings/users', input)
    return data.data
  },

  updateUser: async (id: string, input: UpdateUserInput): Promise<User> => {
    const { data } = await apiClient.put(`/api/settings/users/${id}`, input)
    return data.data
  },

  changePassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.patch(`/api/settings/users/${id}/password`, { newPassword })
  },

  toggleActive: async (id: string): Promise<User> => {
    const { data } = await apiClient.patch(`/api/settings/users/${id}/toggle-active`)
    return data.data
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/settings/users/${id}`)
  },

  // ── Roles ──
  getRoles: async (): Promise<Role[]> => {
    const { data } = await apiClient.get('/api/settings/roles')
    return data.data
  },

  createRole: async (input: CreateRoleInput): Promise<Role> => {
    const { data } = await apiClient.post('/api/settings/roles', input)
    return data.data
  },

  updateRole: async (id: string, input: UpdateRoleInput): Promise<Role> => {
    const { data } = await apiClient.put(`/api/settings/roles/${id}`, input)
    return data.data
  },

  updateRolePermissions: async (id: string, permissionIds: string[]): Promise<Role> => {
    const { data } = await apiClient.put(`/api/settings/roles/${id}/permissions`, { permissionIds })
    return data.data
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/settings/roles/${id}`)
  },

  // ── Permissions ──
  getPermissions: async (): Promise<Permission[]> => {
    const { data } = await apiClient.get('/api/settings/permissions')
    return data.data
  },

  getPermissionsGrouped: async (): Promise<PermissionGroup[]> => {
    const { data } = await apiClient.get('/api/settings/permissions/grouped')
    return data.data
  },

  // ── Company Settings ──
  getCompanySettings: async (): Promise<CompanySettings> => {
    const { data } = await apiClient.get('/api/settings/company')
    return data.data
  },

  updateCompanySettings: async (input: UpdateCompanyInput): Promise<CompanySettings> => {
    const { data } = await apiClient.put('/api/settings/company', input)
    return data.data
  },
}
