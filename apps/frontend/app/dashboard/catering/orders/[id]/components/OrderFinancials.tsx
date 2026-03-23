'use client';

import { useState } from 'react';
import {
  Receipt,
  Utensils,
  Star,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useUpdateCateringDeposit,
} from '@/hooks/use-catering-orders';
import { SectionCard } from './SectionCard';
import { formatPrice, formatDatePl, iconBtnEdit, iconBtnDelete } from './types';
import type { CateringOrder, CateringDeposit } from './types';

// ═══ EDIT DEPOSIT DIALOG ═══

interface EditDepositDialogProps {
  orderId: string;
  deposit: CateringDeposit | null;
  open: boolean;
  onClose: () => void;
}

function EditDepositDialog({ orderId, deposit, open, onClose }: EditDepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [title, setTitle] = useState('');

  const updateMutation = useUpdateCateringDeposit(orderId, deposit?.id ?? '');

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && deposit) {
      setAmount(String(deposit.amount));
      setDueDate(deposit.dueDate ?? '');
      setTitle(deposit.title ?? '');
    }
    if (!isOpen) onClose();
  };

  const handleSave = async () => {
    if (!deposit) return;
    await updateMutation.mutateAsync({
      amount: parseFloat(amount),
      dueDate,
      title: title || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edytuj zaliczkę</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dep-title">Tytuł</Label>
            <Input
              id="dep-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="np. Zaliczka 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dep-amount">Kwota (PLN)</Label>
            <Input
              id="dep-amount"
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dep-date">Termin płatności</Label>
            <Input
              id="dep-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !amount || !dueDate}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : 'Zapisz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══ ORDER FINANCIALS ═══

interface OrderFinancialsProps {
  order: CateringOrder;
  orderId: string;
  pricePerGuest: number | null;
  hasDiscount: boolean;
  isRemovingDiscount: boolean;
  isDeletingDeposit: boolean;
  onOpenDiscountDialog: () => void;
  onRemoveDiscount: () => void;
  onOpenDepositDialog: () => void;
  onDeleteDeposit: (depositId: string, isPaid?: boolean) => void;
  onPayDeposit: (deposit: Pick<CateringDeposit, 'id' | 'amount' | 'title'>) => void;
}

export function OrderFinancials({
  order,
  orderId,
  pricePerGuest,
  hasDiscount,
  isRemovingDiscount,
  isDeletingDeposit,
  onOpenDiscountDialog,
  onRemoveDiscount,
  onOpenDepositDialog,
  onDeleteDeposit,
  onPayDeposit,
}: OrderFinancialsProps) {
  const [editDepositOpen, setEditDepositOpen] = useState(false);
  const [editDeposit, setEditDeposit] = useState<CateringDeposit | null>(null);

  const deposits = order.deposits ?? [];

  const totalPaid = deposits
    .filter(d => d.paid || d.status === 'PAID')
    .reduce((sum, d) => sum + Number(d.paidAmount ?? d.amount), 0);
  const remaining = Math.max(0, Number(order.totalPrice) - totalPaid);
  const fullyPaid = deposits.length > 0 && remaining === 0;

  return (
    <>
      <SectionCard
        icon={Receipt}
        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        iconColor="text-emerald-600 dark:text-emerald-400"
        title="Rozliczenie"
        badge={
          !hasDiscount ? (
            <Button
              size="sm" variant="ghost"
              className="h-8 px-3 text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={onOpenDiscountDialog}
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj rabat
            </Button>
          ) : undefined
        }
      >
        {/* Pozycje */}
        <div className="space-y-2.5">
          {Number(order.subtotal) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                <Utensils className="w-3.5 h-3.5" /> Dania
              </span>
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </div>
          )}
          {Number(order.extrasTotalPrice) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                <Star className="w-3.5 h-3.5" /> Usługi dodatkowe
              </span>
              <span className="font-medium">{formatPrice(order.extrasTotalPrice)}</span>
            </div>
          )}

          {/* Rabat */}
          {hasDiscount && (
            <div className="flex items-start justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>
                Rabat
                {order.discountType === 'PERCENTAGE' && order.discountValue
                  ? ` (${order.discountValue}%)`
                  : ''}
                {order.discountReason && (
                  <span className="block text-xs text-neutral-400 font-normal">{order.discountReason}</span>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={onOpenDiscountDialog}
                  disabled={isRemovingDiscount}
                  className={iconBtnEdit}
                  title="Edytuj rabat"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={onRemoveDiscount}
                  disabled={isRemovingDiscount}
                  className={iconBtnDelete}
                  title="Usuń rabat"
                >
                  {isRemovingDiscount
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />}
                </button>
                <span className="font-medium ml-1">−{formatPrice(order.discountAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Łącznie */}
        <div className="mt-4 pt-4 border-t-2 border-dashed border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">Łącznie</span>
            <span className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {formatPrice(order.totalPrice)}
            </span>
          </div>
          {pricePerGuest !== null && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-right">
              {formatPrice(pricePerGuest)} / osobę
            </p>
          )}
        </div>

        {/* Zaliczki */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Zaliczki</p>
            <Button
              size="sm" variant="ghost"
              className="h-7 px-2.5 text-xs gap-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              onClick={onOpenDepositDialog}
            >
              <Plus className="w-3 h-3" /> Dodaj
            </Button>
          </div>

          {deposits.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-3">Brak zaliczek</p>
          ) : (
            <div className="space-y-2">
              {deposits.map((d) => {
                const paid = d.paid || d.status === 'PAID';
                return (
                  <div key={d.id} className="flex items-center gap-2">
                    <div className="shrink-0">
                      {paid
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {d.title ?? 'Zaliczka'}
                      </p>
                      {d.dueDate && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDatePl(d.dueDate)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!paid && (
                        <>
                          <button
                            onClick={() => { setEditDeposit(d); setEditDepositOpen(true); }}
                            className={iconBtnEdit}
                            title="Edytuj zaliczkę"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onDeleteDeposit(d.id, paid)}
                        disabled={isDeletingDeposit}
                        className={iconBtnDelete}
                        title="Usuń zaliczkę"
                      >
                        {isDeletingDeposit
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                      </button>
                      {!paid && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          onClick={() => onPayDeposit({ id: d.id, amount: d.amount, title: d.title })}
                        >
                          Opłać
                        </Button>
                      )}
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                      {formatPrice(d.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Podsumowanie rozliczeń */}
          {deposits.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 dark:text-neutral-500">Wpłacono</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(totalPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${fullyPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  Pozostało do zapłaty
                </span>
                <span className={`font-bold ${
                  fullyPaid
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {fullyPaid ? 'Opłacone ✓' : formatPrice(remaining)}
                </span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <EditDepositDialog
        orderId={orderId}
        deposit={editDeposit}
        open={editDepositOpen}
        onClose={() => { setEditDepositOpen(false); setEditDeposit(null); }}
      />
    </>
  );
}
