'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Users, Smile, Baby, AlertCircle, Building2 } from 'lucide-react'
import { EditableCard } from './EditableCard'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { calculateVenueSurchargePreview, formatSurchargePLN } from '@/lib/venue-surcharge'

interface EditableGuestsCardProps {
  reservationId: string
  adults: number
  children: number
  toddlers: number
  hallCapacity: number
  isWholeVenue?: boolean
  disabled?: boolean
  onUpdated?: () => void
}

export function EditableGuestsCard({
  reservationId,
  adults: initialAdults,
  children: initialChildren,
  toddlers: initialToddlers,
  hallCapacity,
  isWholeVenue = false,
  disabled,
  onUpdated,
}: EditableGuestsCardProps) {
  const [adults, setAdults] = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)
  const [toddlers, setToddlers] = useState(initialToddlers)

  const updateMutation = useUpdateReservation()

  useEffect(() => {
    setAdults(initialAdults)
    setChildren(initialChildren)
    setToddlers(initialToddlers)
  }, [initialAdults, initialChildren, initialToddlers])

  const totalGuests = adults + children + toddlers
  const exceedsCapacity = hallCapacity > 0 && totalGuests > hallCapacity
  const isChildrenDisabled = adults === 0

  const initialTotal = initialAdults + initialChildren + initialToddlers
  const initialSurcharge = calculateVenueSurchargePreview(isWholeVenue, initialTotal)
  const editSurcharge = calculateVenueSurchargePreview(isWholeVenue, totalGuests)
  const surchargeChanged = initialSurcharge?.amount !== editSurcharge?.amount

  const handleSave = async (reason: string) => {
    if (adults + children + toddlers < 1) {
      throw new Error('Łączna liczba gości musi być >= 1')
    }

    await updateMutation.mutateAsync({
      id: reservationId,
      input: {
        adults,
        children,
        toddlers,
        reason,
      },
    })

    toast.success('Liczba gości zaktualizowana')
    onUpdated?.()
  }

  const handleCancel = () => {
    setAdults(initialAdults)
    setChildren(initialChildren)
    setToddlers(initialToddlers)
  }

  return (
    <EditableCard
      title="Goście"
      icon={<Users className="h-5 w-5 text-white" />}
      iconGradient="from-purple-500 to-pink-500"
      gradientHeader
      headerGradient="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30"
      onSave={handleSave}
      onCancel={handleCancel}
      disabled={disabled}
    >
      {(editing) => {
        if (!editing) {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Dorośli</p>
                  <p className="text-2xl font-bold">{initialAdults}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Dzieci (4-12)</p>
                  <p className="text-2xl font-bold">{initialChildren}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Maluchy (0-3)</p>
                  <p className="text-2xl font-bold">{initialToddlers}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <div>
                  <p className="text-sm font-semibold">Razem</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {initialAdults + initialChildren + initialToddlers}
                  </p>
                </div>
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-3 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-black/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Dorośli</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={adults}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    setAdults(val)
                    if (val === 0) {
                      setChildren(0)
                      setToddlers(0)
                    }
                  }}
                  className="text-center text-xl font-bold h-12"
                />
              </div>

              <div className="p-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-black/20">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Dzieci (4–12)</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isChildrenDisabled}
                  placeholder={isChildrenDisabled ? 'Najpierw dorośli' : '0'}
                  className="text-center text-xl font-bold h-12"
                />
              </div>

              <div className="p-3 rounded-xl border-2 border-green-200 dark:border-green-800 bg-white dark:bg-black/20">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Maluchy (0–3)</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={toddlers}
                  onChange={(e) => setToddlers(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isChildrenDisabled}
                  placeholder={isChildrenDisabled ? 'Najpierw dorośli' : '0'}
                  className="text-center text-xl font-bold h-12"
                />
              </div>
            </div>

            {totalGuests > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800"
              >
                <span className="text-sm mr-3">Łącznie:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {totalGuests}
                </span>
              </motion.div>
            )}

            {/* Venue surcharge live preview */}
            {editSurcharge && totalGuests > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  surchargeChanged
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                }`}
              >
                <Building2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  surchargeChanged
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
                <div className="text-sm">
                  <p className={`font-medium ${
                    surchargeChanged
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {editSurcharge.label}: {formatSurchargePLN(editSurcharge.amount)}
                  </p>
                  {surchargeChanged && initialSurcharge && (
                    <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                      Zmiana z {formatSurchargePLN(initialSurcharge.amount)} → {formatSurchargePLN(editSurcharge.amount)}
                    </p>
                  )}
                  {surchargeChanged && !initialSurcharge && (
                    <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                      Nowa dopłata zostanie naliczona po zapisie
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {exceedsCapacity && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-800 dark:text-red-200">
                  Liczba gości ({totalGuests}) przekracza pojemność sali ({hallCapacity})!
                </span>
              </motion.div>
            )}

            {totalGuests < 1 && (
              <p className="text-xs text-red-600 dark:text-red-400">Łączna liczba gości musi być co najmniej 1</p>
            )}
          </div>
        )
      }}
    </EditableCard>
  )
}
