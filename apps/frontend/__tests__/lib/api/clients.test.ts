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
  clientsApi,
  contactsApi,
  normalizePhone,
  checkPhoneDuplicate,
} from '@/lib/api/clients'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

describe('clientsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getAll ──────────────────────────────────────────────────────

  describe('getAll', () => {
    it('passes filters as query params', async () => {
      mockGet.mockResolvedValue({
        data: { success: true, data: [], count: 0 },
      })

      await clientsApi.getAll({ search: 'Jan', clientType: 'INDIVIDUAL' as any })

      expect(mockGet).toHaveBeenCalledWith('/clients', {
        params: { search: 'Jan', clientType: 'INDIVIDUAL' },
      })
    })

    it('returns data.data when backend returns success format', async () => {
      const clients = [{ id: 'c1', firstName: 'Jan' }]
      mockGet.mockResolvedValue({
        data: { success: true, data: clients, count: 1 },
      })

      const result = await clientsApi.getAll()

      expect(result).toEqual(clients)
    })

    it('falls back to direct array when response has no success flag', async () => {
      const clients = [{ id: 'c1' }]
      mockGet.mockResolvedValue({ data: clients })

      const result = await clientsApi.getAll()

      expect(result).toEqual(clients)
    })

    it('returns empty array for unexpected formats', async () => {
      mockGet.mockResolvedValue({ data: 'bad' })

      const result = await clientsApi.getAll()

      expect(result).toEqual([])
    })
  })

  // ── getById ─────────────────────────────────────────────────────

  describe('getById', () => {
    it('calls GET /clients/:id and unwraps data.data', async () => {
      const client = { id: 'c1', firstName: 'Jan' }
      mockGet.mockResolvedValue({ data: { data: client } })

      const result = await clientsApi.getById('c1')

      expect(mockGet).toHaveBeenCalledWith('/clients/c1')
      expect(result).toEqual(client)
    })
  })

  // ── getReservationSummary ───────────────────────────────────────

  describe('getReservationSummary', () => {
    it('calls GET /clients/:id/reservation-summary', async () => {
      const summary = { active: 2, completed: 5, cancelled: 1, archived: 0, total: 8 }
      mockGet.mockResolvedValue({ data: { data: summary } })

      const result = await clientsApi.getReservationSummary('c1')

      expect(mockGet).toHaveBeenCalledWith('/clients/c1/reservation-summary')
      expect(result).toEqual(summary)
    })
  })

  // ── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('calls POST /clients with input', async () => {
      const input = { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789' } as any
      const created = { id: 'c-new', ...input }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await clientsApi.create(input)

      expect(mockPost).toHaveBeenCalledWith('/clients', input)
      expect(result).toEqual(created)
    })
  })

  // ── update ──────────────────────────────────────────────────────

  describe('update', () => {
    it('calls PUT /clients/:id with partial input', async () => {
      const input = { firstName: 'Janusz' }
      const updated = { id: 'c1', firstName: 'Janusz' }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await clientsApi.update('c1', input)

      expect(mockPut).toHaveBeenCalledWith('/clients/c1', input)
      expect(result).toEqual(updated)
    })
  })

  // ── delete ──────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls DELETE /clients/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await clientsApi.delete('c1')

      expect(mockDelete).toHaveBeenCalledWith('/clients/c1')
    })
  })
})

// ════════════════════════════════════════════════════════════════
// contactsApi
// ════════════════════════════════════════════════════════════════

describe('contactsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns data.data for success format', async () => {
      const contacts = [{ id: 'ct1', name: 'Anna' }]
      mockGet.mockResolvedValue({ data: { success: true, data: contacts } })

      const result = await contactsApi.getAll('c1')

      expect(mockGet).toHaveBeenCalledWith('/clients/c1/contacts')
      expect(result).toEqual(contacts)
    })

    it('falls back to direct array', async () => {
      const contacts = [{ id: 'ct1' }]
      mockGet.mockResolvedValue({ data: contacts })

      const result = await contactsApi.getAll('c1')

      expect(result).toEqual(contacts)
    })
  })

  describe('add', () => {
    it('calls POST /clients/:clientId/contacts', async () => {
      const input = { name: 'Anna', phone: '111222333' } as any
      const created = { id: 'ct-new', ...input }
      mockPost.mockResolvedValue({ data: { data: created } })

      const result = await contactsApi.add('c1', input)

      expect(mockPost).toHaveBeenCalledWith('/clients/c1/contacts', input)
      expect(result).toEqual(created)
    })
  })

  describe('update', () => {
    it('calls PUT /clients/:clientId/contacts/:contactId', async () => {
      const input = { name: 'Anna Maria' }
      const updated = { id: 'ct1', name: 'Anna Maria' }
      mockPut.mockResolvedValue({ data: { data: updated } })

      const result = await contactsApi.update('c1', 'ct1', input)

      expect(mockPut).toHaveBeenCalledWith('/clients/c1/contacts/ct1', input)
      expect(result).toEqual(updated)
    })
  })

  describe('remove', () => {
    it('calls DELETE /clients/:clientId/contacts/:contactId', async () => {
      mockDelete.mockResolvedValue({ data: {} })

      await contactsApi.remove('c1', 'ct1')

      expect(mockDelete).toHaveBeenCalledWith('/clients/c1/contacts/ct1')
    })
  })
})

// ════════════════════════════════════════════════════════════════
// Utility functions
// ════════════════════════════════════════════════════════════════

describe('normalizePhone', () => {
  it('removes spaces', () => {
    expect(normalizePhone('123 456 789')).toBe('123456789')
  })

  it('removes hyphens', () => {
    expect(normalizePhone('123-456-789')).toBe('123456789')
  })

  it('removes parentheses', () => {
    expect(normalizePhone('(48) 123456789')).toBe('48123456789')
  })

  it('removes mixed formatting', () => {
    expect(normalizePhone('(+48) 123-456 789')).toBe('+48123456789')
  })
})

describe('checkPhoneDuplicate', () => {
  const clients = [
    { id: 'c1', firstName: 'Jan', phone: '123 456 789' },
    { id: 'c2', firstName: 'Anna', phone: '987-654-321' },
    { id: 'c3', firstName: 'Piotr', phone: null },
  ] as any[]

  it('returns matching client when duplicate found', () => {
    const result = checkPhoneDuplicate('123456789', clients)

    expect(result).not.toBeNull()
    expect(result!.id).toBe('c1')
  })

  it('returns null when no duplicate', () => {
    const result = checkPhoneDuplicate('555555555', clients)

    expect(result).toBeNull()
  })

  it('excludes self when excludeId is provided', () => {
    const result = checkPhoneDuplicate('123456789', clients, 'c1')

    expect(result).toBeNull()
  })

  it('returns null for short phone numbers (< 9 chars)', () => {
    const result = checkPhoneDuplicate('12345', clients)

    expect(result).toBeNull()
  })

  it('returns null for empty phone', () => {
    const result = checkPhoneDuplicate('', clients)

    expect(result).toBeNull()
  })

  it('skips clients without phone numbers', () => {
    const result = checkPhoneDuplicate('000000000', clients)

    expect(result).toBeNull()
  })
})
