'use client'

import { useState } from 'react'
import { Tag, Percent, DollarSign, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    totalPrice: number | string
    discountType?: string | null
    discountValue?: number | string | null
    discountAmount?: number | string | null
    discountReason?: string | null
    priceBeforeDiscount?: number | string | null
  }
}

export function DiscountSection({ reservation }: DiscountSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>(
    (reservation.discountType as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE'
  )
  const [discountValue, setDiscountValue] = useState(
    reservation.discountValue ? String(Number(reservation.discountValue)) : ''
  )
  const [discountReason, setDiscountReason] = useState(reservation.discountReason || '')

  const applyDiscount = useApplyDiscount()
  const removeDiscount = useRemoveDiscount()

  const hasDiscount = !!reservation.discountType

  const handleApply = () => {
    if (!discountValue || Number(discountValue) <= 0) return
    if (!discountReason || discountReason.trim().length < 3) return

    applyDiscount.mutate(
      {
        id: reservation.id,
        input: {
          type: discountType,
          value: Number(discountValue),
          reason: discountReason.trim(),
        },
      },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  const handleRemove = () => {
    if (!confirm('Czy na pewno chcesz usun\u0105\u0107 rabat?')) return
    removeDiscount.mutate(reservation.id)
  }

  const handleStartEditing = () => {
    setDiscountType((reservation.discountType as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE')
    setDiscountValue(reservation.discountValue ? String(Number(reservation.discountValue)) : '')
    setDiscountReason(reservation.discountReason || '')
    setIsEditing(true)
  }

  // Calculate preview
  const basePrice = reservation.priceBeforeDiscount
    ? Number(reservation.priceBeforeDiscount)
    : Number(reservation.totalPrice)
  const previewAmount =
    discountType === 'PERCENTAGE'
      ? Math.round(basePrice * Number(discountValue || 0) / 100 * 100) / 100
      : Number(discountValue || 0)
  const previewTotal = Math.max(0, basePrice - previewAmount)

  if (reservation.status === 'CANCELLED') return null

  // ── Editing / Adding form ──
  if (isEditing) {
    return (
      <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-orange-700">
            <Tag className="h-4 w-4" />
            {hasDiscount ? 'Edytuj rabat' : 'Dodaj rabat'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Typ rabatu</label>
              <Select value={discountType} onValueChange={(v: string) => setDiscountType(v as 'PERCENTAGE' | 'FIXED')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">
                    <span className="flex items-center gap-2">
                      <Percent className="h-3.5 w-3.5" /> Procentowy
                    </span>
                  </SelectItem>
                  <SelectItem value="FIXED">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Kwotowy (PLN)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Warto\u015b\u0107 {discountType === 'PERCENTAGE' ? '(%)' : '(PLN)'}
              </label>
              <Input
                type="number"
                min="0"
                max={discountType === 'PERCENTAGE' ? 100 : basePrice}
                step={discountType === 'PERCENTAGE' ? 1 : 50}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'PERCENTAGE' ? 'np. 10' : 'np. 500'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Pow\u00f3d rabatu</label>
            <Input
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="np. Sta\u0142y klient, rabat \u015bwi\u0105teczny..."
            />
          </div>

          {discountValue && Number(discountValue) > 0 && (
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-secondary-600">
                  <span>Cena bazowa</span>
                  <span>{formatCurrency(basePrice)}</span>
                </div>
                <div className="flex justify-between text-orange-600 font-medium">
                  <span>
                    Rabat {discountType === 'PERCENTAGE' ? `${discountValue}%` : `${discountValue} PLN`}
                  </span>
                  <span>-{formatCurrency(previewAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-secondary-900 pt-1 border-t border-orange-200">
                  <span>Cena po rabacie</span>
                  <span>{formatCurrency(previewTotal)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={applyDiscount.isPending}
            >
              Anuluj
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={
                applyDiscount.isPending ||
                !discountValue ||
                Number(discountValue) <= 0 ||
                !discountReason ||
                discountReason.trim().length < 3
              }
              className="bg-orange-600 hover:bg-orange-700"
            >
              {applyDiscount.isPending
                ? 'Zapisywanie...'
                : hasDiscount
                  ? 'Aktualizuj rabat'
                  : 'Zastosuj rabat'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Display existing discount ──
  if (hasDiscount) {
    return (
      <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Tag className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-secondary-900">Rabat</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    {reservation.discountType === 'PERCENTAGE'
                      ? `${Number(reservation.discountValue)}%`
                      : formatCurrency(Number(reservation.discountValue))}
                  </span>
                </div>
                <p className="text-sm text-secondary-500 mt-0.5">{reservation.discountReason}</p>
                <div className="mt-2 text-sm">
                  <span className="text-secondary-500 line-through">
                    {formatCurrency(Number(reservation.priceBeforeDiscount))}
                  </span>
                  <span className="mx-2 text-orange-600 font-medium">
                    -{formatCurrency(Number(reservation.discountAmount))}
                  </span>
                  <span className="font-bold text-secondary-900">
                    {formatCurrency(Number(reservation.totalPrice))}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEditing}
                className="h-8 w-8 p-0 text-secondary-400 hover:text-orange-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={removeDiscount.isPending}
                className="h-8 w-8 p-0 text-secondary-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── No discount — show add button ──
  return (
    <button
      type="button"
      onClick={() => {
        setDiscountValue('')
        setDiscountReason('')
        setIsEditing(true)
      }}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 font-medium text-sm hover:bg-orange-50 hover:border-orange-400 transition-colors"
    >
      <Tag className="h-4 w-4" />
      Dodaj rabat
    </button>
  )
}
