import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const mockApply = vi.fn()
const mockRemove = vi.fn()

vi.mock('@/lib/api/discount', () => ({
  discountApi: {
    apply: (...a: any[]) => mockApply(...a),
    remove: (...a: any[]) => mockRemove(...a),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useApplyDiscount, useRemoveDiscount } from '@/hooks/use-discount'
import { toast } from 'sonner'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useApplyDiscount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls apply API and shows success toast', async () => {
    mockApply.mockResolvedValue({})
    const { result } = renderHook(() => useApplyDiscount(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'r1', input: { type: 'PERCENTAGE', value: 10 } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApply).toHaveBeenCalledWith('r1', { type: 'PERCENTAGE', value: 10 })
    expect(toast.success).toHaveBeenCalledWith('Rabat został zastosowany')
  })

  it('shows error toast on failure', async () => {
    mockApply.mockRejectedValue({ response: { data: { message: 'Custom error' } } })
    const { result } = renderHook(() => useApplyDiscount(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'r1', input: {} as any })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Custom error')
  })

  it('uses default error message when response has no message', async () => {
    mockApply.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useApplyDiscount(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'r1', input: {} as any })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Nie udało się zastosować rabatu')
  })
})

describe('useRemoveDiscount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls remove API and shows success toast', async () => {
    mockRemove.mockResolvedValue({ id: 'r1' })
    const { result } = renderHook(() => useRemoveDiscount(), { wrapper: createWrapper() })

    result.current.mutate('r1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Rabat został usunięty')
  })

  it('shows error toast on failure', async () => {
    mockRemove.mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useRemoveDiscount(), { wrapper: createWrapper() })

    result.current.mutate('r1')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Nie udało się usunąć rabatu')
  })
})
