// apps/frontend/src/components/audit-log/AuditLogTable.tsx
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
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogDetails } from './AuditLogDetails';
import type { AuditLogEntry } from '@/types/audit-log.types';

interface Props {
  data: AuditLogEntry[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({
  data,
  isLoading,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const actionColors: Record<string, string> = {
    // Podstawowe
    CREATE: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    UPDATE: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    DELETE: 'bg-red-500/10 text-red-700 border-red-500/20',
    ARCHIVE: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    UNARCHIVE: 'bg-green-500/10 text-green-700 border-green-500/20',
    // Status
    STATUS_CHANGE: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    AUTO_CONFIRM: 'bg-green-500/10 text-green-700 border-green-500/20',
    // Kolejka
    QUEUE_ADD: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    QUEUE_UPDATE: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    QUEUE_SWAP: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    QUEUE_MOVE: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    QUEUE_REORDER: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    QUEUE_REBUILD: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    QUEUE_PROMOTE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    QUEUE_AUTO_CANCEL: 'bg-red-500/10 text-red-700 border-red-500/20',
    // Menu
    MENU_UPDATE: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    MENU_REMOVE: 'bg-red-500/10 text-red-700 border-red-500/20',
    MENU_SELECTED: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    MENU_RECALCULATED: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    MENU_DIRECT_REMOVED: 'bg-red-500/10 text-red-700 border-red-500/20',
    // Płatności
    PAYMENT_UPDATE: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    MARK_PAID: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    // Załączniki
    ATTACHMENT_UPLOAD: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    ATTACHMENT_UPDATE: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    ATTACHMENT_ARCHIVE: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    ATTACHMENT_DELETE: 'bg-red-500/10 text-red-700 border-red-500/20',
  };

  const actionLabels: Record<string, string> = {
    // Podstawowe
    CREATE: 'Utworzenie',
    UPDATE: 'Aktualizacja',
    DELETE: 'Usunięcie',
    ARCHIVE: 'Archiwizacja',
    UNARCHIVE: 'Przywrócenie',
    // Rezerwacje
    STATUS_CHANGE: 'Zmiana statusu',
    AUTO_CONFIRM: 'Auto-potwierdzenie',
    // Kolejka
    QUEUE_ADD: 'Dodanie do kolejki',
    QUEUE_UPDATE: 'Aktualizacja kolejki',
    QUEUE_SWAP: 'Zamiana pozycji',
    QUEUE_MOVE: 'Przeniesienie',
    QUEUE_REORDER: 'Zmiana kolejności',
    QUEUE_REBUILD: 'Przebudowa kolejki',
    QUEUE_PROMOTE: 'Promowanie',
    QUEUE_AUTO_CANCEL: 'Auto-anulowanie',
    // Menu
    MENU_UPDATE: 'Zmiana menu',
    MENU_REMOVE: 'Usunięcie menu',
    MENU_SELECTED: 'Wybór menu',
    MENU_RECALCULATED: 'Przeliczenie menu',
    MENU_DIRECT_REMOVED: 'Usunięcie menu',
    // Płatności
    PAYMENT_UPDATE: 'Zmiana płatności',
    MARK_PAID: 'Oznaczenie wpłaty',
    // Załączniki
    ATTACHMENT_UPLOAD: 'Dodanie załącznika',
    ATTACHMENT_UPDATE: 'Zmiana załącznika',
    ATTACHMENT_ARCHIVE: 'Archiwizacja załącznika',
    ATTACHMENT_DELETE: 'Usunięcie załącznika',
  };

  const entityLabels: Record<string, string> = {
    RESERVATION: 'Rezerwacja',
    CLIENT: 'Klient',
    ROOM: 'Sala',
    HALL: 'Sala',
    MENU: 'Menu',
    USER: 'Użytkownik',
    DEPOSIT: 'Zaliczka',
    ATTACHMENT: 'Załącznik',
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Brak logów spełniających kryteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Użytkownik</TableHead>
              <TableHead>Akcja</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Opis</TableHead>
              <TableHead className="w-[80px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', {
                    locale: pl,
                  })}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {log.user.firstName} {log.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={actionColors[log.action] || 'bg-gray-500/10 text-gray-700 border-gray-500/20'}
                  >
                    {actionLabels[log.action] || log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {entityLabels[log.entityType] || log.entityType}
                  </span>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate text-sm text-muted-foreground">
                    {log.details.description || log.details.reason || '-'}
                  </p>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Strona {page} z {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Poprzednia
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Następna
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
