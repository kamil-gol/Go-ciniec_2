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
import { depositsApi } from '@/lib/api/deposits'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockPatch = vi.mocked(apiClient.patch)
const mockDelete = vi.mocked(apiClient.delete)

describe('depositsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getAll ──────────────────────────────────────────────────────

  describe('getAll', () => {
    it('calls GET /deposits with default limit=500', async () => {
      const deposits = [{ id: 'd1' }, { id: 'd2' }]
      mockGet.mockResolvedValue({ data: { data: deposits } })

      const result = await depositsApi.getAll()

      expect(mockGet).toHaveBeenCalledWith('/deposits?limit=500')
      expect(result).toEqual(deposits)
    })

    it('passes status filter as query param', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      await depositsApi.getAll({ status: 'PENDING' })

      const calledUrl = mockGet.mock.calls[0][0] as string
      expect(calledUrl).toContain('status=PENDING')
      expect(calledUrl).toContain('limit=500')
    })

    it('passes overdue filter', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      await depositsApi.getAll({ overdue: true })

      const calledUrl = mockGet.mock.calls[0][0] as string
      expect(calledUrl).toContain('overdue=true')
    })

    it('passes search filter', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      await depositsApi.getAll({ search: 'Kowalski' })

      const calledUrl = mockGet.mock.calls[0][0] as string
      expect(calledUrl).toContain('search=Kowalski')
    })

    it('respects custom limit', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      await depositsApi.getAll({ limit: 50 })

      const calledUrl = mockGet.mock.calls[0][0] as string
      expect(calledUrl).toContain('limit=50')
    })
  })

  // ── getStats ────────────────────────────────────────────────────

  describe('getStats', () => {
    it('calls GET /deposits/stats and returns data.data', async () => {
      const stats = { counts: { total: 10 }, amounts: { total: 5000 } }
      mockGet.mockResolvedValue({ data: { data: stats } })

      const result = await depositsApi.getStats()

      expect(mockGet).toHaveBeenCalledWith('/deposits/stats')
      expect(result).toEqual(stats)
    })
  })

  // ── getById ─────────────────────────────────────────────────────

  describe('getById', () => {
    it('calls GET /deposits/:id and returns data.data', async () => {
      const deposit = { id: 'd1', amount: '1000', status: 'PENDING' }
      mockGet.mockResolvedValue({ data: { data: deposit } })

      const result = await depositsApi.getById('d1')

      expect(mockGet).toHaveBeenCalledWith('/deposits/d1')
      expect(result).toEqual(deposit)
    })
  })

  // ── getByReservation ────────────────────────────────────────────

  describe('getByReservation', () => {
    it('calls GET /reservations/:id/deposits', async () => {
      const deposits = [{ id: 'd1' }, { id: 'd2' }]
      mockGet.mockResolvedValue({ data: { data: deposits } })

      const result = await depositsApi.getByReservation('r1')

      expect(mockGet).toHaveBeenCalledWith('/reservations/r1/deposits')
      expect(result).toEqual(deposits)
    })
  })

  // ── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('calls POST /reservations/:id/deposits with input', async () => {
      const input = { amount: 500, dueDate: '2026-04-15', title: 'Zaliczka' }
      const created = { id: 'd-new', ...input }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await depositsApi.create('r1', input)

      expect(mockPost).toHaveBeenCalledWith('/reservations/r1/deposits', input)
      expect(result).toEqual(created)
    })
  })

  // ── update ──────────────────────────────────────────────────────

  describe('update', () => {
    it('calls PUT /deposits/:id with input', async () => {
      const input = { amount: 600 }
      const updated = { id: 'd1', amount: '600' }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await depositsApi.update('d1', input)

      expect(mockPut).toHaveBeenCalledWith('/deposits/d1', input)
      expect(result).toEqual(updated)
    })
  })

  // ── delete ──────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls DELETE /deposits/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await depositsApi.delete('d1')

      expect(mockDelete).toHaveBeenCalledWith('/deposits/d1')
    })
  })

  // ── markAsPaid ──────────────────────────────────────────────────

  describe('markAsPaid', () => {
    it('calls PATCH /deposits/:id/mark-paid with payment data', async () => {
      const input = { paymentMethod: 'TRANSFER' as const, paidAt: '2026-04-01T12:00:00' }
      const updated = { id: 'd1', status: 'PAID', paid: true }
      mockPatch.mockResolvedValue({ data: { data: updated } })

      const result = await depositsApi.markAsPaid('d1', input)

      expect(mockPatch).toHaveBeenCalledWith('/deposits/d1/mark-paid', input)
      expect(result).toEqual(updated)
    })
  })

  // ── markAsUnpaid ────────────────────────────────────────────────

  describe('markAsUnpaid', () => {
    it('calls PATCH /deposits/:id/mark-unpaid', async () => {
      const updated = { id: 'd1', status: 'PENDING', paid: false }
      mockPatch.mockResolvedValue({ data: { data: updated } })

      const result = await depositsApi.markAsUnpaid('d1')

      expect(mockPatch).toHaveBeenCalledWith('/deposits/d1/mark-unpaid')
      expect(result).toEqual(updated)
    })
  })

  // ── cancel ──────────────────────────────────────────────────────

  describe('cancel', () => {
    it('calls PATCH /deposits/:id/cancel', async () => {
      const updated = { id: 'd1', status: 'CANCELLED' }
      mockPatch.mockResolvedValue({ data: { data: updated } })

      const result = await depositsApi.cancel('d1')

      expect(mockPatch).toHaveBeenCalledWith('/deposits/d1/cancel')
      expect(result).toEqual(updated)
    })
  })

  // ── getOverdue ──────────────────────────────────────────────────

  describe('getOverdue', () => {
    it('calls GET /deposits/overdue', async () => {
      const overdue = [{ id: 'd1', status: 'OVERDUE' }]
      mockGet.mockResolvedValue({ data: { data: overdue } })

      const result = await depositsApi.getOverdue()

      expect(mockGet).toHaveBeenCalledWith('/deposits/overdue')
      expect(result).toEqual(overdue)
    })
  })

  // ── sendEmail ───────────────────────────────────────────────────

  describe('sendEmail', () => {
    it('calls POST /deposits/:id/send-email', async () => {
      mockPost.mockResolvedValue({ data: { success: true, message: 'Email sent' } })

      const result = await depositsApi.sendEmail('d1')

      expect(mockPost).toHaveBeenCalledWith('/deposits/d1/send-email')
      expect(result).toEqual({ success: true, message: 'Email sent' })
    })
  })

  // ── error handling ──────────────────────────────────────────────

  describe('error handling', () => {
    it('propagates errors from apiClient', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'))

      await expect(depositsApi.getAll()).rejects.toThrow('Network Error')
    })

    it('propagates errors on create', async () => {
      mockPost.mockRejectedValue(new Error('Validation Error'))

      await expect(
        depositsApi.create('r1', { amount: -1, dueDate: 'bad' })
      ).rejects.toThrow('Validation Error')
    })
  })
})
