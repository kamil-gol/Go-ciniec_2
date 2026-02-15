'use client'

import { useMemo } from 'react'
import { Control, UseFormRegister, useWatch } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface CreateReservationDiscountSectionProps {
  control: Control<any>
  register: UseFormRegister<any>
  totalPrice: number
}

export function CreateReservationDiscountSection({
  control,
  register,
  totalPrice,
}: CreateReservationDiscountSectionProps) {
  const discountEnabled = useWatch({ control, name: 'discountEnabled' })
  const discountType = useWatch({ control, name: 'discountType' })
  const discountValue = Number(useWatch({ control, name: 'discountValue' })) || 0
  const discountReason = useWatch({ control, name: 'discountReason' }) || ''

  const discountAmount = useMemo(() => {
    if (!discountEnabled || discountValue <= 0) return 0
    if (discountType === 'PERCENTAGE') {
      return Math.round((totalPrice * discountValue) / 100)
    }
    return Math.min(discountValue, totalPrice)
  }, [discountEnabled, discountType, discountValue, totalPrice])

  const finalPrice = totalPrice - discountAmount

  if (totalPrice <= 0) return null

  return (
    <div className="space-y-4 mt-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
            <Tag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <span className="font-medium text-secondary-800">Rabat</span>
            <p className="text-xs text-secondary-500">{'Opcjonalnie — zastosuj rabat do tej rezerwacji'}</p>
          </div>
        </div>
        <Controller
          name="discountEnabled"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {/* Discount Form */}
      {discountEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-xl"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary-700">Typ rabatu</label>
              <Controller
                name="discountType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">{'Procentowy (%)'}</SelectItem>
                      <SelectItem value="FIXED">{'Kwotowy (PLN)'}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary-700">{'Wartość'}</label>
              <Input
                type="number"
                min="0"
                max={discountType === 'PERCENTAGE' ? 100 : totalPrice}
                step={discountType === 'PERCENTAGE' ? 1 : 10}
                placeholder={discountType === 'PERCENTAGE' ? 'np. 10' : 'np. 500'}
                className="h-9 text-sm"
                {...register('discountValue')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-700">{'Powód rabatu'}</label>
            <Input
              placeholder={'np. Stały klient, promocja...'}
              className="h-9 text-sm"
              {...register('discountReason')}
            />
            <p className="text-[10px] text-secondary-400">Min. 3 znaki</p>
          </div>

          {/* Live Preview */}
          {discountAmount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-white rounded-lg border border-orange-200 space-y-1 text-sm"
            >
              <div className="flex justify-between text-secondary-600">
                <span>Cena bazowa</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-medium">
                <span>
                  {'Rabat'}{discountType === 'PERCENTAGE' ? ` (${discountValue}%)` : ''}
                </span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Po rabacie</span>
                <span className="text-emerald-600">{formatCurrency(finalPrice)}</span>
              </div>
              {discountReason.length >= 3 && (
                <p className="text-xs text-orange-500 italic pt-1">{discountReason}</p>
              )}
            </motion.div>
          )}

          {discountEnabled && discountValue > 0 && discountReason.length < 3 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {'Podaj powód rabatu (min. 3 znaki) aby móc go zastosować'}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
