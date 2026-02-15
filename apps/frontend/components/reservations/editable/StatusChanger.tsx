'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CheckCircle2, XCircle, Clock, Edit, Loader2, AlertCircle,
  ArrowRight, ShieldAlert,
} from 'lucide-react'
import { useUpdateReservationStatus } from '@/lib/api/reservations'
import { ReservationStatus } from '@/types'
import { toast } from 'sonner'

const STATUS_CONFIG = {
  PENDING: {
    label: 'Oczekująca',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Potwierdzona',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Anulowana',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: XCircle,
  },
  COMPLETED: {
    label: 'Zakończona',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: CheckCircle2,
  },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const STATUS_TRANSITIONS: Record<StatusKey, StatusKey[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const DANGEROUS_TRANSITIONS: Array<`${StatusKey}->${StatusKey}`> = [
  'CONFIRMED->CANCELLED',
  'PENDING->CANCELLED',
]

interface StatusChangerProps {
  reservationId: string
  currentStatus: ReservationStatus
  onStatusChanged?: () => void
}

export function StatusChanger({
  reservationId,
  currentStatus,
  onStatusChanged,
}: StatusChangerProps) {
  const [editing, setEditing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | ''>(currentStatus as StatusKey)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const updateStatusMutation = useUpdateReservationStatus()

  const statusKey = currentStatus as StatusKey
  const config = STATUS_CONFIG[statusKey]
  const StatusIcon = config?.icon || Clock
  const allowedTransitions = STATUS_TRANSITIONS[statusKey] || []
  const isTerminal = allowedTransitions.length === 0

  const handleStatusSelect = useCallback((value: string) => {
    setSelectedStatus(value as StatusKey)
  }, [])

  const handleStartChange = useCallback(() => {
    if (!selectedStatus || selectedStatus === currentStatus) return

    if (reason.trim().length < 10) {
      setReasonError('Powód musi mieć co najmniej 10 znaków')
      return
    }

    setReasonError('')

    const transitionKey = `${currentStatus}->${selectedStatus}` as `${StatusKey}->${StatusKey}`
    if (DANGEROUS_TRANSITIONS.includes(transitionKey)) {
      setShowConfirmDialog(true)
    } else {
      executeStatusChange()
    }
  }, [selectedStatus, currentStatus, reason])

  const executeStatusChange = useCallback(async () => {
    if (!selectedStatus || selectedStatus === currentStatus) return

    const oldLabel = STATUS_CONFIG[statusKey]?.label || currentStatus
    const newLabel = STATUS_CONFIG[selectedStatus]?.label || selectedStatus

    try {
      await updateStatusMutation.mutateAsync({
        id: reservationId,
        status: selectedStatus as ReservationStatus,
        reason: `Zmiana statusu z ${oldLabel} na ${newLabel}: ${reason.trim()}`,
      })

      toast.success(`Status zmieniony na: ${newLabel}`)
      setEditing(false)
      setReason('')
      setSelectedStatus(selectedStatus)
      onStatusChanged?.()
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'Błąd zmiany statusu'
      toast.error(msg)
    }
  }, [selectedStatus, currentStatus, statusKey, reason, reservationId, updateStatusMutation, onStatusChanged])

  const handleCancel = useCallback(() => {
    setEditing(false)
    setSelectedStatus(currentStatus as StatusKey)
    setReason('')
    setReasonError('')
  }, [currentStatus])

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {config && (
          <Badge className={`${config.color} text-white border-0 px-3 py-1`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        )}
        {!isTerminal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="text-white/70 hover:text-white hover:bg-white/20 h-7 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${config.color} text-white border-0 px-3 py-1 opacity-60`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <ArrowRight className="h-4 w-4 text-white/60" />

          <Select value={selectedStatus} onValueChange={handleStatusSelect}>
            <SelectTrigger className="w-[180px] h-8 bg-white/20 backdrop-blur-sm border-white/30 text-white text-sm">
              <SelectValue placeholder="Nowy status..." />
            </SelectTrigger>
            <SelectContent>
              {allowedTransitions.map((status) => {
                const cfg = STATUS_CONFIG[status]
                const Icon = cfg.icon
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${cfg.textColor}`} />
                      <span>{cfg.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="max-w-md">
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (reasonError) setReasonError('')
            }}
            className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            rows={2}
            placeholder="Powód zmiany statusu (min. 10 znaków)..."
          />
          {reasonError && (
            <p className="mt-1 text-xs text-red-300 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {reasonError}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleStartChange}
            disabled={updateStatusMutation.isPending || !selectedStatus || selectedStatus === currentStatus}
            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            )}
            {updateStatusMutation.isPending ? 'Zmieniam...' : 'Zmień status'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={updateStatusMutation.isPending}
            className="text-white/70 hover:text-white hover:bg-white/20"
          >
            Anuluj
          </Button>
        </div>
      </motion.div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Potwierdź zmianę statusu
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Czy na pewno chcesz zmienić status z{' '}
                <strong>{STATUS_CONFIG[statusKey]?.label}</strong> na{' '}
                <strong className="text-red-600">
                  {selectedStatus ? STATUS_CONFIG[selectedStatus]?.label : ''}
                </strong>?
              </p>
              {selectedStatus === 'CANCELLED' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <strong>Uwaga:</strong> Anulowanie rezerwacji jest operacją nieodwracalną.
                  Klient zostanie poinformowany o anulowaniu.
                </div>
              )}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <strong>Powód:</strong> {reason}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Wróć</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeStatusChange}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Potwierdź zmianę
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
