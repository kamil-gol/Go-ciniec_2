'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Users, CheckCircle, AlertTriangle } from 'lucide-react'
import { EditableCard } from './EditableCard'
import { useHalls } from '@/hooks/use-halls'
import { useCheckAvailability } from '@/hooks/use-check-availability'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'

interface EditableHallCardProps {
  reservationId: string
  hallId: string
  hallName: string
  hallCapacity: number | null
  startDateTime: string | null
  endDateTime: string | null
  totalGuests: number
  onUpdated?: () => void
}

export function EditableHallCard({
  reservationId,
  hallId: initialHallId,
  hallName: initialHallName,
  hallCapacity: initialCapacity,
  startDateTime,
  endDateTime,
  totalGuests,
  onUpdated,
}: EditableHallCardProps) {
  const [selectedHallId, setSelectedHallId] = useState(initialHallId)

  const { data: hallsData } = useHalls()
  const updateMutation = useUpdateReservation()

  const hallsArray = useMemo(
    () => Array.isArray(hallsData?.halls) ? hallsData.halls : (Array.isArray(hallsData) ? hallsData : []),
    [hallsData]
  )

  const selectedHall = useMemo(
    () => hallsArray.find((h) => h.id === selectedHallId),
    [hallsArray, selectedHallId]
  )

  const selectedCapacity = selectedHall?.capacity || 0
  const hallChanged = selectedHallId !== initialHallId

  const { data: availability, isLoading: availabilityLoading } = useCheckAvailability(
    hallChanged ? selectedHallId : undefined,
    hallChanged ? startDateTime || undefined : undefined,
    hallChanged ? endDateTime || undefined : undefined,
    reservationId
  )

  useEffect(() => {
    setSelectedHallId(initialHallId)
  }, [initialHallId])

  const handleSave = async (reason: string) => {
    if (!selectedHallId) throw new Error('Wybierz salę')

    if (hallChanged && availability && !availability.available) {
      throw new Error('Wybrana sala nie jest dostępna w tym terminie')
    }

    await updateMutation.mutateAsync({
      id: reservationId,
      input: {
        hallId: selectedHallId,
        reason,
      },
    })

    toast.success('Sala zaktualizowana')
    onUpdated?.()
  }

  const handleCancel = () => {
    setSelectedHallId(initialHallId)
  }

  return (
    <EditableCard
      title="Sala"
      icon={<Building2 className="h-5 w-5 text-white" />}
      iconGradient="from-purple-500 to-pink-500"
      onSave={handleSave}
      onCancel={handleCancel}
    >
      {(editing) => {
        if (!editing) {
          return (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nazwa sali</p>
                <p className="text-2xl font-bold">{initialHallName}</p>
              </div>
              {initialCapacity && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Pojemność: {initialCapacity} osób</span>
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700 dark:text-neutral-300">Sala</label>
              <Select value={selectedHallId} onValueChange={setSelectedHallId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz salę..." />
                </SelectTrigger>
                <SelectContent>
                  {hallsArray.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name} (max {hall.capacity} osób)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCapacity > 0 && (
              <p className="text-sm text-secondary-600 dark:text-neutral-400">
                Pojemność: {selectedCapacity} osób
                {totalGuests > selectedCapacity && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {' '}— Uwaga! Gości: {totalGuests} (przekroczenie!)
                  </span>
                )}
              </p>
            )}

            {hallChanged && startDateTime && endDateTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-lg border ${
                  availabilityLoading
                    ? 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
                    : availability?.available
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                }`}
              >
                {availabilityLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-secondary-600 dark:text-neutral-400">Sprawdzanie dostępności...</span>
                  </div>
                ) : availability?.available ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Sala jest dostępna w wybranym terminie
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        Kolizja z istniejącą rezerwacją!
                      </span>
                    </div>
                    {availability?.conflicts?.map((c) => (
                      <div key={c.id} className="ml-7 text-xs text-red-700 dark:text-red-300">
                        • {c.clientName} — {c.eventType} (
                        {new Date(c.startDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–
                        {new Date(c.endDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )
      }}
    </EditableCard>
  )
}
