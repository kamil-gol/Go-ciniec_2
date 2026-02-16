// apps/frontend/hooks/use-attachments.ts

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import {
  attachmentsApi,
  Attachment,
  EntityType,
  AttachmentCategory,
  UploadAttachmentInput,
  UpdateAttachmentInput,
  batchCheckRodo,
  batchCheckContract,
} from '@/lib/api/attachments'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════
// Query Keys
// ═══════════════════════════════════════════════════════════════

export const attachmentKeys = {
  all: ['attachments'] as const,
  byEntity: (entityType: EntityType, entityId: string, category?: AttachmentCategory) =>
    ['attachments', entityType, entityId, category] as const,
  batchRodo: (clientIds: string[]) => ['attachments', 'batch-rodo', clientIds] as const,
  batchContract: (reservationIds: string[]) => ['attachments', 'batch-contract', reservationIds] as const,
}

// ═══════════════════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch attachments for an entity.
 * Automatically includes cross-referenced client RODO for RESERVATION/DEPOSIT.
 */
export function useAttachments(
  entityType: EntityType,
  entityId: string,
  category?: AttachmentCategory
): UseQueryResult<Attachment[]> {
  const withClientRodo = entityType !== 'CLIENT'
  return useQuery({
    queryKey: attachmentKeys.byEntity(entityType, entityId, category),
    queryFn: () => attachmentsApi.getByEntity(entityType, entityId, category, withClientRodo),
    enabled: !!entityId,
    staleTime: 30_000,
  })
}

/**
 * Batch check RODO status for multiple clients.
 * Returns Record<clientId, hasRodo>
 */
export function useBatchCheckRodo(clientIds: string[]) {
  return useQuery({
    queryKey: attachmentKeys.batchRodo(clientIds),
    queryFn: () => batchCheckRodo(clientIds),
    enabled: clientIds.length > 0,
    staleTime: 60_000,
  })
}

/**
 * Batch check contract status for multiple reservations.
 * Returns Record<reservationId, hasContract>
 */
export function useBatchCheckContract(reservationIds: string[]) {
  return useQuery({
    queryKey: attachmentKeys.batchContract(reservationIds),
    queryFn: () => batchCheckContract(reservationIds),
    enabled: reservationIds.length > 0,
    staleTime: 60_000,
  })
}

// ═══════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════

export function useUploadAttachment(entityType: EntityType, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UploadAttachmentInput) => attachmentsApi.upload(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byEntity(entityType, entityId) })
      toast.success('Plik wgrany pomyślnie')
    },
  })
}

export function useUpdateAttachment(entityType: EntityType, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttachmentInput }) =>
      attachmentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byEntity(entityType, entityId) })
      toast.success('Załącznik zaktualizowany')
    },
  })
}

export function useDeleteAttachment(entityType: EntityType, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => attachmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byEntity(entityType, entityId) })
      toast.success('Plik usunięty')
    },
  })
}

export function useArchiveAttachment(entityType: EntityType, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => attachmentsApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byEntity(entityType, entityId) })
      toast.success('Plik zarchiwizowany')
    },
  })
}
