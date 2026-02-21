import { apiClient } from '../api-client'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type EntityType = 'CLIENT' | 'RESERVATION' | 'DEPOSIT'

export type AttachmentCategory =
  | 'RODO'
  | 'CONTRACT'
  | 'ANNEX'
  | 'POST_EVENT'
  | 'CORRESPONDENCE'
  | 'PAYMENT_PROOF'
  | 'INVOICE'
  | 'REFUND_PROOF'
  | 'OTHER'

export interface Attachment {
  id: string
  entityType: EntityType
  entityId: string
  category: AttachmentCategory
  label: string | null
  originalName: string
  storedName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  uploadedById: string
  description: string | null
  isArchived: boolean
  version: number
  createdAt: string
  updatedAt: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
  }
  /** True when the attachment belongs to the client (cross-referenced from reservation/deposit) */
  _fromClient?: boolean
}

export interface UploadAttachmentInput {
  file: File
  entityType: EntityType
  entityId: string
  category: AttachmentCategory
  label?: string
  description?: string
}

export interface UpdateAttachmentInput {
  label?: string
  description?: string
  category?: AttachmentCategory
}

// ═══════════════════════════════════════════════════════════════
// Category Definitions (synced with backend attachmentCategories.ts)
// ═══════════════════════════════════════════════════════════════

export interface AttachmentCategoryDef {
  value: AttachmentCategory
  label: string
  description?: string
}

export const ATTACHMENT_CATEGORIES: Record<EntityType, AttachmentCategoryDef[]> = {
  CLIENT: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda na przetwarzanie danych osobowych' },
    { value: 'CORRESPONDENCE', label: 'Korespondencja', description: 'Skany ustaleń mailowych, SMS, screenshots' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty klienta' },
  ],
  RESERVATION: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda RODO' },
    { value: 'CONTRACT', label: 'Umowa', description: 'Podpisana umowa rezerwacji' },
    { value: 'ANNEX', label: 'Aneks', description: 'Aneks do umowy (zmiana warunków)' },
    { value: 'POST_EVENT', label: 'Dok. powykonawcza', description: 'Protokół zdania sali, zdjęcia' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty rezerwacji' },
  ],
  DEPOSIT: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda RODO' },
    { value: 'PAYMENT_PROOF', label: 'Potw. przelewu', description: 'Skan/screenshot operacji bankowej' },
    { value: 'INVOICE', label: 'Faktura zaliczkowa', description: 'Faktura VAT za wpłaconą zaliczkę' },
    { value: 'REFUND_PROOF', label: 'Potw. zwrotu', description: 'Dokument potwierdzający zwrot' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty zaliczki' },
  ],
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const CATEGORY_LABELS: Record<string, string> = {
  RODO: 'RODO',
  CONTRACT: 'Umowa',
  ANNEX: 'Aneks',
  POST_EVENT: 'Dok. powykonawcza',
  CORRESPONDENCE: 'Korespondencja',
  PAYMENT_PROOF: 'Potw. przelewu',
  INVOICE: 'Faktura',
  REFUND_PROOF: 'Potw. zwrotu',
  OTHER: 'Inne',
}

export const getCategoryLabel = (cat: string) => CATEGORY_LABELS[cat] || cat

export const getCategoriesForEntity = (entityType: EntityType): AttachmentCategoryDef[] => {
  return ATTACHMENT_CATEGORIES[entityType] || []
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// ═══════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════

export const attachmentsApi = {
  /**
   * Get attachments for an entity.
   * When withClientRodo=true and entityType is RESERVATION/DEPOSIT,
   * also includes RODO attachments from the linked client.
   */
  getByEntity: async (
    entityType: EntityType,
    entityId: string,
    category?: AttachmentCategory,
    withClientRodo?: boolean,
  ): Promise<Attachment[]> => {
    const params = new URLSearchParams({ entityType, entityId })
    if (category) params.set('category', category)
    if (withClientRodo && entityType !== 'CLIENT') {
      params.set('withClientRodo', 'true')
    }
    const response = await apiClient.get(`/attachments?${params}`)
    return response.data.data
  },

  upload: async (input: UploadAttachmentInput): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('file', input.file)
    formData.append('entityType', input.entityType)
    formData.append('entityId', input.entityId)
    formData.append('category', input.category)
    if (input.label) formData.append('label', input.label)
    if (input.description) formData.append('description', input.description)

    const response = await apiClient.post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  update: async (id: string, data: UpdateAttachmentInput): Promise<Attachment> => {
    const response = await apiClient.patch(`/attachments/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/attachments/${id}`)
  },

  archive: async (id: string): Promise<Attachment> => {
    const response = await apiClient.patch(`/attachments/${id}/archive`)
    return response.data.data
  },

  download: async (id: string, originalName: string): Promise<void> => {
    const response = await apiClient.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}

// ═══════════════════════════════════════════════════════════════
// Batch Operations (used by list pages)
// ═══════════════════════════════════════════════════════════════

/**
 * Batch check RODO status for multiple clients.
 * Returns a map: clientId -> hasRodo (boolean)
 */
export const batchCheckRodo = async (clientIds: string[]): Promise<Record<string, boolean>> => {
  const response = await apiClient.post('/attachments/batch-check-rodo', { clientIds })
  return response.data.data
}

/**
 * Batch check contract status for multiple reservations.
 * Returns a map: reservationId -> hasContract (boolean)
 */
export const batchCheckContract = async (reservationIds: string[]): Promise<Record<string, boolean>> => {
  const response = await apiClient.post('/attachments/batch-check-contract', { reservationIds })
  return response.data.data
}
