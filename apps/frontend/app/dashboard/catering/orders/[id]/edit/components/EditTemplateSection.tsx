import { BookOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackageCards } from '../../../components/PackageCards';
import { SectionBlock } from './SectionBlock';
import type { FormState, SetFormState } from './types';

interface EditTemplateSectionProps {
  form: FormState;
  set: SetFormState;
  templates: { id: string; name: string; packages?: { id: string; name: string; basePrice: number }[] }[] | undefined;
}

export function EditTemplateSection({ form, set, templates }: EditTemplateSectionProps) {
  const selectedTemplate = templates?.find(t => t.id === form.templateId);
  const templatePackages = selectedTemplate?.packages as
    | { id: string; name: string; basePrice: number }[]
    | undefined;

  return (
    <SectionBlock
      icon={BookOpen}
      title="Szablon i pakiet"
      subtitle="Opcjonalnie wybierz gotowy szablon cateringu"
      colorFrom="from-blue-50"
      colorTo="to-cyan-50"
      borderColor="border-blue-200 dark:border-blue-800"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Szablon</Label>
          <Select
            value={form.templateId || 'NONE'}
            onValueChange={v =>
              set({ templateId: v === 'NONE' ? '' : v, packageId: '' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="— Bez szablonu —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">— Bez szablonu —</SelectItem>
              {templates?.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {templatePackages && templatePackages.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Pakiet</Label>
            <PackageCards
              packages={templatePackages}
              selectedId={form.packageId}
              onSelect={pkgId => set({ packageId: pkgId })}
            />
          </div>
        )}
      </div>
    </SectionBlock>
  );
}
