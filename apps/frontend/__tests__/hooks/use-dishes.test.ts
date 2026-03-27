/**
 * useDishes Hook Tests
 *
 * Testy zarządzania daniami:
 * - Pobranie listy dań (z filtrami / bez)
 * - Pobranie pojedynczego dania
 * - Pobranie dań po kategorii
 * - Pobranie kategorii dań
 * - Tworzenie, aktualizacja, usuwanie dań
 * - Dania pogrupowane wg kategorii
 * - Klucze query (dishesKeys)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockDishesApi } = vi.hoisted(() => ({
  mockDishesApi: {
    getDishes: vi.fn(),
    getDish: vi.fn(),
    getDishesByCategory: vi.fn(),
    getDishCategories: vi.fn(),
    createDish: vi.fn(),
    updateDish: vi.fn(),
    deleteDish: vi.fn(),
  },
}))

vi.mock('@/lib/api/dishes-api', () => ({
  dishesApi: mockDishesApi,
}))

import {
  dishesKeys,
  useDishes,
  useDish,
  useDishesByCategory,
  useDishCategories,
  useCreateDish,
  useUpdateDish,
  useDeleteDish,
  useDishesByCategories,
} from '@/hooks/use-dishes'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('dishesKeys', () => {
  it('generates correct key hierarchy', () => {
    expect(dishesKeys.all).toEqual(['dishes'])
    expect(dishesKeys.lists()).toEqual(['dishes', 'list'])
    expect(dishesKeys.list({ isActive: true })).toEqual(['dishes', 'list', { isActive: true }])
    expect(dishesKeys.details()).toEqual(['dishes', 'detail'])
    expect(dishesKeys.detail('d1')).toEqual(['dishes', 'detail', 'd1'])
    expect(dishesKeys.byCategoryId('c1')).toEqual(['dishes', 'category', 'c1'])
    expect(dishesKeys.categories()).toEqual(['dishes', 'categories'])
  })
})

describe('useDishes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches dishes and selects .data', async () => {
    mockDishesApi.getDishes.mockResolvedValue({ data: [{ id: 'd1', name: 'Zupa' }] })
    const { result } = renderHook(() => useDishes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'd1', name: 'Zupa' }])
  })

  it('passes filters to API', async () => {
    mockDishesApi.getDishes.mockResolvedValue({ data: [] })
    renderHook(() => useDishes({ isActive: true }), { wrapper: createWrapper() })
    await waitFor(() => expect(mockDishesApi.getDishes).toHaveBeenCalledWith({ isActive: true }))
  })
})

describe('useDish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single dish', async () => {
    mockDishesApi.getDish.mockResolvedValue({ data: { id: 'd1', name: 'Pierogi' } })
    const { result } = renderHook(() => useDish('d1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 'd1', name: 'Pierogi' })
  })

  it('is disabled for undefined id', () => {
    const { result } = renderHook(() => useDish(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useDishesByCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches dishes by category', async () => {
    mockDishesApi.getDishesByCategory.mockResolvedValue({ data: [{ id: 'd2' }] })
    const { result } = renderHook(() => useDishesByCategory('c1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDishesApi.getDishesByCategory).toHaveBeenCalledWith('c1')
  })

  it('is disabled for undefined categoryId', () => {
    const { result } = renderHook(() => useDishesByCategory(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useDishCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches categories and selects .data', async () => {
    mockDishesApi.getDishCategories.mockResolvedValue({ data: [{ id: 'c1', name: 'Zupy' }] })
    const { result } = renderHook(() => useDishCategories(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'c1', name: 'Zupy' }])
  })
})

describe('useCreateDish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates dish', async () => {
    mockDishesApi.createDish.mockResolvedValue({ data: { id: 'new' } })
    const { result } = renderHook(() => useCreateDish(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Bigos' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDishesApi.createDish).toHaveBeenCalledWith({ name: 'Bigos' })
  })
})

describe('useUpdateDish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates dish', async () => {
    mockDishesApi.updateDish.mockResolvedValue({ data: { id: 'd1' } })
    const { result } = renderHook(() => useUpdateDish(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'd1', data: { name: 'Bigos 2' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDishesApi.updateDish).toHaveBeenCalledWith('d1', { name: 'Bigos 2' })
  })
})

describe('useDeleteDish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes dish', async () => {
    mockDishesApi.deleteDish.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteDish(), { wrapper: createWrapper() })
    result.current.mutate('d1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDishesApi.deleteDish).toHaveBeenCalledWith('d1')
  })
})

describe('useDishesByCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('groups dishes by category slug', async () => {
    mockDishesApi.getDishes.mockResolvedValue({
      data: [
        { id: 'd1', name: 'Zupa', category: { slug: 'zupy' } },
        { id: 'd2', name: 'Pierogi', category: { slug: 'dania-glowne' } },
        { id: 'd3', name: 'Rosol', category: { slug: 'zupy' } },
      ],
    })
    const { result } = renderHook(() => useDishesByCategories(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      zupy: [
        { id: 'd1', name: 'Zupa', category: { slug: 'zupy' } },
        { id: 'd3', name: 'Rosol', category: { slug: 'zupy' } },
      ],
      'dania-glowne': [
        { id: 'd2', name: 'Pierogi', category: { slug: 'dania-glowne' } },
      ],
    })
  })
})
