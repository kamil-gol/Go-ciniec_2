'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { paymentMethodOptions } from './deposits-config'

interface MarkAsPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDeposit: Deposit | null
  payMethod: PaymentMethod
  setPayMethod: (v: PaymentMethod) => void
  payDate: string
  setPayDate: (v: string) => void
  paying: boolean
  onPay: () => void
}

export function MarkAsPaidDialog({
  open,
  onOpenChange,
  selectedDeposit,
  payMethod,
  setPayMethod,
  payDate,
  setPayDate,
  paying,
  onPay,
}: MarkAsPaidDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            Potwierdź płatność
          </DialogTitle>
          <DialogDescription>
            Oznacz zaliczkę jako opłaconą.
          </DialogDescription>
        </DialogHeader>

        {selectedDeposit && (
          <div className="space-y-5 py-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Kwota</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {Number(selectedDeposit.amount).toLocaleString('pl-PL')} zł
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Metoda płatności</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethodOptions.map((m) => {
                  const Icon = m.icon
                  const selected = payMethod === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPayMethod(m.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        selected
                          ? `${m.color} border-current ring-2 ring-current/20`
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Data płatności</Label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button
            onClick={onPay}
            disabled={paying}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Potwierdź płatność
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
