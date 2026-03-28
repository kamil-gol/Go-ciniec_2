'use client'

import {
  DollarSign, Plus, CheckCircle2, Loader2, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { paymentMethodOptions } from './types'
import { formatCurrency } from '@/lib/utils'

interface CreateDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createAmount: string
  setCreateAmount: (v: string) => void
  createDueDate: string
  setCreateDueDate: (v: string) => void
  createTitle: string
  setCreateTitle: (v: string) => void
  creating: boolean
  finalTotalPrice: number
  startDateTime?: string
  onCreate: () => void
}

export function CreateDepositModal({
  open,
  onOpenChange,
  createAmount,
  setCreateAmount,
  createDueDate,
  setCreateDueDate,
  createTitle,
  setCreateTitle,
  creating,
  finalTotalPrice,
  startDateTime,
  onCreate,
}: CreateDepositModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            Nowa zaliczka
          </DialogTitle>
          <DialogDescription>
            Sugerowana kwota: 30% ({formatCurrency(Math.round(finalTotalPrice * 0.3))})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Kwota (zł) *</Label>
            <Input type="number" min="1" step="0.01" placeholder={`np. ${Math.round(finalTotalPrice * 0.3)}`}
              value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} className="h-10" />
            {createAmount && finalTotalPrice > 0 && (
              <p className="text-xs text-muted-foreground">
                {((Number(createAmount) / finalTotalPrice) * 100).toFixed(1)}% ceny rezerwacji
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Termin płatności *</Label>
            <Input type="date" value={createDueDate} onChange={(e) => setCreateDueDate(e.target.value)} className="h-10"
              max={startDateTime ? (() => { const d = new Date(startDateTime); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })() : undefined} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tytuł (opcjonalnie)</Label>
            <Input placeholder="np. Zaliczka na wesele" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} className="h-10" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={onCreate} disabled={creating} className="bg-rose-600 hover:bg-rose-700 text-white">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Utwórz zaliczkę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PayDepositModalProps {
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

export function PayDepositModal({
  open,
  onOpenChange,
  selectedDeposit,
  payMethod,
  setPayMethod,
  payDate,
  setPayDate,
  paying,
  onPay,
}: PayDepositModalProps) {
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
                    <button key={m.value} type="button" onClick={() => setPayMethod(m.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        selected ? `${m.color} border-current ring-2 ring-current/20`
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}>
                      <Icon className="h-4 w-4" />{m.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Data płatności</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-10" />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={onPay} disabled={paying} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Potwierdź płatność
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  depositToDelete: Deposit | null
  actionLoading: string | null
  onDeleteConfirm: () => void
}

export function DeleteDepositModal({
  open,
  onOpenChange,
  depositToDelete,
  actionLoading,
  onDeleteConfirm,
}: DeleteDepositModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            Usuń zaliczkę
          </DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Zaliczka zostanie trwale usunięta z bazy danych.
          </DialogDescription>
        </DialogHeader>
        {depositToDelete && (
          <div className="py-4">
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Zaliczka do usunięcia</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">
                {Number(depositToDelete.amount).toLocaleString('pl-PL')} zł
              </p>
              {depositToDelete.title && (
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{depositToDelete.title}</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            onClick={onDeleteConfirm}
            disabled={actionLoading === depositToDelete?.id}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {actionLoading === depositToDelete?.id
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Trash2 className="mr-2 h-4 w-4" />
            }
            Usuń trwale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
