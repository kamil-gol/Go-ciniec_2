import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepHeader } from './StepHeader';
import type { WizardState, SetState } from './types';

interface StepEventDetailsProps {
  state: Pick<WizardState, 'eventName' | 'eventDate' | 'guestsCount'>;
  set: SetState;
}

export function StepEventDetails({ state, set }: StepEventDetailsProps) {
  return (
    <div className="space-y-6">
      <StepHeader stepIndex={1} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Okazja / cel zamówienia</Label>
          <Input
            placeholder="np. Komunia, impreza firmowa, urodziny..."
            value={state.eventName}
            onChange={e => set({ eventName: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Data realizacji</Label>
          <Input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            max="2099-12-31"
            value={state.eventDate}
            onChange={e => set({ eventDate: e.target.value })}
            className="h-11"
          />
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Ta data będzie użyta również jako data dostawy
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Liczba osób</Label>
          <Input
            type="number"
            min={0}
            value={state.guestsCount}
            onChange={e => set({ guestsCount: e.target.value })}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}
