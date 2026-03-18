'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateReservation } from '@/lib/api/reservations';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { ReservationCategoryExtra } from '@/types';

interface CategoryExtrasEditModalProps {
  reservationId: string;
  categoryExtras: ReservationCategoryExtra[];
  onClose: () => void;
  onSaved: () => void;
}

/**
 * #216: Modal for editing category extras quantities on an existing reservation.
 * Uses snapshot prices (pricePerItem) — they don't change even if the package price changes.
 */
export default function CategoryExtrasEditModal({
  reservationId,
  categoryExtras,
  onClose,
  onSaved,
}: CategoryExtrasEditModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const extra of categoryExtras) {
      initial[extra.packageCategoryId] = extra.quantity;
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const updateReservation = useUpdateReservation();
  const { toast } = useToast();

  function getQuantity(packageCategoryId: string): number {
    return quantities[packageCategoryId] ?? 0;
  }

  function setQuantity(packageCategoryId: string, value: number) {
    setQuantities((prev) => ({
      ...prev,
      [packageCategoryId]: Math.max(0, value),
    }));
  }

  const totalPrice = categoryExtras.reduce((sum, extra) => {
    const qty = getQuantity(extra.packageCategoryId);
    return sum + qty * Number(extra.pricePerItem);
  }, 0);

  const hasChanges = categoryExtras.some(
    (extra) => getQuantity(extra.packageCategoryId) !== extra.quantity
  );

  async function handleSave() {
    setSaving(true);
    try {
      const extrasPayload = categoryExtras
        .map((extra) => ({
          packageCategoryId: extra.packageCategoryId,
          quantity: getQuantity(extra.packageCategoryId),
        }))
        .filter((e) => e.quantity > 0);

      await updateReservation.mutateAsync({
        id: reservationId,
        input: {
          categoryExtras: extrasPayload,
          reason: 'Zmiana dodatkowych pozycji kategorii',
        },
      });

      toast({
        title: 'Zapisano',
        description: 'Dodatkowe pozycje zostały zaktualizowane.',
      });
      onSaved();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.message || 'Nie udało się zapisać zmian.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            Edytuj dodatkowo płatne pozycje
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {categoryExtras.map((extra) => {
            const qty = getQuantity(extra.packageCategoryId);
            const price = Number(extra.pricePerItem);
            const categoryName =
              extra.packageCategory?.category?.name || 'Kategoria';

            return (
              <div
                key={extra.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  qty > 0
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {categoryName}
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatCurrency(price)} / szt.
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(extra.packageCategoryId, qty - 1)}
                    disabled={qty === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={`w-8 text-center text-sm font-semibold ${
                      qty > 0
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(extra.packageCategoryId, qty + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {qty > 0 && (
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400 min-w-[60px] text-right">
                      {formatCurrency(qty * price)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalPrice > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-orange-200 dark:border-orange-800">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Razem:
            </span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Zapisz zmiany
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
