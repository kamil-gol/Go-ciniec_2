'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, icon: Icon, children, className }: FormSectionProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-neutral-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80 p-5 sm:p-6',
      className
    )}>
      <div className="flex items-start gap-3 mb-5">
        {Icon && (
          <div className="flex-shrink-0 p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
