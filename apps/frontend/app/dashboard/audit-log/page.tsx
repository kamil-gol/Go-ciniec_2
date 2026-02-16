// apps/frontend/app/dashboard/audit-log/page.tsx
'use client';

import { useState } from 'react';
import { FileText, Activity, Archive, Layers, Users, Search, Filter, X, Download, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuditLogFilters } from '@/components/audit-log/AuditLogFilters';
import { AuditLogTable } from '@/components/audit-log/AuditLogTable';
import { useAuditLogs, useAuditLogStatistics } from '@/hooks/use-audit-log';
import type { AuditLogFilters as Filters } from '@/types/audit-log.types';
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';

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

export default function AuditLogPage() {
  const accent = moduleAccents.auditLog;
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useAuditLogs(filters);
  const { data: stats, isLoading: statsLoading } = useAuditLogStatistics();

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, pageSize: 20 });
    setShowFilters(false);
  };

  const hasActiveFilters = filters.action || filters.entityType || filters.startDate || filters.endDate;

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Dziennik Audytu"
        subtitle="Historia wszystkich zmian w systemie"
        icon={FileText}
      />

      {/* Statystyki */}
      {stats && (
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
      )}

      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <LoadingState variant="skeleton" rows={2} />
            </Card>
          ))}
        </div>
      )}

      {/* Lista log\u00f3w */}
      <Card className="overflow-hidden">
        <CardHeader className={`border-b bg-gradient-to-r ${accent.gradientSubtle}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Historia zmian</CardTitle>
                {data && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {data.total} {data.total === 1 ? 'wpis' : data.total < 5 ? 'wpisy' : 'wpis\u00f3w'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-zinc-700 hover:bg-zinc-800' : ''}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtry
                {hasActiveFilters && (
                  <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    !
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Wyczy\u015b\u0107
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Filtry - rozwijane */}
        {showFilters && (
          <div className="border-b bg-muted/30 p-4 animate-in slide-in-from-top-2 duration-200">
            <AuditLogFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>
        )}

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingState variant="skeleton" rows={8} message="\u0141adowanie dziennika audytu..." />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="Brak wpis\u00f3w w dzienniku"
                description={hasActiveFilters ? 'Spr\u00f3buj zmieni\u0107 kryteria filtrowania' : 'System jeszcze nie zarejestrowa\u0142 \u017cadnych zmian'}
              />
            </div>
          ) : (
            <AuditLogTable
              data={data.data}
              isLoading={false}
              page={filters.page || 1}
              pageSize={filters.pageSize || 20}
              totalPages={data.totalPages || 1}
              total={data.total}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
