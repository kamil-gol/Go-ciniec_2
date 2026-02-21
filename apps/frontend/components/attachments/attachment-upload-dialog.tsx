'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react'
import {
  attachmentsApi,
  EntityType,
  AttachmentCategory,
  getCategoryLabel,
  getCategoriesForEntity,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/api/attachments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp'

interface AttachmentUploadDialogProps {
  open: boolean
  onClose: () => void
  entityType: EntityType
  entityId: string
  onUploaded: () => void
}

export default function AttachmentUploadDialog({
  open, onClose, entityType, entityId, onUploaded,
}: AttachmentUploadDialogProps) {
  // Dynamic categories based on entity type
  const categories = getCategoriesForEntity(entityType)
  const defaultCategory = categories.find((c) => c.value === 'OTHER')?.value || categories[0]?.value || 'OTHER'

  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<AttachmentCategory>(defaultCategory)
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setCategory(defaultCategory)
    setLabel('')
    setDescription('')
    setDragOver(false)
  }

  const handleClose = () => {
    if (!uploading) {
      reset()
      onClose()
    }
  }

  const validateFile = (f: File): boolean => {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.type)) {
      toast.error(`Niedozwolony typ: ${f.type}. Dozwolone: PDF, JPG, PNG, WebP`)
      return false
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`Plik za duży (${(f.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB`)
      return false
    }
    return true
  }

  const handleFileSelect = (f: File) => {
    if (validateFile(f)) {
      setFile(f)
      if (!label) setLabel(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [label]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    try {
      await attachmentsApi.upload({
        file,
        entityType,
        entityId,
        category,
        label: label || undefined,
        description: description || undefined,
      })
      toast.success('Plik wgrany pomyślnie')
      reset()
      onUploaded()
      onClose()
    } catch {
      // Error handled by apiClient interceptor
    } finally {
      setUploading(false)
    }
  }

  const isImage = file?.type.startsWith('image/')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wgraj załącznik</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all',
                dragOver
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
              )}
            >
              <Upload className={cn(
                'w-10 h-10 transition-colors',
                dragOver ? 'text-violet-500' : 'text-neutral-400'
              )} />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                <span className="font-medium text-violet-600 dark:text-violet-400">Kliknij</span> lub przeciągnij plik
              </p>
              <p className="text-xs text-neutral-400">PDF, JPG, PNG, WebP · max 10 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              {isImage ? (
                <Image className="w-8 h-8 text-green-600" />
              ) : (
                <FileText className="w-8 h-8 text-green-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{file.name}</p>
                <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={() => setFile(null)} className="p-1 text-neutral-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Category — dynamic per entity type */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Kategoria</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  title={cat.description}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    category === cat.value
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-violet-300'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <Label htmlFor="att-label" className="text-sm font-medium mb-1.5 block">
              Etykieta <span className="text-neutral-400 font-normal">(opcjonalnie)</span>
            </Label>
            <Input
              id="att-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="np. Zgoda RODO - Jan Kowalski"
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="att-desc" className="text-sm font-medium mb-1.5 block">
              Opis <span className="text-neutral-400 font-normal">(opcjonalnie)</span>
            </Label>
            <Textarea
              id="att-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dodatkowe informacje..."
              rows={2}
              maxLength={1000}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wgrywanie...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Wgraj plik
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
