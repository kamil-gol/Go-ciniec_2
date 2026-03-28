'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMarkDepositPaid } from '@/hooks/use-catering-orders';
import type { MarkDepositPaidInput } from '@/types/catering-order.types';
import {
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowLeftRight,
} from 'lucide-react';
import { formatCurrency as formatPrice } from '@/lib/utils';

const PAYMENT_METHODS: {
  value: NonNullable<MarkDepositPaidInput['paymentMethod']>;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'CASH',     label: 'Gotówka', icon: Banknote },
  { value: 'TRANSFER', label: 'Przelew', icon: ArrowLeftRight },
  { value: 'BLIK',     label: 'BLIK',    icon: Smartphone },
  { value: 'CARD',     label: 'Karta',   icon: CreditCard },
];

interface Props {
  orderId: string;
  depositId: string;
  depositTitle?: string | null;
  depositAmount: number;
  open: boolean;
  onClose: () => void;
}

export function MarkDepositPaidDialog({
  orderId,
  depositId,
  depositTitle,
  depositAmount,
  open,
  onClose,
}: Props) {
  const [paymentMethod, setPaymentMethod] =
    useState<MarkDepositPaidInput['paymentMethod']>('TRANSFER');

  const markPaid = useMarkDepositPaid(orderId, depositId);

  const handleSubmit = async () => {
    await markPaid.mutateAsync({ paymentMethod });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Oznacz zaliczkę jako opłaconą</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
              {depositTitle ?? 'Zaliczka'}
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatPrice(depositAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Metoda płatności</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) =>
                setPaymentMethod(v as MarkDepositPaidInput['paymentMethod'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" /> {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={markPaid.isPending}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={markPaid.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {markPaid.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Potwierdź opłatę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
