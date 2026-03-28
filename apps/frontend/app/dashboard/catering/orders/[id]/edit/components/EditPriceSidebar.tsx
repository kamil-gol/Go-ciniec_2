import { Calculator, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { FormState, Totals } from './types';
import { fmt } from './types';

interface EditPriceSidebarProps {
  form: FormState;
  totals: Totals | null;
  clientName: string;
  orderNumber: string | undefined;
  orderTotalPrice: number;
  isPending: boolean;
  onSave: () => void;
}

export function EditPriceSidebar({
  form,
  totals,
  clientName,
  orderNumber,
  orderTotalPrice,
  isPending,
  onSave,
}: EditPriceSidebarProps) {
  return (
    <div className="sticky top-6 space-y-4">

      {/* Live kalkulator */}
      <div className="rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <Calculator className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Kalkulator ceny</h3>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
        <div className="p-5 space-y-3 text-sm bg-white dark:bg-neutral-900">
          {totals && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 dark:text-neutral-300">
                  Dania ({form.items.length} poz.)
                </span>
                <span className="font-mono font-medium">{fmt(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 dark:text-neutral-300">
                  Usługi ({form.extras.length} poz.)
                </span>
                <span className="font-mono font-medium">{fmt(totals.extrasTotalPrice)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <span>
                    Rabat
                    {form.discountType === 'PERCENTAGE' && form.discountValue
                      ? ` (${form.discountValue}%)`
                      : ''}
                  </span>
                  <span className="font-mono font-medium">
                    −{fmt(totals.discountAmount)}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Razem</span>
                <span className="font-mono text-orange-600 dark:text-orange-400">
                  {fmt(totals.totalPrice)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kontekst zamówienia */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Informacje</h3>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Klient</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{clientName}</p>
          </div>
          <Separator />
          <div>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Numer zamówienia</p>
            <p className="font-mono text-neutral-900 dark:text-neutral-100">{orderNumber}</p>
          </div>
          <Separator />
          <div>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Aktualna cena w bazie</p>
            <p className="font-mono text-neutral-500">{fmt(orderTotalPrice)}</p>
          </div>
        </div>
      </div>

      {/* Sticky save button */}
      <Button
        onClick={onSave}
        disabled={isPending}
        size="lg"
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Zapisz zmiany
      </Button>
    </div>
  );
}
