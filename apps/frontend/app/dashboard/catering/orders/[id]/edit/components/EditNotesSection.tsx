import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SectionBlock } from './SectionBlock';
import type { FormState, SetFormState } from './types';

interface EditNotesSectionProps {
  form: FormState;
  set: SetFormState;
}

export function EditNotesSection({ form, set }: EditNotesSectionProps) {
  return (
    <SectionBlock
      icon={FileText}
      title="Uwagi"
      subtitle="Dodatkowe informacje i specjalne wymagania"
      colorFrom="from-neutral-50"
      colorTo="to-slate-50"
      borderColor="border-neutral-200 dark:border-neutral-700"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uwagi (widoczne dla klienta)</Label>
          <Textarea
            rows={3}
            value={form.notes}
            onChange={e => set({ notes: e.target.value })}
            placeholder="Informacje widoczne na ofercie/zamówieniu klienta..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uwagi wewnętrzne</Label>
          <Textarea
            rows={3}
            value={form.internalNotes}
            onChange={e => set({ internalNotes: e.target.value })}
            placeholder="Notatki widoczne tylko dla zespołu..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Specjalne wymagania</Label>
          <Textarea
            rows={2}
            value={form.specialRequirements}
            onChange={e => set({ specialRequirements: e.target.value })}
            placeholder="Alergie, diety, wymagania organizacyjne..."
          />
        </div>
      </div>
    </SectionBlock>
  );
}
