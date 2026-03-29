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
import { menuApi } from '@/lib/api/menu-api'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

describe('menuApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Templates ───────────────────────────────────────────────────

  describe('getTemplates', () => {
    it('calls GET /menu-templates without query when no filters', async () => {
      const response = { success: true, data: [{ id: 't1' }] }
      mockGet.mockResolvedValue({ data: response })

      const result = await menuApi.getTemplates()

      expect(mockGet).toHaveBeenCalledWith('/menu-templates')
      expect(result).toEqual(response)
    })

    it('appends query string from filters', async () => {
      const response = { success: true, data: [] }
      mockGet.mockResolvedValue({ data: response })

      await menuApi.getTemplates({ isActive: true, eventTypeId: 'et1' } as any)

      const calledUrl = mockGet.mock.calls[0][0] as string
      expect(calledUrl).toContain('/menu-templates?')
      expect(calledUrl).toContain('isActive=true')
      expect(calledUrl).toContain('eventTypeId=et1')
    })

    it('skips undefined/null/empty filter values', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [] } })

      await menuApi.getTemplates({ isActive: undefined, eventTypeId: '' } as any)

      expect(mockGet).toHaveBeenCalledWith('/menu-templates')
    })
  })

  describe('getTemplate', () => {
    it('calls GET /menu-templates/:id', async () => {
      const template = { id: 't1', name: 'Weselny' }
      mockGet.mockResolvedValue({ data: { success: true, data: template } })

      const result = await menuApi.getTemplate('t1')

      expect(mockGet).toHaveBeenCalledWith('/menu-templates/t1')
      expect(result.data).toEqual(template)
    })
  })

  describe('getActiveTemplate', () => {
    it('calls GET /menu-templates/active/:eventTypeId', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: { id: 't1' } } })

      await menuApi.getActiveTemplate('et1')

      expect(mockGet).toHaveBeenCalledWith('/menu-templates/active/et1')
    })
  })

  describe('createTemplate', () => {
    it('calls POST /menu-templates with input', async () => {
      const input = { name: 'New Template', eventTypeId: 'et1' }
      const created = { id: 't-new', ...input }
      mockPost.mockResolvedValue({ data: { success: true, data: created } })

      const result = await menuApi.createTemplate(input)

      expect(mockPost).toHaveBeenCalledWith('/menu-templates', input)
      expect(result.data).toEqual(created)
    })
  })

  describe('updateTemplate', () => {
    it('calls PUT /menu-templates/:id with input', async () => {
      const input = { name: 'Updated' }
      mockPut.mockResolvedValue({ data: { success: true, data: { id: 't1', name: 'Updated' } } })

      const result = await menuApi.updateTemplate('t1', input)

      expect(mockPut).toHaveBeenCalledWith('/menu-templates/t1', input)
      expect(result.data.name).toBe('Updated')
    })
  })

  describe('deleteTemplate', () => {
    it('calls DELETE /menu-templates/:id', async () => {
      mockDelete.mockResolvedValue({ data: { success: true, data: { message: 'Deleted' } } })

      const result = await menuApi.deleteTemplate('t1')

      expect(mockDelete).toHaveBeenCalledWith('/menu-templates/t1')
      expect(result.data.message).toBe('Deleted')
    })
  })

  // ── Packages ────────────────────────────────────────────────────

  describe('getPackages', () => {
    it('calls GET /menu-packages/template/:templateId', async () => {
      const packages = [{ id: 'p1', name: 'Gold' }]
      mockGet.mockResolvedValue({ data: { success: true, data: packages } })

      const result = await menuApi.getPackages('t1')

      expect(mockGet).toHaveBeenCalledWith('/menu-packages/template/t1')
      expect(result.data).toEqual(packages)
    })
  })

  describe('getPackage', () => {
    it('calls GET /menu-packages/:id', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: { id: 'p1' } } })

      await menuApi.getPackage('p1')

      expect(mockGet).toHaveBeenCalledWith('/menu-packages/p1')
    })
  })

  describe('getPackageCategories', () => {
    it('calls GET /menu-packages/:packageId/categories', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [] } })

      await menuApi.getPackageCategories('p1')

      expect(mockGet).toHaveBeenCalledWith('/menu-packages/p1/categories')
    })
  })

  describe('createPackage', () => {
    it('calls POST /menu-packages', async () => {
      const input = { name: 'Silver', templateId: 't1' }
      mockPost.mockResolvedValue({ data: { success: true, data: { id: 'p-new' } } })

      await menuApi.createPackage(input)

      expect(mockPost).toHaveBeenCalledWith('/menu-packages', input)
    })
  })

  describe('updatePackage', () => {
    it('calls PUT /menu-packages/:id', async () => {
      const input = { name: 'Platinum' }
      mockPut.mockResolvedValue({ data: { success: true, data: { id: 'p1' } } })

      await menuApi.updatePackage('p1', input)

      expect(mockPut).toHaveBeenCalledWith('/menu-packages/p1', input)
    })
  })

  describe('deletePackage', () => {
    it('calls DELETE /menu-packages/:id', async () => {
      mockDelete.mockResolvedValue({ data: { success: true, data: { message: 'Deleted' } } })

      await menuApi.deletePackage('p1')

      expect(mockDelete).toHaveBeenCalledWith('/menu-packages/p1')
    })
  })

  // ── Options ─────────────────────────────────────────────────────

  describe('getOptions', () => {
    it('calls GET /menu-options without query when no filters', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [] } })

      await menuApi.getOptions()

      expect(mockGet).toHaveBeenCalledWith('/menu-options')
    })

    it('appends query string from filters', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [] } })

      await menuApi.getOptions({ categoryId: 'cat1' } as any)

      const calledUrl = mockGet.mock.calls[0][0] as string
      expect(calledUrl).toContain('categoryId=cat1')
    })
  })

  describe('getOption', () => {
    it('calls GET /menu-options/:id', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: { id: 'o1' } } })

      await menuApi.getOption('o1')

      expect(mockGet).toHaveBeenCalledWith('/menu-options/o1')
    })
  })

  describe('createOption', () => {
    it('calls POST /menu-options', async () => {
      const input = { name: 'Filet', price: 45 }
      mockPost.mockResolvedValue({ data: { success: true, data: { id: 'o-new' } } })

      await menuApi.createOption(input)

      expect(mockPost).toHaveBeenCalledWith('/menu-options', input)
    })
  })

  describe('updateOption', () => {
    it('calls PUT /menu-options/:id', async () => {
      const input = { price: 50 }
      mockPut.mockResolvedValue({ data: { success: true, data: { id: 'o1' } } })

      await menuApi.updateOption('o1', input)

      expect(mockPut).toHaveBeenCalledWith('/menu-options/o1', input)
    })
  })

  describe('deleteOption', () => {
    it('calls DELETE /menu-options/:id', async () => {
      mockDelete.mockResolvedValue({ data: { success: true, data: { message: 'Deleted' } } })

      await menuApi.deleteOption('o1')

      expect(mockDelete).toHaveBeenCalledWith('/menu-options/o1')
    })
  })

  // ── Reservation Menu ────────────────────────────────────────────

  describe('getReservationMenu', () => {
    it('calls GET /reservations/:id/menu with _silent flag', async () => {
      const menuResponse = { success: true, data: { packageId: 'p1', selections: [] } }
      mockGet.mockResolvedValue({ data: menuResponse })

      const result = await menuApi.getReservationMenu('r1')

      expect(mockGet).toHaveBeenCalledWith('/reservations/r1/menu', { _silent: true })
      expect(result).toEqual(menuResponse)
    })
  })

  describe('selectMenu', () => {
    it('calls POST /reservations/:id/menu with selection', async () => {
      const selection = { packageId: 'p1', options: ['o1', 'o2'] } as any
      mockPost.mockResolvedValue({ data: { success: true, data: {} } })

      await menuApi.selectMenu('r1', selection)

      expect(mockPost).toHaveBeenCalledWith('/reservations/r1/menu', selection)
    })
  })

  describe('updateMenu', () => {
    it('calls PUT /reservations/:id/menu with selection', async () => {
      const selection = { packageId: 'p2' } as any
      mockPut.mockResolvedValue({ data: { success: true, data: {} } })

      await menuApi.updateMenu('r1', selection)

      expect(mockPut).toHaveBeenCalledWith('/reservations/r1/menu', selection)
    })
  })

  describe('updateGuestCounts', () => {
    it('calls PUT /reservations/:id/menu with counts', async () => {
      const counts = { adultsCount: 80, childrenCount: 10, toddlersCount: 5 }
      mockPut.mockResolvedValue({ data: { success: true, data: {} } })

      await menuApi.updateGuestCounts('r1', counts)

      expect(mockPut).toHaveBeenCalledWith('/reservations/r1/menu', counts)
    })
  })

  describe('removeMenu', () => {
    it('calls DELETE /reservations/:id/menu', async () => {
      mockDelete.mockResolvedValue({ data: { success: true, data: { message: 'Removed' } } })

      await menuApi.removeMenu('r1')

      expect(mockDelete).toHaveBeenCalledWith('/reservations/r1/menu')
    })
  })

  // ── error handling ──────────────────────────────────────────────

  describe('error handling', () => {
    it('propagates errors from apiClient', async () => {
      mockGet.mockRejectedValue(new Error('500 Internal'))

      await expect(menuApi.getTemplates()).rejects.toThrow('500 Internal')
    })
  })
})
