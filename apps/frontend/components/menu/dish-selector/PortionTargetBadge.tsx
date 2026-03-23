'use client';

import { User, Baby } from 'lucide-react';
import type { PortionTarget } from '@/types/menu';
import { PORTION_TARGET_LABELS } from '@/types/menu';

/** #166: Portion target badge for category header */
export function PortionTargetBadge({ target }: { target?: PortionTarget | string }) {
  if (!target || target === 'ALL') return null;

  const isAdults = target === 'ADULTS_ONLY';
  const Icon = isAdults ? User : Baby;
  const label = PORTION_TARGET_LABELS[target as PortionTarget] || target;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      isAdults
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
    }`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
