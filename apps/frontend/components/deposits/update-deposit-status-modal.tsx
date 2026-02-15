'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { depositsApi } from '@/lib/api/deposits'
import { toast } from 'sonner'
import { DollarSign, Calendar, CreditCard } from 'lucide-react'

interface UpdateDepositStatusModalProps {
  deposit: {
    id: string
    amount: number
    paid: boolean
    paidAt?: string
    paymentMethod?: string
  }
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UpdateDepositStatusModal({
  deposit,
  open,
  onClose,
  onSuccess,
}: UpdateDepositStatusModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>(deposit.paymentMethod || 'CASH')
  const [paidAt, setPaidAt] = useState<string>(() => {
    if (deposit.paidAt) {
      const date = new Date(deposit.paidAt)
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    }
    // Default to now
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  })

  const paymentMethodOptions = [
    { value: 'CASH', label: 'Got\u00f3wka' },
    { value: 'TRANSFER', label: 'Przelew' },
    { value: 'BLIK', label: 'BLIK' },
  ]

  const handleMarkAsPaid = async () => {
    if (!paymentMethod || !paidAt) {
      toast.error('Wype\u0142nij wszystkie pola')
      return
    }

    setIsSubmitting(true)
    try {
      await depositsApi.markAsPaid(deposit.id, {
        paymentMethod: paymentMethod as 'CASH' | 'TRANSFER' | 'BLIK',
        paidAt: new Date(paidAt).toISOString(),
      })
      toast.success('Zaliczka zosta\u0142a oznaczona jako zap\u0142acona')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to mark deposit as paid:', error)
      toast.error(error.response?.data?.message || 'Nie uda\u0142o si\u0119 zaktualizowa\u0107 statusu zaliczki')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    setIsSubmitting(true)
    try {
      await depositsApi.markAsUnpaid(deposit.id)
      toast.success('Zaliczka zosta\u0142a oznaczona jako nieop\u0142acona')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to mark deposit as unpaid:', error)
      toast.error(error.response?.data?.message || 'Nie uda\u0142o si\u0119 zaktualizowa\u0107 statusu zaliczki')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {deposit.paid ? 'Oznacz jako nieop\u0142acon\u0105' : 'Oznacz jako zap\u0142acon\u0105'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Current amount */}
          <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-primary-600" />
            <div>
              <p className="text-sm text-secondary-600">Kwota zaliczki</p>
              <p className="text-2xl font-bold text-primary-600">
                {deposit.amount.toFixed(2)} z\u0142
              </p>
            </div>
          </div>

          {/* If marking as PAID - show form */}
          {!deposit.paid && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Spos\u00f3b p\u0142atno\u015bci</label>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary-500" />
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Wybierz spos\u00f3b p\u0142atno\u015bci" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Data i czas p\u0142atno\u015bci</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary-500" />
                  <Input
                    type="datetime-local"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* If marking as UNPAID - show confirmation */}
          {deposit.paid && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                Czy na pewno chcesz cofn\u0105\u0107 status zap\u0142aty tej zaliczki?
              </p>
              <p className="text-xs text-amber-700 mt-2">
                Zostanie oznaczona jako nieop\u0142acona i b\u0119dzie wymaga\u0142a ponownego potwierdzenia p\u0142atno\u015bci.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            {deposit.paid ? (
              <Button
                variant="destructive"
                onClick={handleMarkAsUnpaid}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cofanie...' : 'Cofnij status'}
              </Button>
            ) : (
              <Button
                onClick={handleMarkAsPaid}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Oznacz jako zap\u0142acon\u0105'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
