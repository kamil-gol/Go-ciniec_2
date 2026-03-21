'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Attachment, formatFileSize, attachmentsApi } from '@/lib/api/attachments'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface AttachmentPreviewProps {
  attachment: Attachment | null
  open: boolean
  onClose: () => void
}

export default function AttachmentPreview({ attachment, open, onClose }: AttachmentPreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const prevUrlRef = useRef<string | null>(null)

  const isImage = attachment?.mimeType.startsWith('image/')
  const isPdf = attachment?.mimeType === 'application/pdf'

  useEffect(() => {
    // Cleanup previous blob URL
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }

    if (!attachment || !open) {
      setBlobUrl(null)
      return
    }

    setLoading(true)
    setZoom(1)
    setRotation(0)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
    const url = `${API_URL}/attachments/${attachment.id}/download?token=${token}`

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.blob()
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob)
        prevUrlRef.current = objectUrl
        setBlobUrl(objectUrl)
      })
      .catch(() => setBlobUrl(null))
      .finally(() => setLoading(false))

    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = null
      }
    }
  }, [attachment?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!attachment) return null

  const handleDownload = () => {
    attachmentsApi.download(attachment.id, attachment.originalName)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col bg-neutral-900 border-neutral-700 gap-0">
        <DialogTitle className="sr-only">Podgląd: {attachment.originalName}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-white truncate">
              {attachment.originalName}
            </span>
            <span className="text-xs text-neutral-400 flex-shrink-0">
              {formatFileSize(attachment.sizeBytes)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  title="Powiększ"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  title="Pomniejsz"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  title="Obróć"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              title="Pobierz"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              title="Zamknij"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-900/50">
          {loading ? (
            <div className="w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          ) : !blobUrl ? (
            <p className="text-neutral-400 text-sm">Nie udało się załadować podglądu</p>
          ) : isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, not optimizable by next/image */
            <img
              src={blobUrl}
              alt={attachment.originalName}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable={false}
            />
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={attachment.originalName}
            />
          ) : (
            <p className="text-neutral-400 text-sm">
              Podgląd niedostępny dla tego typu pliku
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
