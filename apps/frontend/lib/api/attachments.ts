import { apiClient } from '../api-client'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type EntityType = 'CLIENT' | 'RESERVATION' | 'DEPOSIT'
export type AttachmentCategory = 'RODO' | 'CONTRACT' | 'INVOICE' | 'PHOTO' | 'CORRESPONDENCE' | 'OTHER'

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
// Helpers
// ═══════════════════════════════════════════════════════════════

const CATEGORY_LABELS: Record<AttachmentCategory, string> = {
  RODO: 'RODO',
  CONTRACT: 'Umowa',
  INVOICE: 'Faktura',
  PHOTO: 'Zdjęcie',
  CORRESPONDENCE: 'Korespondencja',
  OTHER: 'Inne',
}

export const getCategoryLabel = (cat: AttachmentCategory) => CATEGORY_LABELS[cat] || cat

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ═══════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════

export const attachmentsApi = {
  getByEntity: async (entityType: EntityType, entityId: string, category?: AttachmentCategory): Promise<Attachment[]> => {
    const params = new URLSearchParams({ entityType, entityId })
    if (category) params.set('category', category)
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
