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
import { reservationsApi } from '@/lib/api/reservations'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockPatch = vi.mocked(apiClient.patch)
const mockDelete = vi.mocked(apiClient.delete)

describe('reservationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getAll ──────────────────────────────────────────────────────

  describe('getAll', () => {
    it('passes filters as query params', async () => {
      const filters = { page: 2, pageSize: 10, status: 'CONFIRMED' as any, hallId: 'h1' }
      mockGet.mockResolvedValue({
        data: { success: true, data: [], count: 0 },
      })

      await reservationsApi.getAll(filters)

      expect(mockGet).toHaveBeenCalledWith('/reservations', { params: filters })
    })

    it('transforms backend {success, data, count} to PaginatedResponse', async () => {
      const items = [{ id: '1' }, { id: '2' }]
      mockGet.mockResolvedValue({
        data: { success: true, data: items, count: 25 },
      })

      const result = await reservationsApi.getAll({ page: 3, pageSize: 10 })

      expect(result).toEqual({
        data: items,
        total: 25,
        page: 3,
        pageSize: 10,
        totalPages: 3,
      })
    })

    it('defaults page=1, pageSize=20 when no filters', async () => {
      mockGet.mockResolvedValue({
        data: { success: true, data: [{ id: '1' }], count: 1 },
      })

      const result = await reservationsApi.getAll()

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
      expect(result.totalPages).toBe(1)
    })

    it('handles fallback when data is already in correct format', async () => {
      const payload = {
        data: [{ id: '1' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
      mockGet.mockResolvedValue({ data: payload })

      const result = await reservationsApi.getAll()

      expect(result).toEqual(payload)
    })

    it('handles fallback when response is a direct array', async () => {
      mockGet.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await reservationsApi.getAll()

      expect(result.data).toEqual([{ id: '1' }])
      expect(result.total).toBe(1)
    })
  })

  // ── getById ─────────────────────────────────────────────────────

  describe('getById', () => {
    it('calls GET /reservations/:id and returns data.data', async () => {
      const reservation = { id: 'r1', status: 'CONFIRMED' }
      mockGet.mockResolvedValue({ data: { data: reservation } })

      const result = await reservationsApi.getById('r1')

      expect(mockGet).toHaveBeenCalledWith('/reservations/r1')
      expect(result).toEqual(reservation)
    })

    it('falls back to data when data.data is absent', async () => {
      const reservation = { id: 'r1' }
      mockGet.mockResolvedValue({ data: reservation })

      const result = await reservationsApi.getById('r1')

      expect(result).toEqual(reservation)
    })
  })

  // ── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('calls POST /reservations with input', async () => {
      const input = { hallId: 'h1', clientId: 'c1', date: '2026-04-01' } as any
      const created = { id: 'new1', ...input }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await reservationsApi.create(input)

      expect(mockPost).toHaveBeenCalledWith('/reservations', input)
      expect(result).toEqual(created)
    })
  })

  // ── update ──────────────────────────────────────────────────────

  describe('update', () => {
    it('calls PUT /reservations/:id with input', async () => {
      const input = { guests: 50 } as any
      const updated = { id: 'r1', guests: 50 }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await reservationsApi.update('r1', input)

      expect(mockPut).toHaveBeenCalledWith('/reservations/r1', input)
      expect(result).toEqual(updated)
    })
  })

  // ── updateStatus ────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('calls PATCH /reservations/:id/status with status and reason', async () => {
      const updated = { id: 'r1', status: 'CONFIRMED' }
      mockPatch.mockResolvedValue({ data: { data: updated } })

      const result = await reservationsApi.updateStatus('r1', 'CONFIRMED' as any, 'Approved')

      expect(mockPatch).toHaveBeenCalledWith('/reservations/r1/status', {
        status: 'CONFIRMED',
        reason: 'Approved',
      })
      expect(result).toEqual(updated)
    })

    it('uses default reason when none is provided', async () => {
      mockPatch.mockResolvedValue({ data: { data: { id: 'r1' } } })

      await reservationsApi.updateStatus('r1', 'CANCELLED' as any)

      expect(mockPatch).toHaveBeenCalledWith('/reservations/r1/status', {
        status: 'CANCELLED',
        reason: 'Status updated',
      })
    })
  })

  // ── cancel ──────────────────────────────────────────────────────

  describe('cancel', () => {
    it('calls DELETE /reservations/:id with body data', async () => {
      const input = { reason: 'Client request' } as any
      mockDelete.mockResolvedValue({ data: { data: { id: 'r1', status: 'CANCELLED' } } })

      const result = await reservationsApi.cancel('r1', input)

      expect(mockDelete).toHaveBeenCalledWith('/reservations/r1', { data: input })
      expect(result.status).toBe('CANCELLED')
    })
  })

  // ── archive / unarchive ─────────────────────────────────────────

  describe('archive', () => {
    it('calls POST /reservations/:id/archive', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'r1', archived: true } } })

      const result = await reservationsApi.archive('r1', 'Old event')

      expect(mockPost).toHaveBeenCalledWith('/reservations/r1/archive', { reason: 'Old event' })
      expect(result.archived).toBe(true)
    })
  })

  describe('unarchive', () => {
    it('calls POST /reservations/:id/unarchive', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'r1', archived: false } } })

      const result = await reservationsApi.unarchive('r1', 'Reopened')

      expect(mockPost).toHaveBeenCalledWith('/reservations/r1/unarchive', { reason: 'Reopened' })
      expect(result.archived).toBe(false)
    })
  })

  // ── downloadPdf ─────────────────────────────────────────────────

  describe('downloadPdf', () => {
    it('calls GET /reservations/:id/pdf with responseType blob', async () => {
      const blob = new Blob(['pdf-content'])
      mockGet.mockResolvedValue({ data: blob })

      const result = await reservationsApi.downloadPdf('r1')

      expect(mockGet).toHaveBeenCalledWith('/reservations/r1/pdf', { responseType: 'blob' })
      expect(result).toBe(blob)
    })
  })

  // ── exportCsv ───────────────────────────────────────────────────

  describe('exportCsv', () => {
    it('calls GET /reservations/export/csv with filters and responseType blob', async () => {
      const blob = new Blob(['csv-content'])
      const filters = { status: 'CONFIRMED' as any }
      mockGet.mockResolvedValue({ data: blob })

      const result = await reservationsApi.exportCsv(filters)

      expect(mockGet).toHaveBeenCalledWith('/reservations/export/csv', {
        params: filters,
        responseType: 'blob',
      })
      expect(result).toBe(blob)
    })
  })

  // ── error handling ──────────────────────────────────────────────

  describe('error handling', () => {
    it('propagates network errors from apiClient', async () => {
      const error = new Error('Network Error')
      mockGet.mockRejectedValue(error)

      await expect(reservationsApi.getAll()).rejects.toThrow('Network Error')
    })

    it('propagates errors on getById', async () => {
      mockGet.mockRejectedValue(new Error('Not Found'))

      await expect(reservationsApi.getById('bad-id')).rejects.toThrow('Not Found')
    })
  })
})
