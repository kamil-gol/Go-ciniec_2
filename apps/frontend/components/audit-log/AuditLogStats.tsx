// apps/frontend/components/audit-log/AuditLogStats.tsx
// UWAGA: Statystyki s\u0105 teraz renderowane bezpo\u015brednio w page.tsx
// Ten plik jest zachowany dla kompatybilno\u015bci wstecznej
'use client';

import { Activity, Archive, Users, Layers } from 'lucide-react';
import { useAuditLogStatistics } from '@/hooks/use-audit-log';
import { StatCard, LoadingState } from '@/components/shared';
import { Card } from '@/components/ui/card';

const actionLabelsGenitive: Record<string, string> = {
  // Basic CRUD
  CREATE: 'Utworze\u0144',
  UPDATE: 'Aktualizacji',
  DELETE: 'Usuni\u0119\u0107',
  TOGGLE: 'Prze\u0142\u0105cze\u0144',
  // Status
  STATUS_CHANGE: 'Zmian statusu',
  ARCHIVE: 'Archiwizacji',
  UNARCHIVE: 'Przywr\u00f3ce\u0144',
  RESTORE: 'Przywr\u00f3ce\u0144',
  // Menu
  MENU_UPDATE: 'Aktualizacji menu',
  MENU_REMOVE: 'Usuni\u0119\u0107 menu',
  MENU_SELECTED: 'Wybor\u00f3w menu',
  MENU_RECALCULATED: 'Przelicze\u0144 menu',
  MENU_DIRECT_REMOVED: 'Bezpo\u015brednich usuni\u0119\u0107 menu',
  // Payment
  PAYMENT_UPDATE: 'Aktualizacji p\u0142atno\u015bci',
  MARK_PAID: 'Oznacze\u0144 p\u0142atno\u015bci',
  // Queue
  QUEUE_ADD: 'Doda\u0144 do kolejki',
  QUEUE_UPDATE: 'Aktualizacji w kolejce',
  QUEUE_REMOVE: 'Usuni\u0119\u0107 z kolejki',
  QUEUE_SWAP: 'Zamian pozycji',
  QUEUE_MOVE: 'Przeniesie\u0144',
  QUEUE_REORDER: 'Zmian kolejno\u015bci',
  QUEUE_REBUILD: 'Przebudow kolejki',
  QUEUE_PROMOTE: 'Awans\u00f3w z kolejki',
  QUEUE_AUTO_CANCEL: 'Auto-anulowa\u0144',
  // Attachments
  ATTACHMENT_UPLOAD: 'Wgra\u0144 za\u0142\u0105cznik\u00f3w',
  ATTACHMENT_ADD: 'Doda\u0144 za\u0142\u0105cznik\u00f3w',
  ATTACHMENT_UPDATE: 'Aktualizacji za\u0142\u0105cznik\u00f3w',
  ATTACHMENT_ARCHIVE: 'Archiwizacji za\u0142\u0105cznik\u00f3w',
  ATTACHMENT_DELETE: 'Usuni\u0119\u0107 za\u0142\u0105cznik\u00f3w',
  // Auth
  LOGIN: 'Logowa\u0144',
  LOGOUT: 'Wylogowa\u0144',
};

const entityLabelsPlural: Record<string, string> = {
  RESERVATION: 'Rezerwacje',
  CLIENT: 'Klienci',
  ROOM: 'Sale',
  HALL: 'Sale',
  MENU: 'Menu',
  USER: 'U\u017cytkownicy',
  DEPOSIT: 'Zaliczki',
  EVENT_TYPE: 'Typy wydarze\u0144',
  ATTACHMENT: 'Za\u0142\u0105czniki',
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
        subtitle="\u0141\u0105czna liczba zmian"
        icon={Activity}
        iconGradient="from-zinc-600 to-slate-600"
        delay={0.1}
      />
      <StatCard
        label="Najcz\u0119stsza akcja"
        value={stats.byAction.length > 0 ? stats.byAction[0].count : 0}
        subtitle={stats.byAction.length > 0 ? (actionLabelsGenitive[stats.byAction[0].action] || stats.byAction[0].action) : 'Brak danych'}
        icon={Archive}
        iconGradient="from-amber-500 to-orange-500"
        delay={0.2}
      />
      <StatCard
        label="Najcz\u0119stszy typ"
        value={stats.byEntityType.length > 0 ? stats.byEntityType[0].count : 0}
        subtitle={stats.byEntityType.length > 0 ? (entityLabelsPlural[stats.byEntityType[0].entityType] || stats.byEntityType[0].entityType) : 'Brak danych'}
        icon={Layers}
        iconGradient="from-blue-500 to-cyan-500"
        delay={0.3}
      />
      <StatCard
        label="Aktywni u\u017cytkownicy"
        value={stats.byUser.length}
        subtitle="Wykona\u0142o zmiany"
        icon={Users}
        iconGradient="from-violet-500 to-purple-500"
        delay={0.4}
      />
    </div>
  );
}
