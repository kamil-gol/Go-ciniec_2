// apps/frontend/components/audit-log/AuditLogDetails.tsx
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, User, Tag, FileText, Globe, Monitor, Hash, X } from 'lucide-react';
import type { AuditLogEntry } from '@/types/audit-log.types';

const actionLabels: Record<string, string> = {
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywrócenie',
  RESTORE: 'Przywrócenie',
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usunięcie',
  STATUS_CHANGE: 'Zmiana statusu',
  LOGIN: 'Logowanie',
  LOGOUT: 'Wylogowanie',
};

const actionColors: Record<string, string> = {
  ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  UNARCHIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  RESTORE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  CREATE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  LOGIN: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  LOGOUT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
};

const entityLabels: Record<string, string> = {
  RESERVATION: 'Rezerwacja',
  CLIENT: 'Klient',
  ROOM: 'Sala',
  HALL: 'Sala',
  MENU: 'Menu',
  USER: 'Użytkownik',
  DEPOSIT: 'Zaliczka',
  EVENT_TYPE: 'Typ wydarzenia',
};

interface Props {
  log: AuditLogEntry;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetails({ log, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl !p-0 overflow-hidden" onClose={onClose}>
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-zinc-800 via-zinc-700 to-slate-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-slate-800 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Szczegóły wpisu</h2>
              <p className="text-sm text-white/60">
                {format(new Date(log.createdAt), 'd MMMM yyyy, HH:mm:ss', { locale: pl })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Info Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
              <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Data i czas</p>
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
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Użytkownik</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {log.user.firstName} {log.user.lastName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{log.user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
              <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
                <Tag className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Wykonana akcja</p>
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
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Typ obiektu</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {entityLabels[log.entityType] || log.entityType}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  ID: {log.entityId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Szczegóły zmiany */}
          {log.details && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <Hash className="h-4 w-4 text-zinc-400" />
                  Szczegóły zmiany
                </h4>
              </div>
              <div className="p-4 space-y-4">
                {log.details.description && (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Opis</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">{log.details.description}</p>
                  </div>
                )}

                {log.details.reason && (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Powód</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">{log.details.reason}</p>
                  </div>
                )}

                {log.details.changes && (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Zmiany (dane techniczne)</p>
                    <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-4 text-xs overflow-auto max-h-48 font-mono">
                      {JSON.stringify(log.details.changes, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informacje techniczne */}
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-4">
            <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Informacje techniczne
            </h4>
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
                <span className="text-xs text-zinc-500 flex-shrink-0">Przeglądarka:</span>
                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                  {log.userAgent ? log.userAgent.split(' ').slice(0, 3).join(' ') : 'Nieznana'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-700">
              <Hash className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              <span className="text-xs text-zinc-500">ID wpisu:</span>
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all">{log.id}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
