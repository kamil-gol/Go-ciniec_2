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
import { Building2, Users, CheckCircle, AlertTriangle, Landmark } from 'lucide-react'
import { EditableCard } from './EditableCard'
import { useHalls } from '@/hooks/use-halls'
import { useCheckAvailability } from '@/hooks/use-check-availability'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'

/** Extract "HH:mm" in UTC from an ISO datetime string */
function utcTime(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(11, 16)
  } catch {
    return ''
  }
}

/**
 * Calculate venue surcharge preview (mirrors backend logic).
 * Whole-venue halls: <30 guests → 3000 PLN, ≥30 → 2000 PLN
 */
function calculateVenueSurchargePreview(isWholeVenue: boolean, totalGuests: number): number {
  if (!isWholeVenue) return 0
  return totalGuests < 30 ? 3000 : 2000
}

interface EditableHallCardProps {
  reservationId: string
  hallId: string
  hallName: string
  hallCapacity: number | null
  hallIsWholeVenue?: boolean
  startDateTime: string | null
  endDateTime: string | null
  totalGuests: number
  currentVenueSurcharge?: number | null
  onUpdated?: () => void
}

export function EditableHallCard({
  reservationId,
  hallId: initialHallId,
  hallName: initialHallName,
  hallCapacity: initialCapacity,
  hallIsWholeVenue: initialIsWholeVenue = false,
  startDateTime,
  endDateTime,
  totalGuests,
  currentVenueSurcharge = null,
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
  const selectedIsWholeVenue = selectedHall?.isWholeVenue || false
  const hallChanged = selectedHallId !== initialHallId

  // Venue surcharge preview for selected hall
  const surchargePreview = useMemo(
    () => calculateVenueSurchargePreview(selectedIsWholeVenue, totalGuests),
    [selectedIsWholeVenue, totalGuests]
  )
  const currentSurcharge = currentVenueSurcharge ? Number(currentVenueSurcharge) : 0
  const surchargeWillChange = hallChanged && surchargePreview !== currentSurcharge

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
              {initialIsWholeVenue && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Landmark className="h-4 w-4" />
                  <span className="text-sm font-medium">Cały obiekt</span>
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sala</label>
              <Select value={selectedHallId} onValueChange={setSelectedHallId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz salę..." />
                </SelectTrigger>
                <SelectContent>
                  {hallsArray.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name} (max {hall.capacity} osób)
                      {hall.isWholeVenue ? ' \uD83C\uDFDB' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCapacity > 0 && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Pojemność: {selectedCapacity} osób
                {totalGuests > selectedCapacity && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {' '}\u2014 Uwaga! Gości: {totalGuests} (przekroczenie!)
                  </span>
                )}
              </p>
            )}

            {/* Venue surcharge preview — whole venue selected */}
            {selectedIsWholeVenue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  surchargeWillChange
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                }`}
              >
                <Landmark className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  surchargeWillChange ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                }`} />
                <div className="text-sm">
                  <span className={surchargeWillChange ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}>
                    Cały obiekt — dopłata:{' '}
                    <strong>{surchargePreview.toLocaleString('pl-PL')} zł</strong>
                    {totalGuests < 30
                      ? ' (poniżej 30 gości)'
                      : ' (30+ gości)'}
                  </span>
                  {surchargeWillChange && (
                    <span className="block text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {currentSurcharge > 0
                        ? `Zmiana z ${currentSurcharge.toLocaleString('pl-PL')} zł \u2192 ${surchargePreview.toLocaleString('pl-PL')} zł po zapisaniu`
                        : `Nowa dopłata ${surchargePreview.toLocaleString('pl-PL')} zł zostanie naliczona po zapisaniu`}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Hall no longer whole venue — surcharge will be removed */}
            {!selectedIsWholeVenue && hallChanged && currentSurcharge > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Dopłata za cały obiekt ({currentSurcharge.toLocaleString('pl-PL')} zł) zostanie usunięta po zmianie sali
                </span>
              </motion.div>
            )}

            {hallChanged && startDateTime && endDateTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-lg border ${
                  availabilityLoading
                    ? 'bg-neutral-50 dark:bg-neutral-950/30 border-neutral-200 dark:border-neutral-800'
                    : availability?.available
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                }`}
              >
                {availabilityLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Sprawdzanie dostępności...</span>
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
                    {availability?.conflicts?.map((c: any) => (
                      <div key={c.id} className="ml-7 text-xs text-red-700 dark:text-red-300">
                        \u2022 {c.clientName} \u2014 {c.eventType} (
                        {utcTime(c.startDateTime)}\u2013{utcTime(c.endDateTime)})
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
