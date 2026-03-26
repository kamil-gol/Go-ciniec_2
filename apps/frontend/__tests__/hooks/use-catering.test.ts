import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/api', () => ({
  api: mockApi,
}))

import {
  useCateringTemplates,
  useCateringTemplate,
  useCreateCateringTemplate,
  useUpdateCateringTemplate,
  useDeleteCateringTemplate,
  useCreateCateringPackage,
  useUpdateCateringPackage,
  useDeleteCateringPackage,
  useCreateCateringSection,
  useDeleteCateringSection,
  useAddSectionOption,
  useRemoveSectionOption,
  useReorderCateringSections,
  useReorderSectionOptions,
} from '@/hooks/use-catering'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCateringTemplates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches templates', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 't1', name: 'Standard' }] } })
    const { result } = renderHook(() => useCateringTemplates(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 't1', name: 'Standard' }])
  })

  it('passes includeInactive param', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } })
    renderHook(() => useCateringTemplates(true), { wrapper: createWrapper() })
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith('/catering/templates?includeInactive=true'))
  })
})

describe('useCateringTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single template', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { id: 't1' } } })
    const { result } = renderHook(() => useCateringTemplate('t1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 't1' })
  })

  it('is disabled for empty id', () => {
    const { result } = renderHook(() => useCateringTemplate(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateCateringTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts new template', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'new' } } })
    const { result } = renderHook(() => useCreateCateringTemplate(), { wrapper: createWrapper() })

    result.current.mutate({ name: 'Test', description: '' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/catering/templates', expect.any(Object))
  })
})

describe('useUpdateCateringTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches template', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 't1' } } })
    const { result } = renderHook(() => useUpdateCateringTemplate(), { wrapper: createWrapper() })

    result.current.mutate({ id: 't1', data: { name: 'Updated' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/templates/t1', { name: 'Updated' })
  })
})

describe('useDeleteCateringTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes template', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCateringTemplate(), { wrapper: createWrapper() })

    result.current.mutate('t1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/catering/templates/t1')
  })
})

describe('useCreateCateringPackage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts package under template', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'p1' } } })
    const { result } = renderHook(() => useCreateCateringPackage('t1'), { wrapper: createWrapper() })

    result.current.mutate({ name: 'Gold' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/catering/templates/t1/packages', { name: 'Gold' })
  })
})

describe('useUpdateCateringPackage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches package', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'p1' } } })
    const { result } = renderHook(() => useUpdateCateringPackage('t1'), { wrapper: createWrapper() })

    result.current.mutate({ packageId: 'p1', data: { name: 'Silver' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/templates/t1/packages/p1', { name: 'Silver' })
  })
})

describe('useDeleteCateringPackage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes package', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCateringPackage('t1'), { wrapper: createWrapper() })

    result.current.mutate('p1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/catering/templates/t1/packages/p1')
  })
})

describe('useCreateCateringSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts section under package', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 's1' } } })
    const { result } = renderHook(() => useCreateCateringSection('p1', 't1'), { wrapper: createWrapper() })

    result.current.mutate({ name: 'Appetizers' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/catering/packages/p1/sections', { name: 'Appetizers' })
  })
})

describe('useDeleteCateringSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes section', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCateringSection('t1'), { wrapper: createWrapper() })

    result.current.mutate('s1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/catering/sections/s1')
  })
})

describe('useAddSectionOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts option under section', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'o1' } } })
    const { result } = renderHook(() => useAddSectionOption('s1', 't1'), { wrapper: createWrapper() })

    result.current.mutate({ name: 'Soup' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/catering/sections/s1/options', { name: 'Soup' })
  })
})

describe('useRemoveSectionOption', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes option', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useRemoveSectionOption('t1'), { wrapper: createWrapper() })

    result.current.mutate('o1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/catering/options/o1')
  })
})

describe('useReorderCateringSections', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches displayOrder on section', async () => {
    mockApi.patch.mockResolvedValue({})
    const { result } = renderHook(() => useReorderCateringSections('t1'), { wrapper: createWrapper() })

    result.current.mutate({ sectionId: 's1', displayOrder: 3 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/sections/s1', { displayOrder: 3 })
  })
})

describe('useReorderSectionOptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches displayOrder on option', async () => {
    mockApi.patch.mockResolvedValue({})
    const { result } = renderHook(() => useReorderSectionOptions('t1'), { wrapper: createWrapper() })

    result.current.mutate({ optionId: 'o1', displayOrder: 2 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/options/o1', { displayOrder: 2 })
  })
})
