import { CalendarDays, Clock, MapPin, Users, CalendarCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionBlock } from './SectionBlock';
import type { FormState, SetFormState } from './types';

interface EditEventSectionProps {
  form: FormState;
  set: SetFormState;
}

export function EditEventSection({ form, set }: EditEventSectionProps) {
  return (
    <SectionBlock
      icon={CalendarDays}
      title="Wydarzenie"
      subtitle="Szczegóły dotyczące okazji i terminu realizacji"
      colorFrom="from-orange-50"
      colorTo="to-amber-50"
      borderColor="border-orange-200 dark:border-orange-800"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Nazwa wydarzenia</Label>
          <Input
            value={form.eventName}
            onChange={e => set({ eventName: e.target.value })}
            placeholder="np. Wesele Kowalskich"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> Data
          </Label>
          <Input
            type="date"
            value={form.eventDate}
            onChange={e => set({ eventDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Godzina
          </Label>
          <Input
            type="time"
            value={form.eventTime}
            onChange={e => set({ eventTime: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Miejsce
          </Label>
          <Input
            value={form.eventLocation}
            onChange={e => set({ eventLocation: e.target.value })}
            placeholder="np. Sala bankietowa Belvedere"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Liczba gości
          </Label>
          <Input
            type="number"
            min={0}
            value={form.guestsCount}
            onChange={e => set({ guestsCount: e.target.value })}
            onFocus={e => e.target.select()}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-3 h-3" /> Oferta ważna do
          </Label>
          <Input
            type="date"
            value={form.quoteExpiresAt}
            onChange={e => set({ quoteExpiresAt: e.target.value })}
          />
        </div>
      </div>
    </SectionBlock>
  );
}
