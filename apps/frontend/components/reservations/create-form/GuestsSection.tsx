'use client'

import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Users, Smile, Baby, AlertCircle, AlertTriangle } from 'lucide-react'
import { selectAllOnFocus } from './utils'
import type { GuestsSectionProps } from './types'

export function GuestsSection({
  formCtx,
  adults,
  children,
  toddlers,
  totalGuests,
  selectedHallCapacity,
  isMultiBookingHall,
  availableCapacity,
}: GuestsSectionProps) {
  const { register, errors } = formCtx

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-3">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Ilu gości?</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Podaj liczbę osób w każdej grupie wiekowej</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-primary-600 dark:text-primary-400" /><span className="font-medium text-neutral-700 dark:text-neutral-300">Dorośli</span></div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            error={errors.adults?.message}
            className="text-center text-2xl font-bold h-14"
            onFocus={selectAllOnFocus}
            {...register('adults')}
          />
        </div>
        <div className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Smile className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="font-medium text-neutral-700 dark:text-neutral-300">Dzieci (4–12)</span></div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            error={errors.children?.message}
            disabled={adults === 0}
            className="text-center text-2xl font-bold h-14"
            onFocus={selectAllOnFocus}
            {...register('children')}
          />
        </div>
        <div className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-600 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Baby className="w-5 h-5 text-green-600 dark:text-green-400" /><span className="font-medium text-neutral-700 dark:text-neutral-300">Maluchy (0–3)</span></div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            error={errors.toddlers?.message}
            disabled={adults === 0}
            className="text-center text-2xl font-bold h-14"
            onFocus={selectAllOnFocus}
            {...register('toddlers')}
          />
        </div>
      </div>

      {totalGuests > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <span className="text-neutral-700 dark:text-neutral-300 mr-3">Łącznie gości:</span>
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalGuests}</span>
        </motion.div>
      )}

      {totalGuests > selectedHallCapacity && selectedHallCapacity > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">Liczba gości ({totalGuests}) przekracza pojemność sali ({selectedHallCapacity})!</span>
        </motion.div>
      )}

      {/* #165: Purple warning banner — multi-booking available capacity exceeded */}
      {isMultiBookingHall && availableCapacity && totalGuests > availableCapacity.availableCapacity && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Zbyt wielu gości dla tego terminu
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
              Wpisano {totalGuests} gości, ale w wybranym terminie dostępne jest tylko{' '}
              <strong>{availableCapacity.availableCapacity}</strong> miejsc
              (zajęto {availableCapacity.occupiedCapacity} z {availableCapacity.totalCapacity}).
              Zmniejsz liczbę gości, aby przejść dalej.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
