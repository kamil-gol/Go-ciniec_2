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
import { hallsApi } from '@/lib/api/halls'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

describe('hallsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getAll ──────────────────────────────────────────────────────

  describe('getAll', () => {
    it('transforms backend response to {halls, total}', async () => {
      const halls = [{ id: 'h1', name: 'Sala A' }, { id: 'h2', name: 'Sala B' }]
      mockGet.mockResolvedValue({
        data: { success: true, data: halls, count: 2 },
      })

      const result = await hallsApi.getAll()

      expect(result).toEqual({ halls, total: 2 })
    })

    it('passes params as query parameters', async () => {
      mockGet.mockResolvedValue({
        data: { data: [], count: 0 },
      })

      await hallsApi.getAll({ isActive: true, search: 'Sala' })

      expect(mockGet).toHaveBeenCalledWith('/halls', {
        params: { isActive: true, search: 'Sala' },
      })
    })

    it('defaults to empty array and 0 when data is missing', async () => {
      mockGet.mockResolvedValue({ data: {} })

      const result = await hallsApi.getAll()

      expect(result).toEqual({ halls: [], total: 0 })
    })
  })

  // ── getById ─────────────────────────────────────────────────────

  describe('getById', () => {
    it('calls GET /halls/:id and unwraps data.data', async () => {
      const hall = { id: 'h1', name: 'Sala A', capacity: 100 }
      mockGet.mockResolvedValue({ data: { data: hall } })

      const result = await hallsApi.getById('h1')

      expect(mockGet).toHaveBeenCalledWith('/halls/h1')
      expect(result).toEqual(hall)
    })
  })

  // ── getAvailableCapacity ────────────────────────────────────────

  describe('getAvailableCapacity', () => {
    it('calls GET /halls/:id/available-capacity with date params', async () => {
      const capacity = {
        hallId: 'h1',
        hallName: 'Sala A',
        totalCapacity: 100,
        occupiedCapacity: 30,
        availableCapacity: 70,
        allowMultipleBookings: true,
        overlappingReservations: 1,
      }
      mockGet.mockResolvedValue({ data: { data: capacity } })

      const result = await hallsApi.getAvailableCapacity(
        'h1',
        '2026-04-01T10:00:00',
        '2026-04-01T22:00:00',
        'exclude-id'
      )

      expect(mockGet).toHaveBeenCalledWith('/halls/h1/available-capacity', {
        params: {
          startDateTime: '2026-04-01T10:00:00',
          endDateTime: '2026-04-01T22:00:00',
          excludeReservationId: 'exclude-id',
        },
      })
      expect(result).toEqual(capacity)
    })

    it('works without excludeReservationId', async () => {
      mockGet.mockResolvedValue({ data: { data: { hallId: 'h1' } } })

      await hallsApi.getAvailableCapacity('h1', 'start', 'end')

      expect(mockGet).toHaveBeenCalledWith('/halls/h1/available-capacity', {
        params: {
          startDateTime: 'start',
          endDateTime: 'end',
          excludeReservationId: undefined,
        },
      })
    })
  })

  // ── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('calls POST /halls with input', async () => {
      const input = { name: 'Sala C', capacity: 50 }
      const created = { id: 'h-new', ...input }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await hallsApi.create(input)

      expect(mockPost).toHaveBeenCalledWith('/halls', input)
      expect(result).toEqual(created)
    })
  })

  // ── update ──────────────────────────────────────────────────────

  describe('update', () => {
    it('calls PUT /halls/:id with input', async () => {
      const input = { capacity: 120 }
      const updated = { id: 'h1', name: 'Sala A', capacity: 120 }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await hallsApi.update('h1', input)

      expect(mockPut).toHaveBeenCalledWith('/halls/h1', input)
      expect(result).toEqual(updated)
    })
  })

  // ── delete ──────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls DELETE /halls/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await hallsApi.delete('h1')

      expect(mockDelete).toHaveBeenCalledWith('/halls/h1')
    })
  })

  // ── getAvailability ─────────────────────────────────────────────

  describe('getAvailability', () => {
    it('queries reservations for the correct month range', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      await hallsApi.getAvailability('h1', 2026, 4)

      expect(mockGet).toHaveBeenCalledWith('/reservations', {
        params: {
          hallId: 'h1',
          dateFrom: '2026-04-01',
          dateTo: '2026-04-31',
        },
      })
    })

    it('generates correct number of days for the month', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      const result = await hallsApi.getAvailability('h1', 2026, 3)

      // March has 31 days
      expect(result).toHaveLength(31)
      expect(result[0].date).toBe('2026-03-01')
      expect(result[30].date).toBe('2026-03-31')
    })

    it('marks days with reservations as unavailable', async () => {
      const reservations = [
        {
          id: 'r1',
          startDateTime: '2026-04-15T10:00:00',
          status: 'CONFIRMED',
          client: { firstName: 'Jan', lastName: 'Kowalski' },
        },
      ]
      mockGet.mockResolvedValue({ data: { data: reservations } })

      const result = await hallsApi.getAvailability('h1', 2026, 4)

      const april15 = result.find((d) => d.date === '2026-04-15')
      expect(april15).toBeDefined()
      expect(april15!.isAvailable).toBe(false)
      expect(april15!.reservationId).toBe('r1')
      expect(april15!.reservationClient).toBe('Jan Kowalski')
    })

    it('marks days without reservations as available', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      const result = await hallsApi.getAvailability('h1', 2026, 4)

      expect(result.every((d) => d.isAvailable)).toBe(true)
    })
  })

  // ── error handling ──────────────────────────────────────────────

  describe('error handling', () => {
    it('propagates errors from apiClient', async () => {
      mockGet.mockRejectedValue(new Error('Server Error'))

      await expect(hallsApi.getAll()).rejects.toThrow('Server Error')
    })
  })
})
