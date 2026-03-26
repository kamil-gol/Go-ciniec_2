/**
 * useDocumentTemplates Hook Tests
 *
 * Testy szablonów dokumentów:
 * - Pobranie listy szablonów (z kategorią / bez)
 * - Pobranie pojedynczego szablonu
 * - Historia szablonu
 * - Tworzenie, aktualizacja, usuwanie, przywracanie
 * - Podgląd szablonu z zmiennymi
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  api: mockApi,
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  useDocumentTemplates,
  useDocumentTemplate,
  useTemplateHistory,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useRestoreTemplate,
  usePreviewTemplate,
} from '@/hooks/use-document-templates'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ═══ Queries ═══

describe('useDocumentTemplates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches templates without category', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 't1', slug: 'invoice' }] } })
    const { result } = renderHook(() => useDocumentTemplates(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/document-templates')
    expect(result.current.data).toEqual([{ id: 't1', slug: 'invoice' }])
  })

  it('passes category param', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } })
    renderHook(() => useDocumentTemplates('EMAIL' as any), { wrapper: createWrapper() })
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith('/document-templates?category=EMAIL'))
  })
})

describe('useDocumentTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches template by slug', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { slug: 'invoice', name: 'Faktura' } } })
    const { result } = renderHook(() => useDocumentTemplate('invoice'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ slug: 'invoice', name: 'Faktura' })
  })

  it('is disabled for empty slug', () => {
    const { result } = renderHook(() => useDocumentTemplate(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useTemplateHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches history with pagination', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { items: [{ id: 'h1', version: 2 }], total: 5, page: 1, limit: 10, totalPages: 1 } },
    })
    const { result } = renderHook(() => useTemplateHistory('invoice', 1, 10), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/document-templates/invoice/history?page=1&limit=10')
  })

  it('is disabled for empty slug', () => {
    const { result } = renderHook(() => useTemplateHistory(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ═══ Mutations ═══

describe('useCreateTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts new template', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { slug: 'new', name: 'Nowy' } } })
    const { result } = renderHook(() => useCreateTemplate(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Nowy', slug: 'new', content: '# Hello' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/document-templates', expect.objectContaining({ name: 'Nowy' }))
  })
})

describe('useUpdateTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('puts updated template', async () => {
    mockApi.put.mockResolvedValue({ data: { data: { slug: 'invoice', version: 3, name: 'Faktura' } } })
    const { result } = renderHook(() => useUpdateTemplate(), { wrapper: createWrapper() })
    result.current.mutate({ slug: 'invoice', data: { content: '# Updated' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/document-templates/invoice', { content: '# Updated' })
  })
})

describe('useDeleteTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes template', async () => {
    mockApi.delete.mockResolvedValue({ data: { data: { deleted: true, slug: 'old', name: 'Stary' } } })
    const { result } = renderHook(() => useDeleteTemplate(), { wrapper: createWrapper() })
    result.current.mutate('old')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/document-templates/old')
  })
})

describe('useRestoreTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('restores historical version', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { slug: 'invoice', version: 4, name: 'Faktura' } } })
    const { result } = renderHook(() => useRestoreTemplate(), { wrapper: createWrapper() })
    result.current.mutate({ slug: 'invoice', version: 2 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/document-templates/invoice/restore/2')
  })
})

describe('usePreviewTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('previews template with variables', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { html: '<p>Preview</p>' } } })
    const { result } = renderHook(() => usePreviewTemplate(), { wrapper: createWrapper() })
    result.current.mutate({ slug: 'invoice', variables: { name: 'Jan' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/document-templates/invoice/preview', { variables: { name: 'Jan' } })
  })
})
