import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'
import { settingsApi } from '@/lib/api/settings'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockPatch = vi.mocked(apiClient.patch)
const mockDelete = vi.mocked(apiClient.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('settingsApi', () => {
  // ── Users ──

  describe('getUsers', () => {
    it('calls GET /settings/users and returns user array', async () => {
      const users = [
        { id: 'u1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', isActive: true },
      ]
      mockGet.mockResolvedValue({ data: { data: users } })

      const result = await settingsApi.getUsers()

      expect(mockGet).toHaveBeenCalledWith('/settings/users')
      expect(result).toEqual(users)
    })
  })

  describe('createUser', () => {
    it('calls POST /settings/users with input and returns created user', async () => {
      const input = { email: 'new@test.com', password: 'secret123', firstName: 'New', lastName: 'User', roleId: 'r1' }
      const created = { id: 'u2', ...input }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await settingsApi.createUser(input)

      expect(mockPost).toHaveBeenCalledWith('/settings/users', input)
      expect(result.email).toBe('new@test.com')
    })
  })

  describe('updateUser', () => {
    it('calls PUT /settings/users/:id with input and returns updated user', async () => {
      const input = { firstName: 'Updated', isActive: false }
      const updated = { id: 'u1', email: 'admin@test.com', ...input }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await settingsApi.updateUser('u1', input)

      expect(mockPut).toHaveBeenCalledWith('/settings/users/u1', input)
      expect(result.firstName).toBe('Updated')
    })
  })

  describe('changePassword', () => {
    it('calls PATCH /settings/users/:id/password with new password', async () => {
      mockPatch.mockResolvedValue({ data: {} })

      await settingsApi.changePassword('u1', 'newPass123')

      expect(mockPatch).toHaveBeenCalledWith('/settings/users/u1/password', { newPassword: 'newPass123' })
    })
  })

  describe('toggleActive', () => {
    it('calls PATCH /settings/users/:id/toggle-active and returns updated user', async () => {
      const toggled = { id: 'u1', isActive: false }
      mockPatch.mockResolvedValue({ data: { data: toggled } })

      const result = await settingsApi.toggleActive('u1')

      expect(mockPatch).toHaveBeenCalledWith('/settings/users/u1/toggle-active')
      expect(result.isActive).toBe(false)
    })
  })

  describe('deleteUser', () => {
    it('calls DELETE /settings/users/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await settingsApi.deleteUser('u1')

      expect(mockDelete).toHaveBeenCalledWith('/settings/users/u1')
    })
  })

  // ── Roles ──

  describe('getRoles', () => {
    it('calls GET /settings/roles and returns roles array', async () => {
      const roles = [
        { id: 'r1', name: 'Admin', slug: 'admin', color: '#ff0000', isSystem: true, usersCount: 2, permissions: [] },
      ]
      mockGet.mockResolvedValue({ data: { data: roles } })

      const result = await settingsApi.getRoles()

      expect(mockGet).toHaveBeenCalledWith('/settings/roles')
      expect(result).toEqual(roles)
    })
  })

  describe('createRole', () => {
    it('calls POST /settings/roles with input and returns created role', async () => {
      const input = { name: 'Manager', slug: 'manager', color: '#00ff00', permissionIds: ['p1', 'p2'] }
      const created = { id: 'r2', ...input, isSystem: false, usersCount: 0, permissions: [] }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await settingsApi.createRole(input)

      expect(mockPost).toHaveBeenCalledWith('/settings/roles', input)
      expect(result.name).toBe('Manager')
    })
  })

  describe('updateRole', () => {
    it('calls PUT /settings/roles/:id with input and returns updated role', async () => {
      const input = { name: 'Super Manager', color: '#0000ff' }
      const updated = { id: 'r2', ...input }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await settingsApi.updateRole('r2', input)

      expect(mockPut).toHaveBeenCalledWith('/settings/roles/r2', input)
      expect(result.name).toBe('Super Manager')
    })
  })

  describe('updateRolePermissions', () => {
    it('calls PUT /settings/roles/:id/permissions with permissionIds', async () => {
      const permissionIds = ['p1', 'p3', 'p5']
      const updated = { id: 'r2', permissions: permissionIds.map((id) => ({ id })) }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await settingsApi.updateRolePermissions('r2', permissionIds)

      expect(mockPut).toHaveBeenCalledWith('/settings/roles/r2/permissions', { permissionIds })
      expect(result).toEqual(updated)
    })
  })

  describe('deleteRole', () => {
    it('calls DELETE /settings/roles/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await settingsApi.deleteRole('r2')

      expect(mockDelete).toHaveBeenCalledWith('/settings/roles/r2')
    })
  })

  // ── Permissions ──

  describe('getPermissions', () => {
    it('calls GET /settings/permissions and returns flat permissions array', async () => {
      const permissions = [
        { id: 'p1', module: 'reservations', action: 'read', slug: 'reservations.read', name: 'Read Reservations', description: '' },
      ]
      mockGet.mockResolvedValue({ data: { data: permissions } })

      const result = await settingsApi.getPermissions()

      expect(mockGet).toHaveBeenCalledWith('/settings/permissions')
      expect(result).toEqual(permissions)
    })
  })

  describe('getPermissionsGrouped', () => {
    it('calls GET /settings/permissions/grouped and returns grouped permissions', async () => {
      const grouped = [
        {
          module: 'reservations',
          moduleLabel: 'Reservations',
          permissions: [
            { id: 'p1', module: 'reservations', action: 'read', slug: 'reservations.read', name: 'Read', description: '' },
            { id: 'p2', module: 'reservations', action: 'write', slug: 'reservations.write', name: 'Write', description: '' },
          ],
        },
      ]
      mockGet.mockResolvedValue({ data: { data: grouped } })

      const result = await settingsApi.getPermissionsGrouped()

      expect(mockGet).toHaveBeenCalledWith('/settings/permissions/grouped')
      expect(result).toHaveLength(1)
      expect(result[0].permissions).toHaveLength(2)
    })
  })

  // ── Company Settings ──

  describe('getCompanySettings', () => {
    it('calls GET /settings/company and returns company settings', async () => {
      const settings = {
        id: 'cs1',
        companyName: 'Test Venue',
        nip: '1234567890',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
      }
      mockGet.mockResolvedValue({ data: { data: settings } })

      const result = await settingsApi.getCompanySettings()

      expect(mockGet).toHaveBeenCalledWith('/settings/company')
      expect(result.companyName).toBe('Test Venue')
      expect(result.defaultCurrency).toBe('PLN')
    })
  })

  describe('updateCompanySettings', () => {
    it('calls PUT /settings/company with input and returns updated settings', async () => {
      const input = { companyName: 'New Venue Name', phone: '+48123456789' }
      const updated = { id: 'cs1', ...input, defaultCurrency: 'PLN', timezone: 'Europe/Warsaw' }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await settingsApi.updateCompanySettings(input)

      expect(mockPut).toHaveBeenCalledWith('/settings/company', input)
      expect(result.companyName).toBe('New Venue Name')
    })
  })
})
