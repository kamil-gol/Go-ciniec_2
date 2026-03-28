import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StepHeader } from './StepHeader';
import { formatPln } from './utils';
import type { SetState } from './types';

interface StepTemplateProps {
  templateId: string;
  packageId: string;
  set: SetState;
  templates: any[] | undefined;
  templatePackages: { id: string; name: string; basePrice: number }[] | null;
}

export function StepTemplate({
  templateId,
  packageId,
  set,
  templates,
  templatePackages,
}: StepTemplateProps) {
  return (
    <div className="space-y-6">
      <StepHeader stepIndex={2} />
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">1</div>
          <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Szablon cateringu</Label>
          <span className="text-xs text-neutral-500 dark:text-neutral-300">(opcjonalnie)</span>
        </div>
        <Select
          value={templateId || 'NONE'}
          onValueChange={v => set({ templateId: v === 'NONE' ? '' : v, packageId: '' })}
        >
          <SelectTrigger className="h-9 bg-white dark:bg-neutral-900">
            <SelectValue placeholder="Wybierz szablon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">— Bez szablonu —</SelectItem>
            {templates?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {templatePackages && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">2</div>
            <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Pakiet cenowy</Label>
            <span className="text-xs text-neutral-500 dark:text-neutral-300">(opcjonalnie)</span>
          </div>
          <Select
            value={packageId || 'NONE'}
            onValueChange={v => set({ packageId: v === 'NONE' ? '' : v })}
          >
            <SelectTrigger className="h-9 bg-white dark:bg-neutral-900">
              <SelectValue placeholder="Wybierz pakiet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">— Bez pakietu —</SelectItem>
              {templatePackages.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {formatPln(p.basePrice)} / os.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {!templateId && (
        <p className="text-sm text-neutral-500 dark:text-neutral-300 text-center py-2">
          Możesz pominąć ten krok — szablon i pakiet nie są wymagane.
        </p>
      )}
    </div>
  );
}
