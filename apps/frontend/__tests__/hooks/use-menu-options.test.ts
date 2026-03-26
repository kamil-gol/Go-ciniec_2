/**
 * useMenuOptions Hook Tests
 *
 * Testy opcji menu:
 * - Pobranie listy opcji (z filtrami / bez)
 * - Pobranie pojedynczej opcji
 * - Tworzenie, aktualizacja, usuwanie opcji
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockGetMenuOptions, mockGetMenuOptionById, mockCreateMenuOption, mockUpdateMenuOption, mockDeleteMenuOption } = vi.hoisted(() => ({
  mockGetMenuOptions: vi.fn(),
  mockGetMenuOptionById: vi.fn(),
  mockCreateMenuOption: vi.fn(),
  mockUpdateMenuOption: vi.fn(),
  mockDeleteMenuOption: vi.fn(),
}))

vi.mock('@/lib/api/menu-options-api', () => ({
  getMenuOptions: (...a: any[]) => mockGetMenuOptions(...a),
  getMenuOptionById: (...a: any[]) => mockGetMenuOptionById(...a),
  createMenuOption: (...a: any[]) => mockCreateMenuOption(...a),
  updateMenuOption: (...a: any[]) => mockUpdateMenuOption(...a),
  deleteMenuOption: (...a: any[]) => mockDeleteMenuOption(...a),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  useMenuOptions,
  useMenuOption,
  useCreateMenuOption,
  useUpdateMenuOption,
  useDeleteMenuOption,
} from '@/hooks/use-menu-options'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ═══ Queries ═══

describe('useMenuOptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches all options', async () => {
    mockGetMenuOptions.mockResolvedValue([{ id: 'o1', name: 'Opcja A' }])
    const { result } = renderHook(() => useMenuOptions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'o1', name: 'Opcja A' }])
  })

  it('passes filters', async () => {
    mockGetMenuOptions.mockResolvedValue([])
    renderHook(() => useMenuOptions({ category: 'DRINK', isActive: true }), { wrapper: createWrapper() })
    await waitFor(() => expect(mockGetMenuOptions).toHaveBeenCalledWith({ category: 'DRINK', isActive: true }))
  })
})

describe('useMenuOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single option', async () => {
    mockGetMenuOptionById.mockResolvedValue({ id: 'o1', name: 'Bar' })
    const { result } = renderHook(() => useMenuOption('o1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 'o1', name: 'Bar' })
  })

  it('is disabled for undefined id', () => {
    const { result } = renderHook(() => useMenuOption(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ═══ Mutations ═══

describe('useCreateMenuOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates option', async () => {
    mockCreateMenuOption.mockResolvedValue({ id: 'new', name: 'Nowa' })
    const { result } = renderHook(() => useCreateMenuOption(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Nowa', category: 'FOOD' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCreateMenuOption).toHaveBeenCalledWith({ name: 'Nowa', category: 'FOOD' })
  })
})

describe('useUpdateMenuOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates option', async () => {
    mockUpdateMenuOption.mockResolvedValue({ id: 'o1', name: 'Updated' })
    const { result } = renderHook(() => useUpdateMenuOption(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'o1', data: { name: 'Updated' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateMenuOption).toHaveBeenCalledWith('o1', { name: 'Updated' })
  })
})

describe('useDeleteMenuOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes option', async () => {
    mockDeleteMenuOption.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteMenuOption(), { wrapper: createWrapper() })
    result.current.mutate('o1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteMenuOption).toHaveBeenCalledWith('o1')
  })
})
