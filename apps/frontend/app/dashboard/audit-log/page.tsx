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
  ARCHIVE: 'Archiwizacji',
  UNARCHIVE: 'Przywróceń',
  CREATE: 'Utworzeń',
  UPDATE: 'Aktualizacji',
  DELETE: 'Usunięć',
  STATUS_CHANGE: 'Zmian statusu',
  RESTORE: 'Przywróceń',
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

      {/* Lista logów */}
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
                    {data.total} {data.total === 1 ? 'wpis' : data.total < 5 ? 'wpisy' : 'wpisów'}
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
                  Wyczyść
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
              <LoadingState variant="skeleton" rows={8} message="Ładowanie dziennika audytu..." />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="Brak wpisów w dzienniku"
                description={hasActiveFilters ? 'Spróbuj zmienić kryteria filtrowania' : 'System jeszcze nie zarejestrował żadnych zmian'}
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
