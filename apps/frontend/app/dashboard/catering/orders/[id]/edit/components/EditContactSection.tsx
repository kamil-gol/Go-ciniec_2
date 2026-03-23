import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionBlock } from './SectionBlock';
import type { FormState, SetFormState } from './types';

interface EditContactSectionProps {
  form: FormState;
  set: SetFormState;
}

export function EditContactSection({ form, set }: EditContactSectionProps) {
  return (
    <SectionBlock
      icon={User}
      title="Kontakt do zamówienia"
      subtitle="Dane kontaktowe osoby odpowiedzialnej"
      colorFrom="from-indigo-50"
      colorTo="to-blue-50"
      borderColor="border-indigo-200 dark:border-indigo-800"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Imię i nazwisko</Label>
          <Input
            value={form.contactName}
            onChange={e => set({ contactName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Telefon</Label>
          <Input
            value={form.contactPhone}
            onChange={e => set({ contactPhone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">E-mail</Label>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={e => set({ contactEmail: e.target.value })}
          />
        </div>
      </div>
    </SectionBlock>
  );
}
