'use client';

import { Tag, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VAR_LABELS } from './constants';

interface VariablePickerProps {
  availableVars: string[];
  insertedVar: string | null;
  onInsert: (varName: string) => void;
}

export function VariablePicker({ availableVars, insertedVar, onInsert }: VariablePickerProps) {
  if (!availableVars || availableVars.length === 0) return null;

  return (
    <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-3">
      <p className="mb-2 text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Dostępne zmienne
        <span className="text-muted-foreground/60">
          — kliknij aby wstawić w pozycji kursora
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {availableVars.map((v) => (
          <button
            key={v}
            onClick={() => onInsert(v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
              'text-xs transition-all duration-200 cursor-pointer',
              'border border-neutral-200 dark:border-neutral-700',
              'hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700',
              'dark:hover:border-cyan-700 dark:hover:bg-cyan-950 dark:hover:text-cyan-300',
              insertedVar === v
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-neutral-800 text-foreground'
            )}
            title={VAR_LABELS[v] || v}
          >
            {insertedVar === v ? (
              <Check className="h-3 w-3" />
            ) : (
              <Tag className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="font-medium">{VAR_LABELS[v] || v}</span>
            <code className="text-[10px] text-muted-foreground/60 font-mono">
              {`{{${v}}}`}
            </code>
          </button>
        ))}
      </div>
    </div>
  );
}
