// apps/frontend/components/audit-log/AuditLogStats.tsx
// UWAGA: Statystyki są teraz renderowane bezpośrednio w page.tsx
// Ten plik jest zachowany dla kompatybilności wstecznej
'use client';

import { Activity, Archive, Users, Layers } from 'lucide-react';
import { useAuditLogStatistics } from '@/hooks/use-audit-log';
import { StatCard, LoadingState } from '@/components/shared';
import { Card } from '@/components/ui/card';

const actionLabelsGenitive: Record<string, string> = {
  // Basic CRUD
  CREATE: 'Utworzeń',
  UPDATE: 'Aktualizacji',
  DELETE: 'Usunięć',
  TOGGLE: 'Przełączeń',
  // Status
  STATUS_CHANGE: 'Zmian statusu',
  ARCHIVE: 'Archiwizacji',
  UNARCHIVE: 'Przywróceń',
  RESTORE: 'Przywróceń',
  // Menu
  MENU_UPDATE: 'Aktualizacji menu',
  MENU_REMOVE: 'Usunięć menu',
  MENU_SELECTED: 'Wyborów menu',
  MENU_RECALCULATED: 'Przeliczeń menu',
  MENU_DIRECT_REMOVED: 'Bezpośrednich usunięć menu',
  // Payment
  PAYMENT_UPDATE: 'Aktualizacji płatności',
  MARK_PAID: 'Oznaczeń płatności',
  // Queue
  QUEUE_ADD: 'Dodań do kolejki',
  QUEUE_UPDATE: 'Aktualizacji w kolejce',
  QUEUE_REMOVE: 'Usunięć z kolejki',
  QUEUE_SWAP: 'Zamian pozycji',
  QUEUE_MOVE: 'Przeniesień',
  QUEUE_REORDER: 'Zmian kolejności',
  QUEUE_REBUILD: 'Przebudow kolejki',
  QUEUE_PROMOTE: 'Awansów z kolejki',
  QUEUE_AUTO_CANCEL: 'Auto-anulowań',
  // Attachments
  ATTACHMENT_UPLOAD: 'Wgrań załączników',
  ATTACHMENT_ADD: 'Dodań załączników',
  ATTACHMENT_UPDATE: 'Aktualizacji załączników',
  ATTACHMENT_ARCHIVE: 'Archiwizacji załączników',
  ATTACHMENT_DELETE: 'Usunięć załączników',
  // Auth
  LOGIN: 'Logowań',
  LOGOUT: 'Wylogowań',
};

const entityLabelsPlural: Record<string, string> = {
  RESERVATION: 'Rezerwacje',
  CLIENT: 'Klienci',
  ROOM: 'Sale',
  HALL: 'Sale',
  MENU: 'Menu',
  USER: 'Użytkownicy',
  DEPOSIT: 'Zaliczki',
  EVENT_TYPE: 'Typy wydarzeń',
  ATTACHMENT: 'Załączniki',
  QUEUE: 'Kolejka',
  DISH: 'Dania',
  MENU_TEMPLATE: 'Szablony menu',
};

export function AuditLogStats() {
  const { data: stats, isLoading } = useAuditLogStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <LoadingState variant="skeleton" rows={2} />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Wszystkie wpisy"
        value={stats.totalLogs}
        subtitle="Łączna liczba zmian"
        icon={Activity}
        iconGradient="from-zinc-600 to-slate-600"
        delay={0.1}
      />
      <StatCard
        label="Najczęstsza akcja"
        value={stats.byAction.length > 0 ? stats.byAction[0].count : 0}
        subtitle={stats.byAction.length > 0 ? (actionLabelsGenitive[stats.byAction[0].action] || stats.byAction[0].action) : 'Brak danych'}
        icon={Archive}
        iconGradient="from-amber-500 to-orange-500"
        delay={0.2}
      />
      <StatCard
        label="Najczęstszy typ"
        value={stats.byEntityType.length > 0 ? stats.byEntityType[0].count : 0}
        subtitle={stats.byEntityType.length > 0 ? (entityLabelsPlural[stats.byEntityType[0].entityType] || stats.byEntityType[0].entityType) : 'Brak danych'}
        icon={Layers}
        iconGradient="from-blue-500 to-cyan-500"
        delay={0.3}
      />
      <StatCard
        label="Aktywni użytkownicy"
        value={stats.byUser.length}
        subtitle="Wykonało zmiany"
        icon={Users}
        iconGradient="from-violet-500 to-purple-500"
        delay={0.4}
      />
    </div>
  );
}
