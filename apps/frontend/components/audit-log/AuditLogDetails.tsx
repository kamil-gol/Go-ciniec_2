// apps/frontend/components/audit-log/AuditLogDetails.tsx
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { FileText, Hash } from 'lucide-react';
import { useState } from 'react';
import type { AuditLogEntry } from '@/types/audit-log.types';
import { DetailsVisualization, InfoGrid, MetadataSection } from './details';

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  log: AuditLogEntry;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetails({ log, open, onClose }: Props) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl !p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-zinc-800 via-zinc-700 to-neutral-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-neutral-800 px-6 py-5 flex-shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{'Szczegóły wpisu'}</h2>
              <p className="text-sm text-white/60">
                {format(new Date(log.createdAt), 'd MMMM yyyy, HH:mm:ss', { locale: pl })}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Info Grid */}
          <InfoGrid log={log} />

          {/* Szczegóły zmiany — Premium visualization */}
          {log.details && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <Hash className="h-4 w-4 text-zinc-500" />
                  {'Szczegóły zmiany'}
                </h4>
              </div>
              <div className="p-4">
                <DetailsVisualization details={log.details} action={log.action} />
              </div>
            </div>
          )}

          {/* Informacje techniczne — collapsible */}
          <MetadataSection
            log={log}
            showTechnical={showTechnical}
            onToggle={() => setShowTechnical(!showTechnical)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
