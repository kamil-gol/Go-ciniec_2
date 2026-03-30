import { motion } from 'framer-motion';
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
import { Clock, MapPin, ShoppingBag, Info, Home, Truck } from 'lucide-react';
import type { CateringDeliveryType } from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { StepHeader } from './StepHeader';
import { formatDatePl } from './utils';
import type { WizardState, SetState } from './types';

interface StepDeliveryProps {
  state: Pick<WizardState, 'deliveryType' | 'deliveryStreet' | 'deliveryNumber' | 'deliveryCity' | 'deliveryTime' | 'deliveryNotes' | 'eventDate'>;
  set: SetState;
  isStep4Valid: boolean;
}

export function StepDelivery({ state, set, isStep4Valid }: StepDeliveryProps) {
  const addressSection = (label: string) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
        <Home className="w-3.5 h-3.5" />
        {label}
        <span className="text-red-500">*</span>
      </Label>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-neutral-500 dark:text-neutral-500 font-normal flex items-center gap-1">
            Ulica <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="np. ul. Kwiatowa"
            value={state.deliveryStreet}
            onChange={e => set({ deliveryStreet: e.target.value })}
            className={`h-10 ${!state.deliveryStreet.trim() ? 'border-red-300 dark:border-red-700' : ''}`}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-neutral-500 dark:text-neutral-500 font-normal flex items-center gap-1">
            Numer <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="12A"
            value={state.deliveryNumber}
            onChange={e => set({ deliveryNumber: e.target.value })}
            className={`h-10 ${!state.deliveryNumber.trim() ? 'border-red-300 dark:border-red-700' : ''}`}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-neutral-500 dark:text-neutral-500 font-normal flex items-center gap-1">
          Miasto <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="np. Katowice"
          value={state.deliveryCity}
          onChange={e => set({ deliveryCity: e.target.value })}
          className={`h-10 ${!state.deliveryCity.trim() ? 'border-red-300 dark:border-red-700' : ''}`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <StepHeader stepIndex={4} />
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Typ realizacji</Label>
        <Select
          value={state.deliveryType}
          onValueChange={v => set({
            deliveryType: v as CateringDeliveryType,
            deliveryStreet: '',
            deliveryNumber: '',
            deliveryCity: '',
            deliveryTime: '',
          })}
        >
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(DELIVERY_TYPE_LABEL) as [CateringDeliveryType, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.deliveryType === 'PICKUP' && (
        <motion.div key="pickup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Odbiór osobisty</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Godzina odbioru <span className="text-red-500">*</span>
            </Label>
            <Input type="time" value={state.deliveryTime} onChange={e => set({ deliveryTime: e.target.value })}
              className={`h-9 max-w-[160px] ${!state.deliveryTime ? 'border-red-300 dark:border-red-700' : ''}`} />
          </div>
          {state.eventDate && (
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0" /> Data odbioru: <strong>{formatDatePl(state.eventDate)}</strong>
            </p>
          )}
        </motion.div>
      )}

      {state.deliveryType === 'ON_SITE' && (
        <motion.div key="on-site" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">U klienta</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Godzina przyjazdu <span className="text-red-500">*</span>
            </Label>
            <Input type="time" value={state.deliveryTime} onChange={e => set({ deliveryTime: e.target.value })}
              className={`h-9 max-w-[160px] ${!state.deliveryTime ? 'border-red-300 dark:border-red-700' : ''}`} />
          </div>
          {addressSection('Adres klienta')}
          {state.eventDate && (
            <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0" /> Data przyjazdu: <strong>{formatDatePl(state.eventDate)}</strong>
            </p>
          )}
        </motion.div>
      )}

      {state.deliveryType === 'DELIVERY' && (
        <motion.div key="delivery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">Dostawa</span>
          </div>
          {state.eventDate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
              <Info className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Data dostawy: <strong>{formatDatePl(state.eventDate)}</strong> (z kroku Szczegóły)
              </p>
            </div>
          )}
          {addressSection('Adres dostawy')}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Godzina dostawy <span className="text-red-500">*</span>
            </Label>
            <Input type="time" value={state.deliveryTime} onChange={e => set({ deliveryTime: e.target.value })}
              className={`h-9 max-w-[160px] ${!state.deliveryTime ? 'border-red-300 dark:border-red-700' : ''}`} />
          </div>
        </motion.div>
      )}

      {!isStep4Valid && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <Info className="w-4 h-4 shrink-0" />
          {state.deliveryType === 'PICKUP' ? 'Podaj godzinę odbioru' : 'Podaj godzinę oraz miasto, aby przejść dalej'}
        </p>
      )}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uwagi do logistyki</Label>
        <Textarea value={state.deliveryNotes} onChange={e => set({ deliveryNotes: e.target.value })} rows={2}
          placeholder="Dodatkowe instrukcje, dostęp do obiektu..." />
      </div>
    </div>
  );
}
