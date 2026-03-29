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
import { queueApi } from '@/lib/api/queue'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('queueApi', () => {
  describe('getAll', () => {
    it('calls GET /queue and returns data array', async () => {
      const items = [{ id: 'q1', position: 1 }, { id: 'q2', position: 2 }]
      mockGet.mockResolvedValue({ data: { data: items } })

      const result = await queueApi.getAll()

      expect(mockGet).toHaveBeenCalledWith('/queue')
      expect(result).toEqual(items)
    })

    it('falls back to data directly when data.data is undefined', async () => {
      const items = [{ id: 'q1' }]
      mockGet.mockResolvedValue({ data: items })

      const result = await queueApi.getAll()

      expect(result).toEqual(items)
    })

    it('returns empty array when response has empty data array', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      const result = await queueApi.getAll()

      expect(result).toEqual([])
    })
  })

  describe('getByDate', () => {
    it('calls GET /queue/:date and returns data array', async () => {
      const items = [{ id: 'q1', reservationQueueDate: '2026-04-01' }]
      mockGet.mockResolvedValue({ data: { data: items } })

      const result = await queueApi.getByDate('2026-04-01')

      expect(mockGet).toHaveBeenCalledWith('/queue/2026-04-01')
      expect(result).toEqual(items)
    })
  })

  describe('getStats', () => {
    it('calls GET /queue/stats and returns stats object', async () => {
      const stats = { totalInQueue: 5, byDate: {} }
      mockGet.mockResolvedValue({ data: { data: stats } })

      const result = await queueApi.getStats()

      expect(mockGet).toHaveBeenCalledWith('/queue/stats')
      expect(result).toEqual(stats)
    })
  })

  describe('addToQueue', () => {
    it('calls POST /queue/reserved with input and returns created item', async () => {
      const input = { clientId: 'c1', reservationQueueDate: '2026-04-01', guests: 50 }
      const created = { id: 'q-new', ...input, position: 1 }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await queueApi.addToQueue(input as any)

      expect(mockPost).toHaveBeenCalledWith('/queue/reserved', input)
      expect(result).toEqual(created)
    })
  })

  describe('updateQueueReservation', () => {
    it('calls PUT /queue/:id with input and returns updated item', async () => {
      const input = { guests: 100, notes: 'VIP' }
      const updated = { id: 'q1', ...input }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await queueApi.updateQueueReservation('q1', input)

      expect(mockPut).toHaveBeenCalledWith('/queue/q1', input)
      expect(result).toEqual(updated)
    })
  })

  describe('swapPositions', () => {
    it('calls POST /queue/swap with both reservation IDs', async () => {
      mockPost.mockResolvedValue({ data: {} })
      const input = { reservationId1: 'r1', reservationId2: 'r2' }

      await queueApi.swapPositions(input)

      expect(mockPost).toHaveBeenCalledWith('/queue/swap', input)
    })
  })

  describe('moveToPosition', () => {
    it('calls PUT /queue/:id/position with newPosition', async () => {
      mockPut.mockResolvedValue({ data: {} })

      await queueApi.moveToPosition('r1', 3)

      expect(mockPut).toHaveBeenCalledWith('/queue/r1/position', { newPosition: 3 })
    })
  })

  describe('batchUpdatePositions', () => {
    it('calls POST /queue/batch-update-positions with updates array', async () => {
      const input = { updates: [{ id: 'r1', position: 1 }, { id: 'r2', position: 2 }] }
      mockPost.mockResolvedValue({ data: { data: { updatedCount: 2 } } })

      const result = await queueApi.batchUpdatePositions(input)

      expect(mockPost).toHaveBeenCalledWith('/queue/batch-update-positions', input)
      expect(result).toEqual({ updatedCount: 2 })
    })
  })

  describe('rebuildPositions', () => {
    it('calls POST /queue/rebuild-positions and returns counts', async () => {
      const response = { updatedCount: 10, dateCount: 3 }
      mockPost.mockResolvedValue({ data: { data: response } })

      const result = await queueApi.rebuildPositions()

      expect(mockPost).toHaveBeenCalledWith('/queue/rebuild-positions')
      expect(result).toEqual(response)
    })
  })

  describe('promoteReservation', () => {
    it('calls PUT /queue/:id/promote with input and returns reservation', async () => {
      const input = { hallId: 'h1', date: '2026-04-01', startTime: '10:00', endTime: '14:00' }
      const promoted = { id: 'res-1', status: 'PENDING', hallId: 'h1' }
      mockPut.mockResolvedValue({ data: { data: promoted } })

      const result = await queueApi.promoteReservation('q1', input as any)

      expect(mockPut).toHaveBeenCalledWith('/queue/q1/promote', input)
      expect(result).toEqual(promoted)
    })
  })

  describe('autoCancelExpired', () => {
    it('calls POST /queue/auto-cancel and returns cancelled info', async () => {
      const response = { cancelledCount: 2, cancelledIds: ['r1', 'r2'] }
      mockPost.mockResolvedValue({ data: { data: response } })

      const result = await queueApi.autoCancelExpired()

      expect(mockPost).toHaveBeenCalledWith('/queue/auto-cancel')
      expect(result).toEqual(response)
    })
  })
})
