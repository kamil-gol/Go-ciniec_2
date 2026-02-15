'use client'

import { useState } from 'react'
import { Tag, X, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApplyDiscount, useRemoveDiscount } from '@/hooks/use-discount'
import { formatCurrency } from '@/lib/utils'

interface DiscountSectionProps {
  reservation: {
    id: string
    status: string
    totalPrice: number
    discountType?: string | null
    discountValue?: number | string | null
    discountAmount?: number | string | null
    discountReason?: string | null
    priceBeforeDiscount?: number | string | null
  }
}

export function DiscountSection({ reservation }: DiscountSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [discountReason, setDiscountReason] = useState('')

  const applyDiscount = useApplyDiscount()
  const removeDiscount = useRemoveDiscount()

  const hasDiscount = !!reservation.discountType && !!reservation.discountAmount

  if (reservation.status === 'CANCELLED') return null

  const handleApply = async () => {
    if (!discountValue || Number(discountValue) <= 0) return
    if (!discountReason || discountReason.length < 3) return

    try {
      await applyDiscount.mutateAsync({
        reservationId: reservation.id,
        data: {
          type: discountType,
          value: Number(discountValue),
          reason: discountReason,
        }
      })
      setIsEditing(false)
      setDiscountValue('')
      setDiscountReason('')
    } catch (error) {
      console.error('Failed to apply discount:', error)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Czy na pewno chcesz usun\u0105\u0107 rabat?')) return
    try {
      await removeDiscount.mutateAsync(reservation.id)
    } catch (error) {
      console.error('Failed to remove discount:', error)
    }
  }

  const handleStartEdit = () => {
    if (hasDiscount) {
      setDiscountType(reservation.discountType as 'PERCENTAGE' | 'FIXED')
      setDiscountValue(String(reservation.discountValue || ''))
      setDiscountReason(reservation.discountReason || '')
    }
    setIsEditing(true)
  }

  // Calculate preview
  const previewAmount = discountType === 'PERCENTAGE'
    ? (reservation.totalPrice * Number(discountValue || 0)) / 100
    : Number(discountValue || 0)
  const previewFinal = Math.max(0, reservation.totalPrice - previewAmount)

  // STATE 1: No discount — show "Add" button
  if (!hasDiscount && !isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 font-medium text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-400 transition-colors"
      >
        <Tag className="h-4 w-4" />
        Dodaj rabat
      </button>
    )
  }

  // STATE 2: Editing form (compact, fits narrow column)
  if (isEditing) {
    return (
      <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl border border-orange-200 dark:border-orange-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-sm">
              {hasDiscount ? 'Edytuj rabat' : 'Nowy rabat'}
            </span>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium">Typ</Label>
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'PERCENTAGE' | 'FIXED')}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">{'Procent (%)'}</SelectItem>
                <SelectItem value="FIXED">{'Kwota (z\u0142)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">{'Warto\u015b\u0107'}</Label>
            <Input
              type="number"
              min="0"
              max={discountType === 'PERCENTAGE' ? 100 : reservation.totalPrice}
              step={discountType === 'PERCENTAGE' ? 1 : 10}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'PERCENTAGE' ? 'np. 10' : 'np. 500'}
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">{'Pow\u00f3d rabatu'}</Label>
          <Input
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
            placeholder={'np. Sta\u0142y klient, promocja...'}
            className="h-8 text-xs mt-1"
          />
        </div>

        {discountValue && Number(discountValue) > 0 && (
          <div className="text-xs bg-white dark:bg-black/20 rounded-lg p-2.5 space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Cena bazowa</span>
              <span>{formatCurrency(reservation.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-orange-600 font-medium">
              <span>{'Rabat'}{discountType === 'PERCENTAGE' ? ` (${discountValue}%)` : ''}</span>
              <span>-{formatCurrency(previewAmount)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold">
              <span>Po rabacie</span>
              <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(previewFinal)}</span>
            </div>
          </div>
        )}

        <Button
          size="sm"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
          onClick={handleApply}
          disabled={applyDiscount.isPending || !discountValue || Number(discountValue) <= 0 || !discountReason || discountReason.length < 3}
        >
          {applyDiscount.isPending ? 'Zapisywanie...' : (
            <>
              <Check className="mr-1 h-3 w-3" />
              {hasDiscount ? 'Zapisz zmiany' : 'Zastosuj rabat'}
            </>
          )}
        </Button>
      </div>
    )
  }

  // STATE 3: Has discount — compact vertical display (no Card wrapper)
  return (
    <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-600" />
          <span className="font-semibold text-sm">Rabat</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
            {reservation.discountType === 'PERCENTAGE'
              ? `${reservation.discountValue}%`
              : formatCurrency(Number(reservation.discountValue || 0))}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleStartEdit}
            className="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            title="Edytuj rabat"
          >
            <Pencil className="h-3 w-3 text-orange-600" />
          </button>
          <button
            onClick={handleRemove}
            disabled={removeDiscount.isPending}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title={'Usu\u0144 rabat'}
          >
            <X className="h-3 w-3 text-red-500" />
          </button>
        </div>
      </div>

      {reservation.discountReason && (
        <p className="text-xs text-orange-600/70 mb-2 italic">{reservation.discountReason}</p>
      )}

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cena bazowa</span>
          <span className="line-through text-muted-foreground">
            {formatCurrency(Number(reservation.priceBeforeDiscount || reservation.totalPrice))}
          </span>
        </div>
        <div className="flex justify-between text-orange-600 font-medium">
          <span>Rabat</span>
          <span>-{formatCurrency(Number(reservation.discountAmount || 0))}</span>
        </div>
        <Separator className="border-orange-200 dark:border-orange-800" />
        <div className="flex justify-between font-bold pt-0.5">
          <span>Po rabacie</span>
          <span className="text-emerald-700 dark:text-emerald-400">
            {formatCurrency(Number(reservation.totalPrice))}
          </span>
        </div>
      </div>
    </div>
  )
}
