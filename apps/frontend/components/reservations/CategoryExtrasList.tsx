'use client';

import { ShoppingCart, User, Baby } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { ReservationCategoryExtra } from '@/types';

interface CategoryExtrasListProps {
  reservationId: string;
  categoryExtras: ReservationCategoryExtra[];
  categoryExtrasTotal?: number;
  readOnly?: boolean;
  onUpdated?: () => void;
}

/** Short label for portionTarget */
function PortionBadge({ target }: { target?: string }) {
  if (!target || target === 'ALL') {
    return <span className="text-[10px] text-neutral-400">wszyscy</span>;
  }
  const isAdults = target === 'ADULTS_ONLY';
  const Icon = isAdults ? User : Baby;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
      isAdults ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'
    }`}>
      <Icon className="w-2.5 h-2.5" />
      {isAdults ? 'dorośli' : 'dzieci'}
    </span>
  );
}

/**
 * #216: Displays category extras on the reservation detail page.
 * Per-person pricing: quantity × pricePerItem × guestCount.
 * Edit only through DishSelector (Menu → Zmień button).
 */
export default function CategoryExtrasList({
  categoryExtras,
  categoryExtrasTotal,
}: CategoryExtrasListProps) {
  if (!categoryExtras || categoryExtras.length === 0) return null;

  const total =
    categoryExtrasTotal ??
    categoryExtras.reduce((sum, e) => sum + Number(e.totalPrice), 0);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Dodatkowo płatne porcje
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                Kategoria
              </th>
              <th className="text-center py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">
                Ilość
              </th>
              <th className="text-right py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">
                Cena/os.
              </th>
              <th className="text-center py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">
                Osoby
              </th>
              <th className="text-right py-2 pl-2 font-medium text-neutral-500 dark:text-neutral-400">
                Suma
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryExtras.map((extra) => {
              const qty = Number(extra.quantity);
              const guestCount = extra.guestCount ?? 1;
              return (
                <tr
                  key={extra.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <td className="py-2.5 pr-4">
                    <div className="text-neutral-900 dark:text-neutral-100">
                      {extra.packageCategory?.category?.name || 'Kategoria'}
                    </div>
                    <PortionBadge target={extra.portionTarget} />
                  </td>
                  <td className="py-2.5 px-2 text-center text-neutral-700 dark:text-neutral-300">
                    {qty === Math.floor(qty) ? qty : qty.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-neutral-700 dark:text-neutral-300">
                    {formatCurrency(Number(extra.pricePerItem))}
                  </td>
                  <td className="py-2.5 px-2 text-center text-neutral-700 dark:text-neutral-300">
                    {guestCount}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-medium text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(Number(extra.totalPrice))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-orange-200 dark:border-orange-800">
              <td
                colSpan={4}
                className="py-2.5 pr-4 text-right font-semibold text-neutral-900 dark:text-neutral-100"
              >
                Razem:
              </td>
              <td className="py-2.5 pl-2 text-right font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
