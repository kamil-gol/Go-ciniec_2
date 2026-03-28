'use client'

import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles } from 'lucide-react'
import { selectAllOnFocus } from './utils'
import type { EventSectionProps } from './types'

export function EventSection({
  formCtx,
  eventTypesArray,
  isBirthday,
  isAnniversary,
  isCustom,
}: EventSectionProps) {
  const { control, register, errors } = formCtx

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Jaki typ wydarzenia?</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">Określ rodzaj imprezy — wpłynie na dostępne szablony menu</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Typ wydarzenia<span className="text-destructive ml-0.5" aria-hidden="true">*</span></label>
        <Controller
          name="eventTypeId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={`h-11 ${errors.eventTypeId ? 'border-red-400 dark:border-red-500' : ''}`} aria-label="Wybierz typ wydarzenia" aria-required="true">
                <SelectValue placeholder="Wybierz typ wydarzenia..." />
              </SelectTrigger>
              <SelectContent>
                {eventTypesArray.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.eventTypeId && <p className="text-xs text-red-500 dark:text-red-400">{errors.eventTypeId.message}</p>}
      </div>

      {isBirthday && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Input type="number" label="Które urodziny" placeholder="np. 18" error={errors.birthdayAge?.message} onFocus={selectAllOnFocus} {...register('birthdayAge')} />
        </motion.div>
      )}

      {isCustom && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Input label="Typ wydarzenia (własny)" placeholder="np. Spotkanie rodzinne" error={errors.customEventType?.message} {...register('customEventType')} />
        </motion.div>
      )}

      {isAnniversary && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="number" label="Która rocznica" placeholder="np. 25" error={errors.anniversaryYear?.message} onFocus={selectAllOnFocus} {...register('anniversaryYear')} />
          <Input label="Jaka okazja" placeholder="np. Srebrne wesele" error={errors.anniversaryOccasion?.message} {...register('anniversaryOccasion')} />
        </motion.div>
      )}
    </div>
  )
}
