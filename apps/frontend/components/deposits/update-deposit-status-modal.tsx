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
    { value: 'CASH', label: 'Gotówka' },
    { value: 'TRANSFER', label: 'Przelew' },
    { value: 'BLIK', label: 'BLIK' },
  ]

  const handleMarkAsPaid = async () => {
    if (!paymentMethod || !paidAt) {
      toast.error('Wypełnij wszystkie pola')
      return
    }

    setIsSubmitting(true)
    try {
      await depositsApi.markAsPaid(deposit.id, {
        paymentMethod: paymentMethod as 'CASH' | 'TRANSFER' | 'BLIK',
        paidAt: new Date(paidAt).toISOString(),
      })
      toast.success('Zaliczka została oznaczona jako zapłacona')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to mark deposit as paid:', error)
      toast.error(error.response?.data?.message || 'Nie udało się zaktualizować statusu zaliczki')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    setIsSubmitting(true)
    try {
      await depositsApi.markAsUnpaid(deposit.id)
      toast.success('Zaliczka została oznaczona jako nieopłacona')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to mark deposit as unpaid:', error)
      toast.error(error.response?.data?.message || 'Nie udało się zaktualizować statusu zaliczki')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {deposit.paid ? 'Oznacz jako nieopłaconą' : 'Oznacz jako zapłaconą'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Current amount */}
          <div className="flex items-center gap-3 p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Kwota zaliczki</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {deposit.amount.toFixed(2)} zł
              </p>
            </div>
          </div>

          {/* If marking as PAID - show form */}
          {!deposit.paid && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Sposób płatności</label>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Wybierz sposób płatności" />
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
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Data i czas płatności</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
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
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Czy na pewno chcesz cofnąć status zapłaty tej zaliczki?
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                Zostanie oznaczona jako nieopłacona i będzie wymagała ponownego potwierdzenia płatności.
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
                {isSubmitting ? 'Zapisywanie...' : 'Oznacz jako zapłaconą'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
