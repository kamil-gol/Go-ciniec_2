import { STEPS, STEP_META } from './types';

interface StepHeaderProps {
  stepIndex: number;
}

export function StepHeader({ stepIndex }: StepHeaderProps) {
  const meta = STEP_META[stepIndex];
  const StepIcon = STEPS[stepIndex].icon;
  return (
    <div className="text-center mb-6">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${meta.gradient} text-white mb-3`}>
        <StepIcon className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{meta.title}</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">{meta.subtitle}</p>
    </div>
  );
}
