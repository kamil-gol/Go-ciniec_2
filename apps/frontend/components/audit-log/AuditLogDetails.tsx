// apps/frontend/components/audit-log/AuditLogDetails.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, User, Tag, FileText, Globe, Monitor, Hash, Clock } from 'lucide-react';
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
  ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200',
  UNARCHIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  RESTORE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CREATE: 'bg-blue-100 text-blue-700 border-blue-200',
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700 border-violet-200',
  LOGIN: 'bg-sky-100 text-sky-700 border-sky-200',
  LOGOUT: 'bg-slate-100 text-slate-700 border-slate-200',
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-zinc-500" />
            Szczegóły wpisu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Podstawowe info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Data i czas</p>
                <p className="text-sm font-medium">
                  {format(new Date(log.createdAt), 'd MMMM yyyy, HH:mm:ss', {
                    locale: pl,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Użytkownik</p>
                <p className="text-sm font-medium">
                  {log.user.firstName} {log.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Tag className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Wykonana akcja</p>
                <Badge
                  variant="outline"
                  className={`mt-1 text-xs ${actionColors[log.action] || ''}`}
                >
                  {actionLabels[log.action] || log.action}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Typ obiektu</p>
                <p className="text-sm font-medium">
                  {entityLabels[log.entityType] || log.entityType}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {log.entityId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Szczegóły */}
          {log.details && (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Szczegóły zmiany
              </h4>
              
              {log.details.description && (
                <div className="pl-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    Opis
                  </p>
                  <p className="text-sm mt-0.5">{log.details.description}</p>
                </div>
              )}

              {log.details.reason && (
                <div className="pl-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    Powód
                  </p>
                  <p className="text-sm mt-0.5">{log.details.reason}</p>
                </div>
              )}

              {log.details.changes && (
                <div className="pl-6">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Zmiany (dane techniczne)
                  </p>
                  <pre className="rounded-lg bg-neutral-950 text-neutral-100 p-4 text-xs overflow-auto max-h-64 font-mono">
                    {JSON.stringify(log.details.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Informacje techniczne */}
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Informacje techniczne
            </h4>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Adres IP:</span>
                <span className="text-xs font-mono">
                  {log.ipAddress || 'Nieznany'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Przeglądarka:</span>
                <span className="text-xs font-mono truncate max-w-[200px]">
                  {log.userAgent ? log.userAgent.split(' ').slice(0, 3).join(' ') : 'Nieznana'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ID wpisu:</span>
              <span className="text-xs font-mono select-all">{log.id}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
