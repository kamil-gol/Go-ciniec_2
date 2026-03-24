'use client'

import { DollarSign, Plus, Loader2 } from 'lucide-react'
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

interface CreateDepositDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalPrice: number
  createAmount: string
  setCreateAmount: (v: string) => void
  createDueDate: string
  setCreateDueDate: (v: string) => void
  createTitle: string
  setCreateTitle: (v: string) => void
  creating: boolean
  onCreate: () => void
}

export function CreateDepositDialog({
  open,
  onOpenChange,
  totalPrice,
  createAmount,
  setCreateAmount,
  createDueDate,
  setCreateDueDate,
  createTitle,
  setCreateTitle,
  creating,
  onCreate,
}: CreateDepositDialogProps) {
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
            Dodaj zaliczkę do tej rezerwacji. Sugerowana kwota to 30% ceny ({Math.round(totalPrice * 0.3).toLocaleString('pl-PL')} zł).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Kwota (zł) *</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder={`np. ${Math.round(totalPrice * 0.3)}`}
              value={createAmount}
              onChange={(e) => setCreateAmount(e.target.value)}
              className="h-10"
            />
            {createAmount && totalPrice > 0 && (
              <p className="text-xs text-muted-foreground">
                {((Number(createAmount) / totalPrice) * 100).toFixed(1)}% ceny rezerwacji
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Termin płatności *</Label>
            <Input
              type="date"
              value={createDueDate}
              onChange={(e) => setCreateDueDate(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tytuł (opcjonalnie)</Label>
            <Input
              placeholder="np. Zaliczka na wesele"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button
            onClick={onCreate}
            disabled={creating}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Utwórz zaliczkę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
