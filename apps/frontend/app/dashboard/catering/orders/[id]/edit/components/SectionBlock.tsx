import type React from 'react';

interface SectionBlockProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionBlock({
  icon: Icon,
  title,
  subtitle,
  colorFrom,
  colorTo,
  borderColor,
  children,
  action,
}: SectionBlockProps) {
  return (
    <div className={`rounded-2xl border ${borderColor} overflow-hidden shadow-sm bg-white dark:bg-neutral-900`}>
      <div className={`flex items-center gap-3 px-5 py-4 bg-gradient-to-r ${colorFrom} ${colorTo} border-b ${borderColor}`}>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorFrom.replace('from-', 'from-').replace('-50', '-500')} ${colorTo.replace('to-', 'to-').replace('-50', '-500')} flex items-center justify-center shadow-sm shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
