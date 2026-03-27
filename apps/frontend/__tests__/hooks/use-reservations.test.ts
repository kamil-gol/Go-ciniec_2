import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Mocks ──────────────────────────────────────────────────
const { mockGetAll, mockGetById, mockCreate, mockUpdate, mockCancel, mockArchive } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockCancel: vi.fn(),
  mockArchive: vi.fn(),
}))

vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    getAll: (...a: any[]) => mockGetAll(...a),
    getById: (...a: any[]) => mockGetById(...a),
    create: (...a: any[]) => mockCreate(...a),
    update: (...a: any[]) => mockUpdate(...a),
    cancel: (...a: any[]) => mockCancel(...a),
    archive: (...a: any[]) => mockArchive(...a),
  },
}))

import {
  useReservations,
  useReservation,
  useCreateReservation,
  useUpdateReservation,
  useCancelReservation,
  useArchiveReservation,
} from '@/hooks/use-reservations'
import { toast } from 'sonner'

// ── Helpers ────────────────────────────────────────────────
function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ── Tests ──────────────────────────────────────────────────
describe('useReservations', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches reservations list', async () => {
    const data = [{ id: '1', status: 'PENDING' }]
    mockGetAll.mockResolvedValue(data)

    const { result } = renderHook(() => useReservations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(data)
  })

  it('passes filters to API', async () => {
    mockGetAll.mockResolvedValue([])
    const filters = { status: 'CONFIRMED' }
    renderHook(() => useReservations(filters as any), { wrapper: createWrapper() })
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(filters))
  })
})

describe('useReservation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches single reservation by id', async () => {
    const data = { id: 'abc', status: 'CONFIRMED' }
    mockGetById.mockResolvedValue(data)

    const { result } = renderHook(() => useReservation('abc'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(data)
  })

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useReservation(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateReservation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls create API and shows success toast', async () => {
    mockCreate.mockResolvedValue({ id: 'new' })
    const { result } = renderHook(() => useCreateReservation(), { wrapper: createWrapper() })

    result.current.mutate({ date: '2026-06-01' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Rezerwacja została utworzona')
  })

  it('shows error toast on failure', async () => {
    mockCreate.mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useCreateReservation(), { wrapper: createWrapper() })

    result.current.mutate({} as any)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Nie udało się utworzyć rezerwacji')
  })
})

describe('useUpdateReservation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls update API and shows success toast', async () => {
    mockUpdate.mockResolvedValue({ id: '1' })
    const { result } = renderHook(() => useUpdateReservation(), { wrapper: createWrapper() })

    result.current.mutate({ id: '1', input: {} as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Rezerwacja została zaktualizowana')
  })

  it('shows error toast on failure', async () => {
    mockUpdate.mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useUpdateReservation(), { wrapper: createWrapper() })

    result.current.mutate({ id: '1', input: {} as any })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Nie udało się zaktualizować rezerwacji')
  })
})

describe('useCancelReservation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls cancel API and shows success toast', async () => {
    mockCancel.mockResolvedValue({})
    const { result } = renderHook(() => useCancelReservation(), { wrapper: createWrapper() })

    result.current.mutate({ id: '1', input: { reason: 'test' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Rezerwacja została anulowana')
  })
})

describe('useArchiveReservation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls archive API and shows success toast', async () => {
    mockArchive.mockResolvedValue({})
    const { result } = renderHook(() => useArchiveReservation(), { wrapper: createWrapper() })

    result.current.mutate('1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Rezerwacja została zarchiwizowana')
  })
})
