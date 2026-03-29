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
import { statsApi } from '@/lib/api/stats-api'

const mockGet = vi.mocked(apiClient.get)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('statsApi', () => {
  describe('getOverview', () => {
    it('calls GET /stats/overview and returns dashboard overview', async () => {
      const overview = {
        reservationsToday: 3,
        reservationsThisWeek: 12,
        reservationsThisMonth: 45,
        queueCount: 7,
        confirmedThisMonth: 30,
        revenueThisMonth: 150000,
        revenuePrevMonth: 120000,
        revenueChangePercent: 25,
        totalClients: 200,
        newClientsThisMonth: 15,
        pendingDepositsCount: 5,
        pendingDepositsAmount: 25000,
        activeHalls: 4,
      }
      mockGet.mockResolvedValue({ data: { data: overview } })

      const result = await statsApi.getOverview()

      expect(mockGet).toHaveBeenCalledWith('/stats/overview')
      expect(result).toEqual(overview)
    })
  })

  describe('getUpcoming', () => {
    it('calls GET /stats/upcoming with default limit=10', async () => {
      const reservations = [
        {
          id: 'r1',
          date: '2026-04-01',
          startTime: '10:00',
          endTime: '14:00',
          startDateTime: null,
          endDateTime: null,
          guests: 50,
          adults: 40,
          children: 8,
          toddlers: 2,
          totalPrice: '5000',
          status: 'CONFIRMED',
          notes: null,
          hall: { id: 'h1', name: 'Main Hall' },
          client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', phone: '123456789' },
          eventType: { id: 'et1', name: 'Wedding', color: '#ff0000' },
          deposits: [],
        },
      ]
      mockGet.mockResolvedValue({ data: { data: reservations } })

      const result = await statsApi.getUpcoming()

      expect(mockGet).toHaveBeenCalledWith('/stats/upcoming', { params: { limit: 10 } })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('r1')
    })

    it('passes custom limit parameter', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })

      await statsApi.getUpcoming(5)

      expect(mockGet).toHaveBeenCalledWith('/stats/upcoming', { params: { limit: 5 } })
    })

    it('transforms startDateTime into date/startTime when date is missing', async () => {
      const raw = [
        {
          id: 'r2',
          date: null,
          startTime: null,
          endTime: null,
          startDateTime: '2026-04-15T08:00:00.000Z',
          endDateTime: '2026-04-15T14:30:00.000Z',
          guests: 0,
          adults: 30,
          children: 5,
          toddlers: 0,
          totalPrice: '3000',
          status: 'PENDING',
          notes: null,
          hall: null,
          client: { id: 'c2', firstName: 'Anna', lastName: 'Nowak', phone: '987654321' },
          eventType: null,
          deposits: [],
        },
      ]
      mockGet.mockResolvedValue({ data: { data: raw } })

      const result = await statsApi.getUpcoming()

      expect(result[0].date).toBe('2026-04-15')
      expect(result[0].startTime).toBe('08:00')
      expect(result[0].endTime).toBe('14:30')
    })

    it('calculates guests from adults + children + toddlers when guests is 0', async () => {
      const raw = [
        {
          id: 'r3',
          date: '2026-05-01',
          startTime: '12:00',
          endTime: '18:00',
          startDateTime: null,
          endDateTime: null,
          guests: 0,
          adults: 20,
          children: 10,
          toddlers: 5,
          totalPrice: '2000',
          status: 'CONFIRMED',
          notes: null,
          hall: null,
          client: { id: 'c3', firstName: 'X', lastName: 'Y', phone: '111' },
          eventType: null,
          deposits: [],
        },
      ]
      mockGet.mockResolvedValue({ data: { data: raw } })

      const result = await statsApi.getUpcoming()

      expect(result[0].guests).toBe(35)
    })

    it('keeps existing date/startTime/endTime when already present', async () => {
      const raw = [
        {
          id: 'r4',
          date: '2026-06-01',
          startTime: '09:00',
          endTime: '13:00',
          startDateTime: '2026-06-01T09:00:00.000Z',
          endDateTime: '2026-06-01T13:00:00.000Z',
          guests: 50,
          adults: 40,
          children: 10,
          toddlers: 0,
          totalPrice: '4000',
          status: 'CONFIRMED',
          notes: null,
          hall: null,
          client: { id: 'c4', firstName: 'A', lastName: 'B', phone: '222' },
          eventType: null,
          deposits: [],
        },
      ]
      mockGet.mockResolvedValue({ data: { data: raw } })

      const result = await statsApi.getUpcoming()

      expect(result[0].date).toBe('2026-06-01')
      expect(result[0].startTime).toBe('09:00')
      expect(result[0].endTime).toBe('13:00')
      expect(result[0].guests).toBe(50)
    })
  })
})
