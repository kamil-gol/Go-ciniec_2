import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  User,
  CalendarDays,
  Package,
  Truck,
  Building2,
} from 'lucide-react';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { StepHeader } from './StepHeader';
import { formatDatePl, buildAddress } from './utils';
import type { WizardState, SetState } from './types';

interface StepSummaryProps {
  state: WizardState;
  set: SetState;
  selectedClient: any | undefined;
  goToStep: (index: number) => void;
}

export function StepSummary({ state, set, selectedClient, goToStep }: StepSummaryProps) {
  const formattedAddress = buildAddress(state.deliveryStreet, state.deliveryNumber, state.deliveryCity);

  return (
    <div className="space-y-6">
      <StepHeader stepIndex={5} />
      <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl space-y-4">
        <div>
          <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Dane kontaktowe</Label>
          <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">Wypełnione automatycznie z profilu klienta — możesz zmienić.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Osoba kontaktowa</Label>
            <Input placeholder="Imię i nazwisko" value={state.contactName} onChange={e => set({ contactName: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Telefon kontaktowy</Label>
            <Input placeholder="+48..." value={state.contactPhone} onChange={e => set({ contactPhone: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">E-mail kontaktowy</Label>
            <Input type="email" value={state.contactEmail} onChange={e => set({ contactEmail: e.target.value })} className="h-11" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uwagi</Label>
          <Textarea rows={3} value={state.notes} onChange={e => set({ notes: e.target.value })} placeholder="Dodatkowe informacje..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Specjalne wymagania</Label>
          <Textarea rows={2} value={state.specialRequirements} onChange={e => set({ specialRequirements: e.target.value })} placeholder="np. alergie, dieta bezglutenowa..." />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors" onClick={() => goToStep(0)}>
          <div className="flex items-center gap-2 mb-2">
            {selectedClient?.clientType === 'COMPANY' ? <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Klient</span>
          </div>
          {selectedClient ? (
            selectedClient.clientType === 'COMPANY' && selectedClient.companyName ? (
              <>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedClient.companyName}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{selectedClient.firstName} {selectedClient.lastName}</p>
              </>
            ) : (
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedClient?.firstName} {selectedClient?.lastName}</p>
            )
          ) : <p className="text-neutral-500">—</p>}
        </div>
        <div className="p-4 rounded-xl border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition-colors" onClick={() => goToStep(1)}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Szczegóły</span>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{state.eventName || '—'}</p>
          {state.eventDate && <p className="text-sm text-neutral-600 dark:text-neutral-300">{formatDatePl(state.eventDate)}</p>}
          {parseInt(state.guestsCount) > 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{state.guestsCount} osób</p>}
        </div>
        <div className="p-4 rounded-xl border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors" onClick={() => goToStep(3)}>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Menu</span>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            {state.items.length} {state.items.length === 1 ? 'danie' : state.items.length < 5 ? 'dania' : 'dań'}
          </p>
          {state.extras.length > 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{state.extras.length} usług dodatkowych</p>}
        </div>
        <div className="p-4 rounded-xl border bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-colors" onClick={() => goToStep(4)}>
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase">Logistyka</span>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{DELIVERY_TYPE_LABEL[state.deliveryType]}</p>
          {formattedAddress && <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate">{formattedAddress}</p>}
          {state.deliveryTime && <p className="text-sm text-neutral-600 dark:text-neutral-300">{state.deliveryType === 'PICKUP' ? 'Odbiór:' : 'Godzina:'} {state.deliveryTime}</p>}
          {state.eventDate && <p className="text-sm text-neutral-600 dark:text-neutral-300">{formatDatePl(state.eventDate)}</p>}
        </div>
      </div>
    </div>
  );
}
