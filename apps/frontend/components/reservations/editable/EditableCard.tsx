'use client'

import { useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, X, Save, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditableCardProps {
  /** Card title */
  title: string
  /** Icon element for the card header */
  icon: ReactNode
  /** Gradient classes for the icon background */
  iconGradient?: string
  /** Render function receiving editing state */
  children: (editing: boolean) => ReactNode
  /** Called when user saves changes */
  onSave: (reason: string) => Promise<void>
  /** Called when user cancels editing */
  onCancel?: () => void
  /** Whether to require a reason for the change (default: true) */
  requireReason?: boolean
  /** Minimum reason length (default: 10) */
  minReasonLength?: number
  /** Custom class for the card */
  className?: string
  /** Whether editing is disabled (e.g. for cancelled reservations) */
  disabled?: boolean
  /** Use gradient header style instead of standard header */
  gradientHeader?: boolean
  /** Gradient header classes */
  headerGradient?: string
}

export function EditableCard({
  title,
  icon,
  iconGradient = 'from-blue-500 to-cyan-500',
  children,
  onSave,
  onCancel,
  requireReason = true,
  minReasonLength = 10,
  className = '',
  disabled = false,
  gradientHeader = false,
  headerGradient = '',
}: EditableCardProps) {
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [reasonError, setReasonError] = useState('')

  const handleEdit = useCallback(() => {
    if (disabled) return
    setEditing(true)
    setReason('')
    setReasonError('')
  }, [disabled])

  const handleCancel = useCallback(() => {
    setEditing(false)
    setReason('')
    setReasonError('')
    onCancel?.()
  }, [onCancel])

  const handleSave = useCallback(async () => {
    if (requireReason && reason.trim().length < minReasonLength) {
      setReasonError(`Powód musi mieć co najmniej ${minReasonLength} znaków`)
      return
    }

    setSaving(true)
    setReasonError('')

    try {
      await onSave(reason.trim())
      setEditing(false)
      setReason('')
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'Błąd podczas zapisywania'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }, [onSave, reason, requireReason, minReasonLength])

  // Gradient header variant (used by Client card, Guests card, etc.)
  if (gradientHeader) {
    return (
      <Card className={`border-0 shadow-xl overflow-hidden ${className}`}>
        <div className={`${headerGradient} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${iconGradient} rounded-lg shadow-lg`}>
                {icon}
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            {!editing && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={editing ? 'edit' : 'view'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {children(editing)}
            </motion.div>
          </AnimatePresence>

          {/* Reason + Actions */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6 space-y-3"
              >
                {requireReason && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Powód zmiany
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => {
                            setReason(e.target.value)
                            if (reasonError) setReasonError('')
                          }}
                          className="w-full rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          rows={2}
                          placeholder="np. Klient zmienił liczbę gości po rozmowie telefonicznej"
                        />
                        {reasonError && (
                          <p className="mt-1 text-xs text-red-600">{reasonError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {saving ? 'Zapisywanie...' : 'Zapisz'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    )
  }

  // Standard card with CardHeader/CardContent
  return (
    <Card className={`border-0 shadow-xl ${className}`}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className={`p-2 bg-gradient-to-br ${iconGradient} rounded-lg`}>
              {icon}
            </div>
            {title}
          </CardTitle>
          {!editing && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={editing ? 'edit' : 'view'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {children(editing)}
          </motion.div>
        </AnimatePresence>

        {/* Reason + Actions */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 space-y-3"
            >
              {requireReason && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Powód zmiany
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value)
                          if (reasonError) setReasonError('')
                        }}
                        className="w-full rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        rows={2}
                        placeholder="np. Klient zmienił liczbę gości po rozmowie telefonicznej"
                      />
                      {reasonError && (
                        <p className="mt-1 text-xs text-red-600">{reasonError}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Anuluj
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
