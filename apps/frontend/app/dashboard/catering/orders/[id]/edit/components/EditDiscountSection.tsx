import { Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CateringDiscountType } from '@/types/catering-order.types';
import { SectionBlock } from './SectionBlock';
import type { FormState, SetFormState, Totals } from './types';
import { fmt } from './types';

interface EditDiscountSectionProps {
  form: FormState;
  set: SetFormState;
  totals: Totals | null;
}

export function EditDiscountSection({ form, set, totals }: EditDiscountSectionProps) {
  return (
    <SectionBlock
      icon={Percent}
      title="Rabat"
      subtitle={totals && totals.discountAmount > 0 ? `Aktywny rabat: −${fmt(totals.discountAmount)}` : 'Opcjonalny rabat na zamówienie'}
      colorFrom="from-primary-50"
      colorTo="to-purple-50"
      borderColor="border-violet-200 dark:border-violet-800"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Typ rabatu</Label>
          <Select
            value={form.discountType || 'NONE'}
            onValueChange={v =>
              set({
                discountType:
                  v === 'NONE' ? '' : (v as CateringDiscountType),
                discountValue: '',
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">— Brak —</SelectItem>
              <SelectItem value="PERCENTAGE">Procent (%)</SelectItem>
              <SelectItem value="AMOUNT">Kwota (zł)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.discountType && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {form.discountType === 'PERCENTAGE'
                ? 'Wartość (%)'
                : 'Kwota (zł)'}
            </Label>
            <Input
              type="number"
              min={0}
              step={form.discountType === 'PERCENTAGE' ? '1' : '0.01'}
              value={form.discountValue}
              onChange={e => set({ discountValue: e.target.value })}
              onFocus={e => e.target.select()}
            />
          </div>
        )}
        <div className="sm:col-span-3 space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Powód rabatu</Label>
          <Input
            value={form.discountReason}
            onChange={e => set({ discountReason: e.target.value })}
            placeholder="np. Stały klient, promocja świąteczna"
          />
        </div>
      </div>
    </SectionBlock>
  );
}
