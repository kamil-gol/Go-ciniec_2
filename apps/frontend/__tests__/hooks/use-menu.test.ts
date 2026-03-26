import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Mocks ──────────────────────────────────────────────────
const { mockMenuApi } = vi.hoisted(() => ({
  mockMenuApi: {
    getTemplates: vi.fn(),
    getTemplate: vi.fn(),
    getActiveTemplate: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    getPackages: vi.fn(),
    getPackage: vi.fn(),
    getPackageCategories: vi.fn(),
    createPackage: vi.fn(),
    updatePackage: vi.fn(),
    deletePackage: vi.fn(),
    getOptions: vi.fn(),
    getOption: vi.fn(),
    createOption: vi.fn(),
    updateOption: vi.fn(),
    deleteOption: vi.fn(),
    getReservationMenu: vi.fn(),
    selectMenu: vi.fn(),
    updateMenu: vi.fn(),
    removeMenu: vi.fn(),
    updateGuestCounts: vi.fn(),
  },
}))

vi.mock('@/lib/api/menu-api', () => ({
  menuApi: mockMenuApi,
}))

import {
  menuKeys,
  useMenuTemplates,
  useMenuTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useMenuPackages,
  useMenuOptions,
  useCreateOption,
  useDeleteOption,
  useReservationMenu,
  useSelectMenu,
  useDeleteReservationMenu,
  useUpdateGuestCounts,
  useHasReservationMenu,
} from '@/hooks/use-menu'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('menuKeys', () => {
  it('generates correct key hierarchy', () => {
    expect(menuKeys.all).toEqual(['menu'])
    expect(menuKeys.templates()).toEqual(['menu', 'templates'])
    expect(menuKeys.template('t1')).toEqual(['menu', 'templates', 't1'])
    expect(menuKeys.packages('t1')).toEqual(['menu', 'packages', 't1'])
    expect(menuKeys.options()).toEqual(['menu', 'options'])
    expect(menuKeys.option('o1')).toEqual(['menu', 'options', 'o1'])
    expect(menuKeys.reservationMenu('r1')).toEqual(['menu', 'reservation', 'r1'])
  })
})

describe('useMenuTemplates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches templates and selects .data', async () => {
    mockMenuApi.getTemplates.mockResolvedValue({ data: [{ id: 't1' }] })
    const { result } = renderHook(() => useMenuTemplates(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 't1' }])
  })
})

describe('useMenuTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useMenuTemplate(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches template by id', async () => {
    mockMenuApi.getTemplate.mockResolvedValue({ data: { id: 't1', name: 'Test' } })
    const { result } = renderHook(() => useMenuTemplate('t1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 't1', name: 'Test' })
  })
})

describe('useCreateTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls createTemplate', async () => {
    mockMenuApi.createTemplate.mockResolvedValue({ data: { id: 'new' } })
    const { result } = renderHook(() => useCreateTemplate(), { wrapper: createWrapper() })

    result.current.mutate({ name: 'New' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMenuApi.createTemplate).toHaveBeenCalled()
  })
})

describe('useDeleteTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls deleteTemplate', async () => {
    mockMenuApi.deleteTemplate.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteTemplate(), { wrapper: createWrapper() })

    result.current.mutate('t1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMenuApi.deleteTemplate).toHaveBeenCalledWith('t1')
  })
})

describe('useMenuPackages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled when templateId is null', () => {
    const { result } = renderHook(() => useMenuPackages(null), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches packages for template', async () => {
    mockMenuApi.getPackages.mockResolvedValue({ data: [{ id: 'p1' }] })
    const { result } = renderHook(() => useMenuPackages('t1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'p1' }])
  })
})

describe('useMenuOptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches options and selects .data', async () => {
    mockMenuApi.getOptions.mockResolvedValue({ data: [{ id: 'o1' }] })
    const { result } = renderHook(() => useMenuOptions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'o1' }])
  })
})

describe('useCreateOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls createOption', async () => {
    mockMenuApi.createOption.mockResolvedValue({ data: { id: 'o2' } })
    const { result } = renderHook(() => useCreateOption(), { wrapper: createWrapper() })

    result.current.mutate({ name: 'Opt' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls deleteOption', async () => {
    mockMenuApi.deleteOption.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteOption(), { wrapper: createWrapper() })

    result.current.mutate('o1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useReservationMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled when reservationId is undefined', () => {
    const { result } = renderHook(() => useReservationMenu(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns null on 404', async () => {
    mockMenuApi.getReservationMenu.mockRejectedValue({
      response: { status: 404 },
    })
    const { result } = renderHook(() => useReservationMenu('r1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('fetches menu and selects .data', async () => {
    mockMenuApi.getReservationMenu.mockResolvedValue({ data: { snapshot: { id: 's1' } } })
    const { result } = renderHook(() => useReservationMenu('r1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ snapshot: { id: 's1' } })
  })
})

describe('useSelectMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls selectMenu', async () => {
    mockMenuApi.selectMenu.mockResolvedValue({ data: {} })
    const { result } = renderHook(() => useSelectMenu(), { wrapper: createWrapper() })

    result.current.mutate({ reservationId: 'r1', selection: {} as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMenuApi.selectMenu).toHaveBeenCalledWith('r1', {})
  })
})

describe('useDeleteReservationMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls removeMenu', async () => {
    mockMenuApi.removeMenu.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteReservationMenu(), { wrapper: createWrapper() })

    result.current.mutate('r1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMenuApi.removeMenu).toHaveBeenCalledWith('r1')
  })
})

describe('useUpdateGuestCounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls updateGuestCounts', async () => {
    mockMenuApi.updateGuestCounts.mockResolvedValue({})
    const { result } = renderHook(() => useUpdateGuestCounts(), { wrapper: createWrapper() })

    result.current.mutate({
      reservationId: 'r1',
      counts: { adultsCount: 50, childrenCount: 10, toddlersCount: 5 },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMenuApi.updateGuestCounts).toHaveBeenCalledWith('r1', {
      adultsCount: 50,
      childrenCount: 10,
      toddlersCount: 5,
    })
  })
})

describe('useHasReservationMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hasMenu=false when no snapshot', async () => {
    mockMenuApi.getReservationMenu.mockResolvedValue({ data: null })
    const { result } = renderHook(() => useHasReservationMenu('r1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasMenu).toBe(false)
  })
})
