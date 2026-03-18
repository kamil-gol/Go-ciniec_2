'use client';

import { useState } from 'react';
import { ShoppingCart, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { ReservationCategoryExtra } from '@/types';
import CategoryExtrasEditModal from './CategoryExtrasEditModal';

interface CategoryExtrasListProps {
  reservationId: string;
  categoryExtras: ReservationCategoryExtra[];
  categoryExtrasTotal?: number;
  readOnly?: boolean;
  onUpdated?: () => void;
}

/**
 * #216: Displays category extras on the reservation detail page.
 * Shows a table of extra items per category with quantity, unit price, and total.
 */
export default function CategoryExtrasList({
  reservationId,
  categoryExtras,
  categoryExtrasTotal,
  readOnly = false,
  onUpdated,
}: CategoryExtrasListProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  if (!categoryExtras || categoryExtras.length === 0) return null;

  const total =
    categoryExtrasTotal ??
    categoryExtras.reduce((sum, e) => sum + Number(e.totalPrice), 0);

  return (
    <>
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              Dodatkowo płatne pozycje
            </h3>
          </div>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edytuj
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Kategoria
                </th>
                <th className="text-center py-2 px-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Ilość
                </th>
                <th className="text-right py-2 px-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Cena/szt.
                </th>
                <th className="text-right py-2 pl-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Suma
                </th>
              </tr>
            </thead>
            <tbody>
              {categoryExtras.map((extra) => (
                <tr
                  key={extra.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <td className="py-2.5 pr-4 text-neutral-900 dark:text-neutral-100">
                    {extra.packageCategory?.category?.name || 'Kategoria'}
                  </td>
                  <td className="py-2.5 px-4 text-center text-neutral-700 dark:text-neutral-300">
                    {extra.quantity}
                  </td>
                  <td className="py-2.5 px-4 text-right text-neutral-700 dark:text-neutral-300">
                    {formatCurrency(Number(extra.pricePerItem))}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(Number(extra.totalPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-orange-200 dark:border-orange-800">
                <td
                  colSpan={3}
                  className="py-2.5 pr-4 text-right font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  Razem:
                </td>
                <td className="py-2.5 pl-4 text-right font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {showEditModal && (
        <CategoryExtrasEditModal
          reservationId={reservationId}
          categoryExtras={categoryExtras}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            onUpdated?.();
          }}
        />
      )}
    </>
  );
}
