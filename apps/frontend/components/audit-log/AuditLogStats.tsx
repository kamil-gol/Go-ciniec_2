// apps/frontend/components/audit-log/AuditLogStats.tsx
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

  const actionLabels: Record<string, string> = {
    ARCHIVE: 'Archiwizacji',
    UNARCHIVE: 'Przywróceń',
    CREATE: 'Utworzeń',
    UPDATE: 'Aktualizacji',
    DELETE: 'Usunięć',
  };

  const entityLabels: Record<string, string> = {
    RESERVATION: 'Rezerwacje',
    CLIENT: 'Klienci',
    ROOM: 'Sale',
    MENU: 'Menu',
    USER: 'Użytkownicy',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Wszystkie logi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wszystkie logi</CardTitle>
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
