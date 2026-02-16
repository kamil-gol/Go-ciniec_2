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
  CREATE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  TOGGLE: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  UNARCHIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  RESTORE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  MENU_UPDATE: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
  MENU_REMOVE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  MENU_SELECTED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  MENU_RECALCULATED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  MENU_DIRECT_REMOVED: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  PAYMENT_UPDATE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  MARK_PAID: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  QUEUE_ADD: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  QUEUE_UPDATE: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  QUEUE_REMOVE: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  QUEUE_SWAP: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  QUEUE_MOVE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  QUEUE_REORDER: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  QUEUE_REBUILD: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  QUEUE_PROMOTE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  QUEUE_AUTO_CANCEL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  ATTACHMENT_UPLOAD: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ATTACHMENT_ADD: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ATTACHMENT_UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  ATTACHMENT_ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  ATTACHMENT_DELETE: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  LOGIN: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  LOGOUT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usunięcie',
  TOGGLE: 'Przełączenie',
  STATUS_CHANGE: 'Zmiana statusu',
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywrócenie',
  RESTORE: 'Przywrócenie',
  MENU_UPDATE: 'Aktualizacja menu',
  MENU_REMOVE: 'Usunięcie menu',
  MENU_SELECTED: 'Wybór menu',
  MENU_RECALCULATED: 'Przeliczenie menu',
  MENU_DIRECT_REMOVED: 'Bezpośrednie usunięcie menu',
  PAYMENT_UPDATE: 'Aktualizacja płatności',
  MARK_PAID: 'Oznaczenie płatności',
  QUEUE_ADD: 'Dodanie do kolejki',
  QUEUE_UPDATE: 'Aktualizacja w kolejce',
  QUEUE_REMOVE: 'Usunięcie z kolejki',
  QUEUE_SWAP: 'Zamiana pozycji',
  QUEUE_MOVE: 'Przeniesienie w kolejce',
  QUEUE_REORDER: 'Zmiana kolejności',
  QUEUE_REBUILD: 'Przebudowa kolejki',
  QUEUE_PROMOTE: 'Awans z kolejki',
  QUEUE_AUTO_CANCEL: 'Auto-anulowanie z kolejki',
  ATTACHMENT_UPLOAD: 'Wgranie załącznika',
  ATTACHMENT_ADD: 'Dodanie załącznika',
  ATTACHMENT_UPDATE: 'Aktualizacja załącznika',
  ATTACHMENT_ARCHIVE: 'Archiwizacja załącznika',
  ATTACHMENT_DELETE: 'Usunięcie załącznika',
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
  ATTACHMENT: 'Załącznik',
  QUEUE: 'Kolejka',
  DISH: 'Danie',
  MENU_TEMPLATE: 'Szablon menu',
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
      {/* ===== MOBILE CARD VIEW ===== */}
      <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
        {data.map((log) => (
          <div
            key={log.id}
            onClick={() => setSelectedLog(log)}
            className="p-4 cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all duration-150"
          >
            {/* Row 1: Date + Action Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {format(new Date(log.createdAt), 'dd.MM.yyyy', { locale: pl })}
                </span>
                <span className="text-xs">
                  {format(new Date(log.createdAt), 'HH:mm', { locale: pl })}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-medium whitespace-nowrap ${actionColors[log.action] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}
              >
                {actionLabels[log.action] || log.action}
              </Badge>
            </div>

            {/* Row 2: User + Entity Type */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {log.user?.firstName && log.user?.lastName
                  ? `${log.user.firstName} ${log.user.lastName}`
                  : 'System'}
              </p>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                {entityLabels[log.entityType] || log.entityType}
              </span>
            </div>

            {/* Row 3: Description */}
            {(log.details?.description || log.details?.reason) && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {log.details?.description || log.details?.reason}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ===== DESKTOP TABLE VIEW ===== */}
      <div className="hidden md:block overflow-x-auto">
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
            {data.map((log) => (
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
                      {log.user?.firstName && log.user?.lastName
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : 'System'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user?.email || 'Akcja automatyczna'}
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
                    {log.details?.description || log.details?.reason || '\u2014'}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Strona <span className="font-medium text-neutral-900 dark:text-neutral-100">{page}</span> z{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{totalPages}</span>
            {total && (
              <span className="ml-2">\u00b7 {total} {total === 1 ? 'wpis' : total < 5 ? 'wpisy' : 'wpisów'} łącznie</span>
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
