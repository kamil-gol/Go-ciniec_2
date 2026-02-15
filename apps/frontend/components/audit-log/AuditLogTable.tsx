// apps/frontend/components/audit-log/AuditLogTable.tsx
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Eye, Clock } from 'lucide-react';
import { AuditLogDetails } from './AuditLogDetails';
import type { AuditLogEntry } from '@/types/audit-log.types';

interface Props {
  data: AuditLogEntry[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}

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

export function AuditLogTable({
  data,
  isLoading,
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
}: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[160px] font-semibold text-neutral-700 dark:text-neutral-300">Data</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Użytkownik</TableHead>
              <TableHead className="w-[150px] font-semibold text-neutral-700 dark:text-neutral-300">Akcja</TableHead>
              <TableHead className="w-[130px] font-semibold text-neutral-700 dark:text-neutral-300">Typ</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Opis</TableHead>
              <TableHead className="w-[70px] font-semibold text-neutral-700 dark:text-neutral-300"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((log, index) => (
              <TableRow
                key={log.id}
                className="group cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setSelectedLog(log)}
              >
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {format(new Date(log.createdAt), 'dd.MM.yyyy', { locale: pl })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'HH:mm:ss', { locale: pl })}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {log.user.firstName} {log.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${actionColors[log.action] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}
                  >
                    {actionLabels[log.action] || log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {entityLabels[log.entityType] || log.entityType}
                  </span>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">
                    {log.details?.description || log.details?.reason || '—'}
                  </p>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLog(log);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Strona <span className="font-medium text-neutral-900 dark:text-neutral-100">{page}</span> z{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{totalPages}</span>
            {total && (
              <span className="ml-2">· {total} {total === 1 ? 'wpis' : total < 5 ? 'wpisy' : 'wpisów'} łącznie</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-8"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8"
            >
              Następna
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal szczegółów */}
      {selectedLog && (
        <AuditLogDetails
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}
