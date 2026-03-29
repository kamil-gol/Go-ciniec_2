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
import { Building2, Users, CheckCircle, AlertTriangle, Landmark, Info } from 'lucide-react'
import { EditableCard } from './EditableCard'
import { useHalls } from '@/hooks/use-halls'
import { useUpdateReservation } from '@/lib/api/reservations'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

// Returns HH:MM in local (Warsaw) time — NOT UTC
function localTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function calculateVenueSurchargePreview(isWholeVenue: boolean, totalGuests: number): number {
  if (!isWholeVenue) return 0
  return totalGuests < 30 ? 3000 : 2000
}

interface AvailableCapacityData {
  totalCapacity: number
  occupiedCapacity: number
  availableCapacity: number
  overlappingReservations: Array<{
    id: string
    clientName: string
    eventTypeName: string | null
    startDateTime: string
    endDateTime: string
    guests: number
    status: string
  }>
}

function useAvailableCapacity(
  hallId: string | undefined,
  startDateTime: string | undefined,
  endDateTime: string | undefined,
  excludeReservationId?: string
) {
  return useQuery({
    queryKey: ['available-capacity-edit', hallId, startDateTime, endDateTime, excludeReservationId],
    queryFn: async (): Promise<AvailableCapacityData> => {
      const params = new URLSearchParams()
      if (startDateTime) params.append('startDateTime', startDateTime)
      if (endDateTime) params.append('endDateTime', endDateTime)
      if (excludeReservationId) params.append('excludeReservationId', excludeReservationId)
      const response = await apiClient.get(`/halls/${hallId}/available-capacity?${params.toString()}`)
      return response.data?.data ?? response.data
    },
    enabled: Boolean(hallId && startDateTime && endDateTime),
    staleTime: 30 * 1000,
    retry: false,
  })
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
  disabled?: boolean
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
  disabled = false,
}: EditableHallCardProps) {
  const [selectedHallId, setSelectedHallId] = useState(initialHallId)

  const { data: hallsData } = useHalls()
  const updateMutation = useUpdateReservation()

  const hallsArray = useMemo(
    () => Array.isArray(hallsData?.halls) ? hallsData.halls : (Array.isArray(hallsData) ? hallsData : []),
    [hallsData]
  )

  const selectedHall = useMemo(
    () => hallsArray.find((h: any) => h.id === selectedHallId),
    [hallsArray, selectedHallId]
  )

  const selectedCapacity = selectedHall?.capacity || 0
  const selectedIsWholeVenue = selectedHall?.isWholeVenue || false
  const selectedAllowMultiple = selectedHall?.allowMultipleBookings ?? true
  const hallChanged = selectedHallId !== initialHallId

  const surchargePreview = useMemo(
    () => calculateVenueSurchargePreview(selectedIsWholeVenue, totalGuests),
    [selectedIsWholeVenue, totalGuests]
  )
  const currentSurcharge = currentVenueSurcharge ? Number(currentVenueSurcharge) : 0
  const surchargeWillChange = hallChanged && surchargePreview !== currentSurcharge

  const { data: capacityData, isLoading: capacityLoading } = useAvailableCapacity(
    hallChanged ? selectedHallId : undefined,
    hallChanged ? startDateTime || undefined : undefined,
    hallChanged ? endDateTime || undefined : undefined,
    reservationId
  )

  const availabilityStatus = useMemo(() => {
    if (!hallChanged || !capacityData) return null
    const hasOverlaps = capacityData.overlappingReservations.length > 0
    if (!hasOverlaps) return { type: 'available' as const }
    if (selectedAllowMultiple) {
      if (totalGuests <= capacityData.availableCapacity) {
        return { type: 'available-with-others' as const }
      } else {
        return { type: 'capacity-exceeded' as const }
      }
    }
    return { type: 'blocked' as const }
  }, [hallChanged, capacityData, selectedAllowMultiple, totalGuests])

  useEffect(() => {
    setSelectedHallId(initialHallId)
  }, [initialHallId])

  const handleSave = async (reason: string) => {
    if (!selectedHallId) throw new Error('Wybierz salę')
    if (hallChanged && capacityData) {
      if (availabilityStatus?.type === 'blocked') {
        throw new Error('Wybrana sala nie jest dostępna w tym terminie \u2014 tryb wyłączności')
      }
      if (availabilityStatus?.type === 'capacity-exceeded') {
        throw new Error(
          `Brak wystarczającej pojemności \u2014 dostępne ${capacityData.availableCapacity} miejsc, potrzeba ${totalGuests}`
        )
      }
    }
    await updateMutation.mutateAsync({
      id: reservationId,
      input: { hallId: selectedHallId, reason },
    })
    toast.success('Sala zaktualizowana')
    onUpdated?.()
  }

  const handleCancel = () => {
    setSelectedHallId(initialHallId)
  }

  const utilizationPercent = capacityData && capacityData.totalCapacity > 0
    ? Math.round(((capacityData.occupiedCapacity + totalGuests) / capacityData.totalCapacity) * 100)
    : 0

  const getCapacityColor = (pct: number) => {
    if (pct > 90) return { bar: 'bg-red-500', text: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' }
    if (pct > 70) return { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' }
    return { bar: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800' }
  }

  return (
    <EditableCard
      title="Sala"
      icon={<Building2 className="h-5 w-5 text-white" />}
      iconGradient="from-blue-500 to-cyan-500"
      gradientHeader
      headerGradient="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30"
      onSave={handleSave}
      onCancel={handleCancel}
      disabled={disabled}
    >
      {(editing) => {
        if (!editing) {
          return (
            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Nazwa sali</p>
                <p className="text-2xl font-bold">{initialHallName}</p>
              </div>
              {initialCapacity && (
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-black/20 rounded-lg text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Pojemność: {initialCapacity} osób</span>
                </div>
              )}
              {initialIsWholeVenue && (
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-black/20 rounded-lg text-amber-600 dark:text-amber-400">
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
                  {hallsArray.map((hall: any) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name} (max {hall.capacity} osób)
                      {hall.isWholeVenue ? ' 🏛' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCapacity > 0 && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Pojemność: {selectedCapacity} osób
                {totalGuests > selectedCapacity && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {' '}\u2014 Uwaga! Gości: {totalGuests} (przekroczenie!)
                  </span>
                )}
              </p>
            )}

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
                    Cały obiekt \u2014 dopłata:{' '}
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
              >
                {capacityLoading ? (
                  <div className="p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-950/30 border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">Sprawdzanie dostępności...</span>
                    </div>
                  </div>
                ) : availabilityStatus?.type === 'available' ? (
                  <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Sala jest dostępna w wybranym terminie
                      </span>
                    </div>
                  </div>
                ) : availabilityStatus?.type === 'available-with-others' && capacityData ? (
                  <div className={`p-4 rounded-lg border ${getCapacityColor(utilizationPercent).bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className={`w-5 h-5 ${getCapacityColor(utilizationPercent).text}`} />
                      <span className={`text-sm font-medium ${getCapacityColor(utilizationPercent).text}`}>
                        Sala dostępna \u2014 istnieją inne rezerwacje w tym terminie
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={getCapacityColor(utilizationPercent).text}>
                          Zajęte: {capacityData.occupiedCapacity} + Twoje: {totalGuests} = {capacityData.occupiedCapacity + totalGuests} osób
                        </span>
                        <span className={getCapacityColor(utilizationPercent).text}>
                          {capacityData.totalCapacity} max
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full rounded-full flex">
                          <div
                            className="bg-neutral-400 dark:bg-neutral-500 h-full transition-all"
                            style={{ width: `${Math.min((capacityData.occupiedCapacity / capacityData.totalCapacity) * 100, 100)}%` }}
                          />
                          <div
                            className={`${getCapacityColor(utilizationPercent).bar} h-full transition-all`}
                            style={{ width: `${Math.min((totalGuests / capacityData.totalCapacity) * 100, 100 - (capacityData.occupiedCapacity / capacityData.totalCapacity) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-neutral-500 dark:text-neutral-300">Wolne: {capacityData.availableCapacity} miejsc</span>
                        <span className={getCapacityColor(utilizationPercent).text}>{utilizationPercent}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {capacityData.overlappingReservations.map((r) => (
                        <div key={r.id} className="ml-1 text-xs text-neutral-600 dark:text-neutral-300">
                          {`\u2022 ${r.clientName} \u2014 ${r.eventTypeName || 'Wydarzenie'} (${localTime(r.startDateTime)}\u2013${localTime(r.endDateTime)}, ${r.guests} os.)`}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : availabilityStatus?.type === 'capacity-exceeded' && capacityData ? (
                  <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        Brak wystarczającej pojemności!
                      </span>
                    </div>
                    <p className="ml-7 text-xs text-red-700 dark:text-red-300 mb-2">
                      Potrzeba {totalGuests} miejsc, dostępne tylko {capacityData.availableCapacity} z {capacityData.totalCapacity}
                      {' '}(zajęte: {capacityData.occupiedCapacity})
                    </p>
                    {capacityData.overlappingReservations.map((r) => (
                      <div key={r.id} className="ml-7 text-xs text-red-700 dark:text-red-300">
                        {`\u2022 ${r.clientName} \u2014 ${r.eventTypeName || 'Wydarzenie'} (${localTime(r.startDateTime)}\u2013${localTime(r.endDateTime)}, ${r.guests} os.)`}
                      </div>
                    ))}
                  </div>
                ) : availabilityStatus?.type === 'blocked' && capacityData ? (
                  <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        Kolizja z istniejącą rezerwacją!
                      </span>
                    </div>
                    <p className="ml-7 text-xs text-red-700 dark:text-red-300 mb-1">
                      Ta sala nie obsługuje wielu rezerwacji jednocześnie.
                    </p>
                    {capacityData.overlappingReservations.map((r) => (
                      <div key={r.id} className="ml-7 text-xs text-red-700 dark:text-red-300">
                        {`\u2022 ${r.clientName} \u2014 ${r.eventTypeName || 'Wydarzenie'} (${localTime(r.startDateTime)}\u2013${localTime(r.endDateTime)})`}
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            )}
          </div>
        )
      }}
    </EditableCard>
  )
}
