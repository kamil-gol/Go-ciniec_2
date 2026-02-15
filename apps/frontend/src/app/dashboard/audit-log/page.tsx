// apps/frontend/src/app/dashboard/audit-log/page.tsx
'use client';

import { useState } from 'react';
import { AuditLogFilters } from '@/components/audit-log/AuditLogFilters';
import { AuditLogStats } from '@/components/audit-log/AuditLogStats';
import { AuditLogTable } from '@/components/audit-log/AuditLogTable';
import { useAuditLogs } from '@/hooks/use-audit-log';
import type { AuditLogFilters as Filters } from '@/types/audit-log.types';
import { FileText } from 'lucide-react';

export default function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading } = useAuditLogs(filters);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset do strony 1 przy zmianie filtrów
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, pageSize: 20 });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Dziennik Audytu
          </h1>
          <p className="text-muted-foreground">
            Historia wszystkich zmian w systemie
          </p>
        </div>
      </div>

      {/* Statystyki */}
      <AuditLogStats />

      {/* Filtry */}
      <AuditLogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Tabela */}
      <AuditLogTable
        data={data?.data || []}
        isLoading={isLoading}
        page={filters.page || 1}
        pageSize={filters.pageSize || 20}
        totalPages={data?.totalPages || 1}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
