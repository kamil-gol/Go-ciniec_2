'use client'

import { Trash2, Archive, ArchiveRestore, Download, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/shared/SectionCard'

interface QuickActionsCardProps {
  isArchived: boolean
  isCancellable: boolean
  isReadOnly: boolean
  downloading: boolean
  archivePending: boolean
  unarchivePending: boolean
  cancelPending: boolean
  onDownloadPDF: () => void
  onArchive: () => void
  onUnarchive: () => void
  onCancel: () => void
}

export function QuickActionsCard({
  isArchived,
  isCancellable,
  isReadOnly,
  downloading,
  archivePending,
  unarchivePending,
  cancelPending,
  onDownloadPDF,
  onArchive,
  onUnarchive,
  onCancel,
}: QuickActionsCardProps) {
  return (
    <SectionCard
      variant="gradient"
      title="Szybkie akcje"
      icon={<Zap className="h-5 w-5 text-white" />}
      iconGradient="from-amber-500 to-orange-500"
      headerGradient="from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30"
      headerSpacing="mb-4"
    >
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          size="lg"
          onClick={onDownloadPDF}
          disabled={downloading}
        >
          <Download className="mr-2 h-4 w-4 flex-shrink-0" />
          {downloading ? 'Pobieranie...' : 'Pobierz PDF'}
        </Button>

        {!isArchived ? (
          <Button
            variant="outline"
            className="w-full justify-start text-neutral-600 hover:text-neutral-700"
            size="lg"
            disabled={archivePending || isReadOnly}
            onClick={onArchive}
          >
            <Archive className="mr-2 h-4 w-4 flex-shrink-0" />
            {archivePending ? 'Archiwizowanie...' : 'Zarchiwizuj rezerwacje'}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-green-600 hover:text-green-700"
            size="lg"
            disabled={unarchivePending}
            onClick={onUnarchive}
          >
            <ArchiveRestore className="mr-2 h-4 w-4 flex-shrink-0" />
            {unarchivePending ? 'Przywracanie...' : 'Przywroc z archiwum'}
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700"
          size="lg"
          disabled={!isCancellable || cancelPending || isReadOnly}
          onClick={onCancel}
        >
          <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
          {cancelPending ? 'Anulowanie...' : 'Anuluj rezerwacje'}
        </Button>
      </div>
    </SectionCard>
  )
}
