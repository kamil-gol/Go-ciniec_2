import { motion } from 'framer-motion';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Utensils, Star } from 'lucide-react';
import { StepHeader } from './StepHeader';
import { formatPln } from './utils';
import type { WizardState, SetState } from './types';

interface StepItemsProps {
  state: Pick<WizardState, 'items' | 'extras'>;
  set: SetState;
  dishOptions: { value: string; label: string; description?: string; secondaryLabel?: string }[];
  dishesArray: any[];
}

export function StepItems({ state, set, dishOptions, dishesArray }: StepItemsProps) {
  const totalDishes = state.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const totalExtras = state.extras.reduce((s, extra) => s + extra.quantity * extra.unitPrice, 0);
  const grandTotal = totalDishes + totalExtras;

  return (
    <div className="space-y-5">
      <StepHeader stepIndex={3} />

      {/* Pasek lacznej wartosci */}
      {grandTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-md"
        >
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Wartość zamówienia</p>
            <p className="text-2xl font-extrabold mt-0.5">{formatPln(grandTotal)}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {totalDishes > 0 && (
              <div className="text-center">
                <p className="font-bold">{formatPln(totalDishes)}</p>
                <p className="text-xs text-white/70">Dania</p>
              </div>
            )}
            {totalExtras > 0 && (
              <div className="text-center">
                <p className="font-bold">{formatPln(totalExtras)}</p>
                <p className="text-xs text-white/70">Usługi</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* SEKCJA DAN */}
      <div className="rounded-2xl border border-green-200 dark:border-green-800 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm shrink-0">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Dania</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {state.items.length > 0
                ? `${state.items.length} ${state.items.length === 1 ? 'pozycja' : state.items.length < 5 ? 'pozycje' : 'pozycji'} · ${formatPln(totalDishes)}`
                : 'Dodaj pozycje menu do zamówienia'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set({ items: [...state.items, { dishId: '', quantity: 1, unitPrice: 0 }] })}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Dodaj danie
          </button>
        </div>

        <div className="p-4 space-y-3 bg-white dark:bg-neutral-900/30">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <Utensils className="w-7 h-7 text-green-400 dark:text-green-500" />
              </div>
              <p className="font-semibold text-neutral-500 dark:text-neutral-400">Brak dań</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                Możesz dodać je teraz lub uzupełnić później
              </p>
            </div>
          ) : (
            state.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all"
              >
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-10">
                  {i + 1}
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <Combobox
                      options={dishOptions}
                      value={item.dishId}
                      onChange={dishId => {
                        const dish = dishesArray.find((d: any) => d.id === dishId) as any;
                        const items = [...state.items];
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
                    onClick={() => set({ items: state.items.filter((_, j) => j !== i) })}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3 py-2.5 border border-neutral-100 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Ilość</Label>
                    <Input
                      type="number" min={1} value={item.quantity}
                      onFocus={e => e.target.select()}
                      onChange={e => { const items = [...state.items]; items[i] = { ...items[i], quantity: parseInt(e.target.value, 10) || 1 }; set({ items }); }}
                      className="w-16 h-8 text-center text-sm"
                    />
                  </div>
                  <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Cena jedn.</Label>
                    <Input
                      type="number" min={0} step="0.01" value={item.unitPrice}
                      onFocus={e => e.target.select()}
                      onChange={e => { const items = [...state.items]; items[i] = { ...items[i], unitPrice: parseFloat(e.target.value) || 0 }; set({ items }); }}
                      className={`flex-1 h-8 text-sm ${item.unitPrice === 0 && item.dishId ? 'border-amber-400 dark:border-amber-600' : ''}`}
                    />
                  </div>
                  {item.quantity > 0 && item.unitPrice > 0 && (
                    <>
                      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Razem</p>
                        <p className="text-sm font-bold text-green-700 dark:text-green-300">
                          {formatPln(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* SEKCJA USLUG DODATKOWYCH */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm shrink-0">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Usługi dodatkowe</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {state.extras.length > 0
                ? `${state.extras.length} ${state.extras.length === 1 ? 'pozycja' : state.extras.length < 5 ? 'pozycje' : 'pozycji'} · ${formatPln(totalExtras)}`
                : 'Obsługa kelnerska, wynajem sprzętu, dekoracje…'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set({ extras: [...state.extras, { name: '', quantity: 1, unitPrice: 0 }] })}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Dodaj
          </button>
        </div>

        <div className="p-4 space-y-3 bg-white dark:bg-neutral-900/30">
          {state.extras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                <Star className="w-7 h-7 text-amber-400 dark:text-amber-500" />
              </div>
              <p className="font-semibold text-neutral-500 dark:text-neutral-400">Brak usług dodatkowych</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                Kelnerzy, wynajem sprzętu, dekoracje…
              </p>
            </div>
          ) : (
            state.extras.map((extra, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all"
              >
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-10">
                  {i + 1}
                </div>

                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="np. obsługa kelnerska, wynajem sprzętu..."
                    value={extra.name}
                    onChange={e => { const extras = [...state.extras]; extras[i] = { ...extras[i], name: e.target.value }; set({ extras }); }}
                    className="flex-1 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => set({ extras: state.extras.filter((_, j) => j !== i) })}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3 py-2.5 border border-neutral-100 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Ilość</Label>
                    <Input
                      type="number" min={1} value={extra.quantity}
                      onFocus={e => e.target.select()}
                      onChange={e => { const extras = [...state.extras]; extras[i] = { ...extras[i], quantity: parseInt(e.target.value, 10) || 1 }; set({ extras }); }}
                      className="w-16 h-8 text-center text-sm"
                    />
                  </div>
                  <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Cena jedn.</Label>
                    <Input
                      type="number" min={0} step="0.01" value={extra.unitPrice}
                      onFocus={e => e.target.select()}
                      onChange={e => { const extras = [...state.extras]; extras[i] = { ...extras[i], unitPrice: parseFloat(e.target.value) || 0 }; set({ extras }); }}
                      className={`flex-1 h-8 text-sm ${extra.unitPrice === 0 && extra.name.trim() ? 'border-amber-400 dark:border-amber-600' : ''}`}
                    />
                  </div>
                  {extra.quantity > 0 && extra.unitPrice > 0 && (
                    <>
                      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Razem</p>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          {formatPln(extra.quantity * extra.unitPrice)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
