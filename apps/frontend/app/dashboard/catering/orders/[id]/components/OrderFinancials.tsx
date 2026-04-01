'use client';

import { useState } from 'react';
import {
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
import { UnifiedFinancialSummary } from '@/components/shared/UnifiedFinancialSummary';
import type { FinancialLineItem, FinancialBalance, FinancialDiscount } from '@/components/shared/UnifiedFinancialSummary';
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

// ═══ CATERING DEPOSITS SECTION ═══

interface CateringDepositsSectionProps {
  deposits: CateringDeposit[];
  isDeletingDeposit: boolean;
  onOpenDepositDialog: () => void;
  onDeleteDeposit: (depositId: string, isPaid?: boolean) => void;
  onPayDeposit: (deposit: Pick<CateringDeposit, 'id' | 'amount' | 'title'>) => void;
  onEditDeposit: (deposit: CateringDeposit) => void;
}

function CateringDepositsSection({
  deposits,
  isDeletingDeposit,
  onOpenDepositDialog,
  onDeleteDeposit,
  onPayDeposit,
  onEditDeposit,
}: CateringDepositsSectionProps) {
  return (
    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
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
                    : <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-600 dark:text-neutral-300'}`}>
                    {d.title ?? 'Zaliczka'}
                  </p>
                  {d.dueDate && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDatePl(d.dueDate)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!paid && (
                    <button
                      onClick={() => onEditDeposit(d)}
                      className={iconBtnEdit}
                      title="Edytuj zaliczkę"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
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

    </div>
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
  const totalPending = deposits
    .filter(d => !d.paid && d.status !== 'PAID')
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPrice = Number(order.totalPrice);
  const remaining = Math.max(0, totalPrice - totalPaid);
  const percentPaid = totalPrice > 0 ? Math.round((totalPaid / totalPrice) * 100) : 0;
  const percentCommitted = totalPrice > 0
    ? Math.min(100, Math.round(((totalPaid + totalPending) / totalPrice) * 100))
    : 0;

  const balance: FinancialBalance | null = deposits.length > 0 ? {
    totalPaid,
    totalCommitted: totalPaid + totalPending,
    totalPending,
    remaining,
    percentPaid,
    percentCommitted,
    depositsCount: deposits.length,
  } : null;

  // Build line items for UnifiedFinancialSummary
  const lineItems: FinancialLineItem[] = [];
  if (Number(order.subtotal) > 0) {
    lineItems.push({
      id: 'dishes',
      icon: <Utensils className="w-3.5 h-3.5" />,
      label: 'Dania',
      amount: Number(order.subtotal),
    });
  }
  if (Number(order.extrasTotalPrice) > 0) {
    lineItems.push({
      id: 'extras',
      icon: <Star className="w-3.5 h-3.5" />,
      label: 'Usługi dodatkowe',
      amount: Number(order.extrasTotalPrice),
    });
  }

  // Build discount for display
  const discount: FinancialDiscount | null = hasDiscount && order.discountAmount
    ? {
        type: order.discountType || 'FIXED',
        value: order.discountValue,
        amount: Number(order.discountAmount),
        reason: order.discountReason,
      }
    : null;

  // Discount inline display (catering-style with edit/remove buttons)
  const discountSlot = hasDiscount ? (
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
  ) : undefined;

  return (
    <>
      <UnifiedFinancialSummary
        title="Rozliczenie"
        lineItems={lineItems}
        discount={discount}
        totalPrice={totalPrice}
        pricePerPerson={pricePerGuest}
        pricePerPersonLabel="/ osobę"
        balance={balance}
        discountSlot={discountSlot}
        headerAction={
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
        depositsSlot={
          <CateringDepositsSection
            deposits={deposits}
            isDeletingDeposit={isDeletingDeposit}
            onOpenDepositDialog={onOpenDepositDialog}
            onDeleteDeposit={onDeleteDeposit}
            onPayDeposit={onPayDeposit}
            onEditDeposit={(d) => { setEditDeposit(d); setEditDepositOpen(true); }}
          />
        }
      />

      <EditDepositDialog
        orderId={orderId}
        deposit={editDeposit}
        open={editDepositOpen}
        onClose={() => { setEditDepositOpen(false); setEditDeposit(null); }}
      />
    </>
  );
}
