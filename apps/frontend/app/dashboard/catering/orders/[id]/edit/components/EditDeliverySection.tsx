import { Truck, CalendarDays, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CateringDeliveryType } from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { SectionBlock } from './SectionBlock';
import type { FormState, SetFormState } from './types';

interface EditDeliverySectionProps {
  form: FormState;
  set: SetFormState;
}

export function EditDeliverySection({ form, set }: EditDeliverySectionProps) {
  return (
    <SectionBlock
      icon={Truck}
      title="Logistyka dostawy"
      subtitle="Sposób i adres dostarczenia zamówienia"
      colorFrom="from-rose-50"
      colorTo="to-pink-50"
      borderColor="border-rose-200 dark:border-rose-800"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Typ dostawy</Label>
          <Select
            value={form.deliveryType}
            onValueChange={v => set({ deliveryType: v as CateringDeliveryType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(DELIVERY_TYPE_LABEL) as [
                  CateringDeliveryType,
                  string,
                ][]
              ).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.deliveryType !== 'PICKUP' && (
          <>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Adres dostawy
              </Label>
              <Textarea
                value={form.deliveryAddress}
                onChange={e => set({ deliveryAddress: e.target.value })}
                rows={2}
                placeholder="ul. Kwiatowa 15, 30-001 Kraków"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" /> Data dostawy
              </Label>
              <Input
                type="date"
                value={form.deliveryDate}
                onChange={e => set({ deliveryDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Godzina dostawy
              </Label>
              <Input
                type="time"
                value={form.deliveryTime}
                onChange={e => set({ deliveryTime: e.target.value })}
              />
            </div>
          </>
        )}
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uwagi do logistyki</Label>
          <Textarea
            value={form.deliveryNotes}
            onChange={e => set({ deliveryNotes: e.target.value })}
            rows={2}
            placeholder="Dodatkowe informacje dot. dostawy..."
          />
        </div>
      </div>
    </SectionBlock>
  );
}
