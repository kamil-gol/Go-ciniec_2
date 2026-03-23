// apps/frontend/components/audit-log/details/MetadataSection.tsx

import { Globe, Monitor, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditLogEntry } from '@/types/audit-log.types';

interface MetadataSectionProps {
  log: AuditLogEntry;
  showTechnical: boolean;
  onToggle: () => void;
}

export function MetadataSection({ log, showTechnical, onToggle }: MetadataSectionProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors rounded-xl"
      >
        <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Informacje techniczne
        </h4>
        {showTechnical ? (
          <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        )}
      </button>
      {showTechnical && (
        <div className="px-4 pb-4 pt-0">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              <span className="text-xs text-zinc-500">Adres IP:</span>
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                {log.ipAddress || 'Nieznany'}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Monitor className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              <span className="text-xs text-zinc-500 flex-shrink-0">{'Przeglądarka:'}</span>
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                {log.userAgent ? log.userAgent.split(' ').slice(0, 3).join(' ') : 'Nieznana'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-700">
            <Hash className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-xs text-zinc-500">ID wpisu:</span>
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all break-all">{log.id}</span>
          </div>

          {/* Raw JSON fallback — for developers */}
          {log.details && (
            <div className="mt-3 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Surowe dane (JSON)</p>
              <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-3 text-[11px] overflow-auto max-h-36 font-mono leading-relaxed">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
