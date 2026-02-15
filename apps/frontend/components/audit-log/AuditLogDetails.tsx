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
import { Calendar, User, Tag, FileText, Globe, Monitor } from 'lucide-react';
import type { AuditLogEntry } from '@/types/audit-log.types';

interface Props {
  log: AuditLogEntry;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetails({ log, open, onClose }: Props) {
  const actionLabels: Record<string, string> = {
    ARCHIVE: 'Archiwizacja',
    UNARCHIVE: 'Przywrócenie',
    CREATE: 'Utworzenie',
    UPDATE: 'Aktualizacja',
    DELETE: 'Usunięcie',
  };

  const entityLabels: Record<string, string> = {
    RESERVATION: 'Rezerwacja',
    CLIENT: 'Klient',
    ROOM: 'Sala',
    MENU: 'Menu',
    USER: 'Użytkownik',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Szczegóły logu audytu</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Podstawowe info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(log.createdAt), 'PPP HH:mm:ss', {
                    locale: pl,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-1 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Użytkownik</p>
                <p className="text-sm text-muted-foreground">
                  {log.user.firstName} {log.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="mt-1 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Akcja</p>
                <Badge variant="outline" className="mt-1">
                  {actionLabels[log.action] || log.action}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Typ encji</p>
                <p className="text-sm text-muted-foreground">
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
              <h4 className="text-sm font-semibold">Szczegóły zmiany</h4>
              
              {log.details.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Opis
                  </p>
                  <p className="text-sm">{log.details.description}</p>
                </div>
              )}

              {log.details.reason && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Powód
                  </p>
                  <p className="text-sm">{log.details.reason}</p>
                </div>
              )}

              {log.details.changes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Zmiany
                  </p>
                  <pre className="rounded bg-muted p-3 text-xs overflow-auto max-h-64">
                    {JSON.stringify(log.details.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Informacje techniczne */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
            <h4 className="text-sm font-semibold">Informacje techniczne</h4>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <Globe className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Adres IP
                  </p>
                  <p className="text-sm font-mono">
                    {log.ipAddress || 'Nieznany'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Monitor className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    User Agent
                  </p>
                  <p className="text-xs font-mono truncate">
                    {log.userAgent || 'Nieznany'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                ID logu
              </p>
              <p className="text-xs font-mono">{log.id}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
