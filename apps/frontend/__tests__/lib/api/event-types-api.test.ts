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
import {
  getEventTypes,
  getEventTypeById,
  createEventType,
  updateEventType,
  deleteEventType,
  getEventTypeStats,
  getPredefinedColors,
} from '@/lib/api/event-types-api'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('event-types-api', () => {
  const sampleEventType = {
    id: 'et1',
    name: 'Wedding',
    description: 'Wedding ceremony',
    color: '#ff0000',
    isActive: true,
    standardHours: 8,
    extraHourRate: 500,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  describe('getEventTypes', () => {
    it('calls GET /event-types without query when activeOnly is false', async () => {
      mockGet.mockResolvedValue({ data: { data: [sampleEventType] } })

      const result = await getEventTypes()

      expect(mockGet).toHaveBeenCalledWith('/event-types')
      expect(result).toEqual([sampleEventType])
    })

    it('calls GET /event-types?isActive=true when activeOnly is true', async () => {
      mockGet.mockResolvedValue({ data: { data: [sampleEventType] } })

      const result = await getEventTypes(true)

      expect(mockGet).toHaveBeenCalledWith('/event-types?isActive=true')
      expect(result).toEqual([sampleEventType])
    })
  })

  describe('getEventTypeById', () => {
    it('calls GET /event-types/:id and returns event type with counts', async () => {
      const withCounts = { ...sampleEventType, _count: { reservations: 10, menuTemplates: 3 } }
      mockGet.mockResolvedValue({ data: { data: withCounts } })

      const result = await getEventTypeById('et1')

      expect(mockGet).toHaveBeenCalledWith('/event-types/et1')
      expect(result._count.reservations).toBe(10)
      expect(result._count.menuTemplates).toBe(3)
    })
  })

  describe('createEventType', () => {
    it('calls POST /event-types with payload and returns created type', async () => {
      const payload = { name: 'Birthday', color: '#00ff00', standardHours: 4, extraHourRate: 300 }
      const created = { ...sampleEventType, id: 'et2', ...payload }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await createEventType(payload)

      expect(mockPost).toHaveBeenCalledWith('/event-types', payload)
      expect(result.name).toBe('Birthday')
    })
  })

  describe('updateEventType', () => {
    it('calls PUT /event-types/:id with payload and returns updated type', async () => {
      const payload = { name: 'Wedding Deluxe', color: '#0000ff' }
      const updated = { ...sampleEventType, ...payload }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await updateEventType('et1', payload)

      expect(mockPut).toHaveBeenCalledWith('/event-types/et1', payload)
      expect(result.name).toBe('Wedding Deluxe')
      expect(result.color).toBe('#0000ff')
    })
  })

  describe('deleteEventType', () => {
    it('calls DELETE /event-types/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await deleteEventType('et1')

      expect(mockDelete).toHaveBeenCalledWith('/event-types/et1')
    })
  })

  describe('getEventTypeStats', () => {
    it('calls GET /event-types/stats and returns stats array', async () => {
      const stats = [
        {
          id: 'et1',
          name: 'Wedding',
          color: '#ff0000',
          isActive: true,
          standardHours: 8,
          extraHourRate: 500,
          reservationCount: 25,
          menuTemplateCount: 5,
        },
      ]
      mockGet.mockResolvedValue({ data: { data: stats } })

      const result = await getEventTypeStats()

      expect(mockGet).toHaveBeenCalledWith('/event-types/stats')
      expect(result).toEqual(stats)
      expect(result[0].reservationCount).toBe(25)
    })
  })

  describe('getPredefinedColors', () => {
    it('calls GET /event-types/colors and returns color strings', async () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
      mockGet.mockResolvedValue({ data: { data: colors } })

      const result = await getPredefinedColors()

      expect(mockGet).toHaveBeenCalledWith('/event-types/colors')
      expect(result).toEqual(colors)
      expect(result).toHaveLength(4)
    })
  })
})
