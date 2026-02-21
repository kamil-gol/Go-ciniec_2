'use client'

import { Attachment, getCategoryLabel, formatFileSize, attachmentsApi } from '@/lib/api/attachments'
import { FileText, Image, Download, Trash2, Archive, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AttachmentRowProps {
  attachment: Attachment
  onDeleted: () => void
  onArchived: () => void
  onPreview?: () => void
}

const MIME_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/webp': Image,
}

const CATEGORY_COLORS: Record<string, string> = {
  RODO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONTRACT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ANNEX: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  POST_EVENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CORRESPONDENCE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAYMENT_PROOF: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INVOICE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REFUND_PROOF: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  OTHER: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
}

export default function AttachmentRow({ attachment, onDeleted, onArchived, onPreview }: AttachmentRowProps) {
  const Icon = MIME_ICONS[attachment.mimeType] || FileText
  const isImage = attachment.mimeType.startsWith('image/')
  const canPreview = isImage || attachment.mimeType === 'application/pdf'

  const handleDownload = async () => {
    try {
      await attachmentsApi.download(attachment.id, attachment.originalName)
      toast.success('Pobrano plik')
    } catch {
      toast.error('Nie udało się pobrać pliku')
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview()
    } else {
      // Fallback: open in new tab
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
      window.open(`${API_URL}/attachments/${attachment.id}/download?token=${token}`, '_blank')
    }
  }

  const handleArchive = async () => {
    try {
      await attachmentsApi.archive(attachment.id)
      toast.success('Plik zarchiwizowany')
      onArchived()
    } catch {
      toast.error('Nie udało się zarchiwizować')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Usunąć plik "${attachment.originalName}"?`)) return
    try {
      await attachmentsApi.delete(attachment.id)
      toast.success('Plik usunięty')
      onDeleted()
    } catch {
      toast.error('Nie udało się usunąć pliku')
    }
  }

  return (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm',
      attachment.isArchived
        ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/50 dark:border-neutral-700/30 opacity-60'
        : 'bg-white dark:bg-neutral-800/80 border-neutral-200/80 dark:border-neutral-700/50 hover:border-violet-300 dark:hover:border-violet-600'
    )}>
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
        isImage ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
      )}>
        <Icon className={cn(
          'w-5 h-5',
          isImage ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {attachment.label || attachment.originalName}
          </span>
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0',
            CATEGORY_COLORS[attachment.category] || CATEGORY_COLORS.OTHER
          )}>
            {getCategoryLabel(attachment.category)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="truncate">{attachment.originalName}</span>
          <span>·</span>
          <span className="flex-shrink-0">{formatFileSize(attachment.sizeBytes)}</span>
          <span>·</span>
          <span className="flex-shrink-0">{attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}</span>
          <span>·</span>
          <span className="flex-shrink-0">{format(new Date(attachment.createdAt), 'd MMM yyyy', { locale: pl })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {canPreview && (
          <button
            onClick={handlePreview}
            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            title="Podgląd"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Pobierz"
        >
          <Download className="w-4 h-4" />
        </button>
        {!attachment.isArchived && (
          <button
            onClick={handleArchive}
            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="Archiwizuj"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
          title="Usuń"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
