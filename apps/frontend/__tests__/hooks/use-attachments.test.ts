import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockAttachmentsApi, mockBatchCheckRodo, mockBatchCheckContract } = vi.hoisted(() => ({
  mockAttachmentsApi: {
    getByEntity: vi.fn(),
    upload: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    archive: vi.fn(),
  },
  mockBatchCheckRodo: vi.fn(),
  mockBatchCheckContract: vi.fn(),
}))

vi.mock('@/lib/api/attachments', () => ({
  attachmentsApi: mockAttachmentsApi,
  batchCheckRodo: (...a: any[]) => mockBatchCheckRodo(...a),
  batchCheckContract: (...a: any[]) => mockBatchCheckContract(...a),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  attachmentKeys,
  useAttachments,
  useBatchCheckRodo,
  useBatchCheckContract,
  useUploadAttachment,
  useUpdateAttachment,
  useDeleteAttachment,
  useArchiveAttachment,
} from '@/hooks/use-attachments'
import { toast } from 'sonner'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('attachmentKeys', () => {
  it('generates correct keys', () => {
    expect(attachmentKeys.all).toEqual(['attachments'])
    expect(attachmentKeys.byEntity('RESERVATION', 'r1')).toEqual(['attachments', 'RESERVATION', 'r1', undefined])
    expect(attachmentKeys.byEntity('CLIENT', 'c1', 'RODO')).toEqual(['attachments', 'CLIENT', 'c1', 'RODO'])
    expect(attachmentKeys.batchRodo(['c1', 'c2'])).toEqual(['attachments', 'batch-rodo', ['c1', 'c2']])
  })
})

describe('useAttachments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches attachments for entity', async () => {
    mockAttachmentsApi.getByEntity.mockResolvedValue([{ id: 'a1' }])
    const { result } = renderHook(
      () => useAttachments('RESERVATION', 'r1'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'a1' }])
    // withClientRodo should be true for RESERVATION
    expect(mockAttachmentsApi.getByEntity).toHaveBeenCalledWith('RESERVATION', 'r1', undefined, true)
  })

  it('passes withClientRodo=false for CLIENT', async () => {
    mockAttachmentsApi.getByEntity.mockResolvedValue([])
    renderHook(() => useAttachments('CLIENT', 'c1'), { wrapper: createWrapper() })
    await waitFor(() => expect(mockAttachmentsApi.getByEntity).toHaveBeenCalledWith('CLIENT', 'c1', undefined, false))
  })

  it('is disabled for empty entityId', () => {
    const { result } = renderHook(
      () => useAttachments('RESERVATION', ''),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useBatchCheckRodo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches batch RODO status', async () => {
    mockBatchCheckRodo.mockResolvedValue({ c1: true, c2: false })
    const { result } = renderHook(
      () => useBatchCheckRodo(['c1', 'c2']),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ c1: true, c2: false })
  })

  it('is disabled for empty array', () => {
    const { result } = renderHook(() => useBatchCheckRodo([]), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useBatchCheckContract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches batch contract status', async () => {
    mockBatchCheckContract.mockResolvedValue({ r1: true })
    const { result } = renderHook(
      () => useBatchCheckContract(['r1']),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ r1: true })
  })
})

describe('useUploadAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads and shows success toast', async () => {
    mockAttachmentsApi.upload.mockResolvedValue({ id: 'a1' })
    const { result } = renderHook(
      () => useUploadAttachment('RESERVATION', 'r1'),
      { wrapper: createWrapper() }
    )

    result.current.mutate({ file: new File([], 'test.pdf') } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Plik wgrany pomyślnie')
  })
})

describe('useUpdateAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates and shows success toast', async () => {
    mockAttachmentsApi.update.mockResolvedValue({})
    const { result } = renderHook(
      () => useUpdateAttachment('RESERVATION', 'r1'),
      { wrapper: createWrapper() }
    )

    result.current.mutate({ id: 'a1', data: { description: 'Updated' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Załącznik zaktualizowany')
  })
})

describe('useDeleteAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes and shows success toast', async () => {
    mockAttachmentsApi.delete.mockResolvedValue({})
    const { result } = renderHook(
      () => useDeleteAttachment('RESERVATION', 'r1'),
      { wrapper: createWrapper() }
    )

    result.current.mutate('a1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Plik usunięty')
  })
})

describe('useArchiveAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('archives and shows success toast', async () => {
    mockAttachmentsApi.archive.mockResolvedValue({})
    const { result } = renderHook(
      () => useArchiveAttachment('RESERVATION', 'r1'),
      { wrapper: createWrapper() }
    )

    result.current.mutate('a1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Plik zarchiwizowany')
  })
})
