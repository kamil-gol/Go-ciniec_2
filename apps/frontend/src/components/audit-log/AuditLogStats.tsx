// apps/frontend/src/components/audit-log/AuditLogStats.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Archive, Users, Layers } from 'lucide-react';
import { useAuditLogStatistics } from '@/hooks/use-audit-log';
import { Skeleton } from '@/components/ui/skeleton';

export function AuditLogStats() {
  const { data: stats, isLoading } = useAuditLogStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Odmiana polska (dopełniacz liczby mnogiej) dla statystyk
  const actionLabels: Record<string, string> = {
    // Podstawowe
    CREATE: 'Utworzeń',
    UPDATE: 'Aktualizacji',
    DELETE: 'Usunięć',
    ARCHIVE: 'Archiwizacji',
    UNARCHIVE: 'Przywróceń',
    // Rezerwacje
    STATUS_CHANGE: 'Zmian statusu',
    AUTO_CONFIRM: 'Auto-potwierdzeń',
    // Kolejka
    QUEUE_ADD: 'Dodań do kolejki',
    QUEUE_UPDATE: 'Aktualizacji kolejki',
    QUEUE_SWAP: 'Zamian pozycji',
    QUEUE_MOVE: 'Przeniesień',
    QUEUE_REORDER: 'Zmian kolejności',
    QUEUE_REBUILD: 'Przebudowán kolejki',
    QUEUE_PROMOTE: 'Promowań',
    QUEUE_AUTO_CANCEL: 'Auto-anulowań',
    // Menu
    MENU_UPDATE: 'Zmian menu',
    MENU_REMOVE: 'Usunięć menu',
    MENU_SELECTED: 'Wyborów menu',
    MENU_RECALCULATED: 'Przeliczeń menu',
    MENU_DIRECT_REMOVED: 'Usunięć menu',
    // Płatności
    PAYMENT_UPDATE: 'Zmian płatności',
    MARK_PAID: 'Oznaczeń wpłaty',
    // Załączniki
    ATTACHMENT_UPLOAD: 'Dodań załącznika',
    ATTACHMENT_UPDATE: 'Zmian załącznika',
    ATTACHMENT_ARCHIVE: 'Archiwizacji załącznika',
    ATTACHMENT_DELETE: 'Usunięć załącznika',
  };

  // Odmiana polska (mianownik liczby mnogiej) dla typów encji
  const entityLabels: Record<string, string> = {
    RESERVATION: 'Rezerwacje',
    CLIENT: 'Klienci',
    ROOM: 'Sale',
    HALL: 'Sale',
    MENU: 'Menu',
    USER: 'Użytkownicy',
    DEPOSIT: 'Zaliczki',
    ATTACHMENT: 'Załączniki',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Wszystkie logi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wszystkie wpisy</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLogs}</div>
          <p className="text-xs text-muted-foreground">
            Łączna liczba zmian
          </p>
        </CardContent>
      </Card>

      {/* Top akcja */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Najczęstsza akcja
          </CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.byAction.length > 0 ? (
            <>
              <div className="text-2xl font-bold">
                {stats.byAction[0].count}
              </div>
              <p className="text-xs text-muted-foreground">
                {actionLabels[stats.byAction[0].action] ||
                  stats.byAction[0].action}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Brak danych</div>
          )}
        </CardContent>
      </Card>

      {/* Top typ encji */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Najczęstszy typ</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.byEntityType.length > 0 ? (
            <>
              <div className="text-2xl font-bold">
                {stats.byEntityType[0].count}
              </div>
              <p className="text-xs text-muted-foreground">
                {entityLabels[stats.byEntityType[0].entityType] ||
                  stats.byEntityType[0].entityType}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Brak danych</div>
          )}
        </CardContent>
      </Card>

      {/* Użytkownicy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aktywni użytkownicy
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byUser.length}</div>
          <p className="text-xs text-muted-foreground">
            Wykonało zmiany
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
