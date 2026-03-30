import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Utensils } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormState, SetFormState } from './types';
import { fmt } from './types';

interface EditItemsSectionProps {
  form: FormState;
  set: SetFormState;
  onAddItem: () => void;
  dishOptions: { value: string; label: string; description?: string; secondaryLabel?: string }[];
  dishesArray: any[];
  subtotal: number;
}

export function EditItemsSection({
  form,
  set,
  onAddItem,
  dishOptions,
  dishesArray,
  subtotal,
}: EditItemsSectionProps) {
  return (
    <div className="rounded-2xl border border-green-200 dark:border-green-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm shrink-0">
          <Utensils className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Dania</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-300">
            {form.items.length > 0
              ? `${form.items.length} ${form.items.length === 1 ? 'pozycja' : 'pozycje'} · ${fmt(subtotal)}`
              : 'Dodaj pozycje menu do zamówienia'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Dodaj danie
        </button>
      </div>

      {/* Items list */}
      <div className="p-4 space-y-3">
        {form.items.length === 0 && (
          <div className="text-center py-8">
            <Utensils className="h-8 w-8 text-green-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Brak dań — kliknij &quot;Dodaj danie&quot; aby rozpocząć</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {form.items.map((item, i) => (
            <motion.div
              key={item._key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all"
            >
              {/* Position badge */}
              <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-10">
                {i + 1}
              </div>

              {/* Row 1: Combobox + delete */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <Combobox
                    options={dishOptions}
                    value={item.dishId}
                    onChange={dishId => {
                      const dish = dishesArray.find((d: any) => d.id === dishId) as any;
                      const items = [...form.items];
                      items[i] = { ...items[i], dishId, unitPrice: dish?.price ?? items[i].unitPrice };
                      set({ items });
                    }}
                    placeholder="Wybierz danie..."
                    searchPlaceholder="Szukaj po nazwie..."
                    emptyMessage="Nie znaleziono dania"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set({ items: form.items.filter((_, j) => j !== i) })}
                  className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Row 2: Quantity + Price + Total */}
              <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3 py-2.5 border border-neutral-100 dark:border-neutral-700/50">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-neutral-500 dark:text-neutral-500 whitespace-nowrap">Ilość</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => {
                      const items = [...form.items];
                      items[i] = { ...items[i], quantity: parseInt(e.target.value, 10) || 1 };
                      set({ items });
                    }}
                    onFocus={e => e.target.select()}
                    className="w-16 h-8 text-center text-sm"
                  />
                </div>
                <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-xs text-neutral-500 dark:text-neutral-500 whitespace-nowrap">Cena jedn.</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => {
                      const items = [...form.items];
                      items[i] = { ...items[i], unitPrice: parseFloat(e.target.value) || 0 };
                      set({ items });
                    }}
                    onFocus={e => e.target.select()}
                    className="flex-1 h-8 text-sm"
                  />
                </div>
                {item.quantity > 0 && item.unitPrice > 0 && (
                  <>
                    <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Razem</p>
                      <p className="text-sm font-bold text-green-700 dark:text-green-300">
                        {fmt(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
