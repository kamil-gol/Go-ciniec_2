'use client'

import { useState, useEffect, useCallback } from 'react'
import { Paperclip, Plus, Filter } from 'lucide-react'
import { attachmentsApi, Attachment, EntityType, AttachmentCategory, getCategoryLabel } from '@/lib/api/attachments'
import AttachmentRow from './attachment-row'
import AttachmentUploadDialog from './attachment-upload-dialog'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const FILTER_OPTIONS: (AttachmentCategory | 'ALL')[] = ['ALL', 'RODO', 'CONTRACT', 'INVOICE', 'PHOTO', 'CORRESPONDENCE', 'OTHER']

interface AttachmentPanelProps {
  entityType: EntityType
  entityId: string
  title?: string
  className?: string
}

export default function AttachmentPanel({
  entityType,
  entityId,
  title = 'Załączniki',
  className,
}: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState<AttachmentCategory | 'ALL'>('ALL')
  const [showArchived, setShowArchived] = useState(false)
  const [hasAny, setHasAny] = useState(false)

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true)
      // Always fetch ALL attachments — filter client-side
      const data = await attachmentsApi.getByEntity(entityType, entityId)
      setAttachments(data)
      if (data.length > 0) setHasAny(true)
    } catch {
      // Handled by apiClient
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    if (entityId) fetchAttachments()
  }, [fetchAttachments, entityId])

  // Client-side filtering by category
  const categoryFiltered = filter === 'ALL'
    ? attachments
    : attachments.filter((a) => a.category === filter)

  const filtered = showArchived
    ? categoryFiltered
    : categoryFiltered.filter((a) => !a.isArchived)

  const archivedCount = attachments.filter((a) => a.isArchived).length
  const totalActive = attachments.filter((a) => !a.isArchived).length

  return (
    <div className={cn('rounded-2xl border border-neutral-200/80 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Paperclip className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {totalActive > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
              {totalActive}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
      </div>

      {/* Filters — always visible once there were any attachments */}
      {hasAny && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-100 dark:border-neutral-700/30 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                filter === opt
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              )}
            >
              {opt === 'ALL' ? 'Wszystkie' : getCategoryLabel(opt)}
            </button>
          ))}
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                'ml-auto px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                showArchived
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              {showArchived ? 'Ukryj archiwum' : `Archiwum (${archivedCount})`}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Paperclip className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {filter !== 'ALL' ? 'Brak załączników w tej kategorii' : 'Brak załączników'}
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              Wgraj pierwszy plik
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((att) => (
                <motion.div
                  key={att.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <AttachmentRow
                    attachment={att}
                    onDeleted={fetchAttachments}
                    onArchived={fetchAttachments}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <AttachmentUploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        entityType={entityType}
        entityId={entityId}
        onUploaded={fetchAttachments}
      />
    </div>
  )
}
