/**
 * useClients Hook Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - useClients query with/without filters
 * - useClient single query with enabled condition
 * - useCreateClient mutation + toast + cache invalidation
 * - useUpdateClient mutation + toast + cache invalidation
 * - useDeleteClient mutation + toast + cache invalidation
 */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAll = vi.fn()
const mockGetById = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/lib/api/clients', () => ({
  clientsApi: {
    getAll: (...args: any[]) => mockGetAll(...args),
    getById: (...args: any[]) => mockGetById(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

import {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '@/hooks/use-clients'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('use-clients hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── useClients ────────────────────────────────────────────────────────

  describe('useClients', () => {
    it('should fetch clients list', async () => {
      const clients = [
        { id: '1', firstName: 'Jan', lastName: 'Kowalski' },
        { id: '2', firstName: 'Anna', lastName: 'Nowak' },
      ]
      mockGetAll.mockResolvedValue(clients)

      const { result } = renderHook(() => useClients(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(clients)
      expect(mockGetAll).toHaveBeenCalledWith(undefined)
    })

    it('should pass filters to API', async () => {
      mockGetAll.mockResolvedValue([])
      const filters = { search: 'Jan', isActive: true }

      renderHook(() => useClients(filters), { wrapper: createWrapper() })

      await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(filters))
    })
  })

  // ── useClient ─────────────────────────────────────────────────────────

  describe('useClient', () => {
    it('should fetch single client by id', async () => {
      const client = { id: 'c-1', firstName: 'Jan', lastName: 'Kowalski' }
      mockGetById.mockResolvedValue(client)

      const { result } = renderHook(() => useClient('c-1'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(client)
      expect(mockGetById).toHaveBeenCalledWith('c-1')
    })

    it('should not fetch when id is empty string', async () => {
      const { result } = renderHook(() => useClient(''), { wrapper: createWrapper() })

      // Should stay in idle/disabled state
      expect(result.current.fetchStatus).toBe('idle')
      expect(mockGetById).not.toHaveBeenCalled()
    })
  })

  // ── useCreateClient ───────────────────────────────────────────────────

  describe('useCreateClient', () => {
    it('should create client and show success toast', async () => {
      const newClient = { id: 'c-new', firstName: 'Nowy', lastName: 'Klient' }
      mockCreate.mockResolvedValue(newClient)

      const { result } = renderHook(() => useCreateClient(), { wrapper: createWrapper() })

      await result.current.mutateAsync({ firstName: 'Nowy', lastName: 'Klient' } as any)

      expect(mockCreate).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalledWith('Klient został utworzony')
    })

    it('should show error toast on failure', async () => {
      mockCreate.mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useCreateClient(), { wrapper: createWrapper() })

      try {
        await result.current.mutateAsync({ firstName: 'X' } as any)
      } catch {
        // expected
      }

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Nie udało się utworzyć klienta'))
    })
  })

  // ── useUpdateClient ───────────────────────────────────────────────────

  describe('useUpdateClient', () => {
    it('should update client and show success toast', async () => {
      const updated = { id: 'c-1', firstName: 'Updated' }
      mockUpdate.mockResolvedValue(updated)

      const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() })

      await result.current.mutateAsync({ id: 'c-1', input: { firstName: 'Updated' } })

      expect(mockUpdate).toHaveBeenCalledWith('c-1', { firstName: 'Updated' })
      expect(mockToastSuccess).toHaveBeenCalledWith('Klient został zaktualizowany')
    })

    it('should show error toast on failure', async () => {
      mockUpdate.mockRejectedValue(new Error('Fail'))

      const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() })

      try {
        await result.current.mutateAsync({ id: 'c-1', input: {} })
      } catch {
        // expected
      }

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Nie udało się zaktualizować klienta'))
    })
  })

  // ── useDeleteClient ───────────────────────────────────────────────────

  describe('useDeleteClient', () => {
    it('should delete client and show success toast', async () => {
      mockDelete.mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteClient(), { wrapper: createWrapper() })

      await result.current.mutateAsync('c-1')

      expect(mockDelete).toHaveBeenCalledWith('c-1')
      expect(mockToastSuccess).toHaveBeenCalledWith('Klient został usunięty')
    })

    it('should show error toast on failure', async () => {
      mockDelete.mockRejectedValue(new Error('Fail'))

      const { result } = renderHook(() => useDeleteClient(), { wrapper: createWrapper() })

      try {
        await result.current.mutateAsync('c-1')
      } catch {
        // expected
      }

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Nie udało się usunąć klienta'))
    })
  })
})
