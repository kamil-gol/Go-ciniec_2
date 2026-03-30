// apps/frontend/components/audit-log/details/InfoGrid.tsx

import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, User, Tag, FileText } from 'lucide-react';
import { actionLabels, actionColors, entityLabels } from './constants';
import type { AuditLogEntry } from '@/types/audit-log.types';

interface InfoGridProps {
  log: AuditLogEntry;
}

export function InfoGrid({ log }: InfoGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
        <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
          <Calendar className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Data i czas</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {format(new Date(log.createdAt), 'd MMMM yyyy', { locale: pl })}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {format(new Date(log.createdAt), 'HH:mm:ss')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
        <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
          <User className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{'Użytkownik'}</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {log.user?.firstName || 'System'} {log.user?.lastName || ''}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{log.user?.email || 'Akcja automatyczna'}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
        <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
          <Tag className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Wykonana akcja</p>
          <Badge
            variant="outline"
            className={`mt-1.5 text-xs font-medium ${actionColors[log.action] || 'bg-zinc-100 text-zinc-600'}`}
          >
            {actionLabels[log.action] || log.action}
          </Badge>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
        <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
          <FileText className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Typ obiektu</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {entityLabels[log.entityType] || log.entityType}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
            {'ID: '}{log.entityId}
          </p>
        </div>
      </div>
    </div>
  );
}
