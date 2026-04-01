import { AnimatePresence, motion } from 'framer-motion';
import { motionTokens } from '@/lib/design-tokens';
import { Plus, Trash2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormState, SetFormState } from './types';
import { fmt } from './types';

interface EditExtrasSectionProps {
  form: FormState;
  set: SetFormState;
  onAddExtra: () => void;
  extrasTotalPrice: number;
}

export function EditExtrasSection({
  form,
  set,
  onAddExtra,
  extrasTotalPrice,
}: EditExtrasSectionProps) {
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm shrink-0">
          <Star className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Usługi dodatkowe</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-300">
            {form.extras.length > 0
              ? `${form.extras.length} ${form.extras.length === 1 ? 'usługa' : 'usługi'} · ${fmt(extrasTotalPrice)}`
              : 'Dodaj usługi dodatkowe do zamówienia'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddExtra}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Dodaj usługę
        </button>
      </div>

      {/* Extras list */}
      <div className="p-4 space-y-3">
        {form.extras.length === 0 && (
          <div className="text-center py-8">
            <Star className="h-8 w-8 text-amber-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Brak usług dodatkowych — kliknij &quot;Dodaj usługę&quot;</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {form.extras.map((extra, i) => (
            <motion.div
              key={extra._key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: motionTokens.duration.fast }}
              className="relative p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all"
            >
              {/* Position badge */}
              <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-10">
                {i + 1}
              </div>

              {/* Row 1: Name + delete */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Nazwa usługi (np. Kelner, Dekoracje)"
                    value={extra.name}
                    onChange={e => {
                      const extras = [...form.extras];
                      extras[i] = { ...extras[i], name: e.target.value };
                      set({ extras });
                    }}
                    className="h-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set({ extras: form.extras.filter((_, j) => j !== i) })}
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
                    value={extra.quantity}
                    onChange={e => {
                      const extras = [...form.extras];
                      extras[i] = { ...extras[i], quantity: parseInt(e.target.value, 10) || 1 };
                      set({ extras });
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
                    value={extra.unitPrice}
                    onChange={e => {
                      const extras = [...form.extras];
                      extras[i] = { ...extras[i], unitPrice: parseFloat(e.target.value) || 0 };
                      set({ extras });
                    }}
                    onFocus={e => e.target.select()}
                    className="flex-1 h-8 text-sm"
                  />
                </div>
                {extra.quantity > 0 && extra.unitPrice > 0 && (
                  <>
                    <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Razem</p>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {fmt(extra.quantity * extra.unitPrice)}
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
