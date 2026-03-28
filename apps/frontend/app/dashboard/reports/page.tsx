'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, FileSpreadsheet, FileText, DollarSign, Building2, ClipboardList, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useRevenueReport,
  useOccupancyReport,
  usePreparationsReport,
  useMenuPreparationsReport,
  exportRevenueExcel,
  exportRevenuePDF,
  exportOccupancyExcel,
  exportOccupancyPDF,
  exportPreparationsExcel,
  exportPreparationsPDF,
  exportMenuPreparationsExcel,
  exportMenuPreparationsPDF,
} from '@/hooks/use-reports';
import type {
  RevenueReportFilters,
  OccupancyReportFilters,
  PreparationsReportFilters,
  MenuPreparationsReportFilters,
  GroupByPeriod,
} from '@/types/reports.types';
import { PageLayout, PageHero } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';
import { toast } from 'sonner';

import type { ReportTab } from './components/types';
import { getDatePresets } from './components/chart-utils';
import { ReportFilters } from './components/ReportFilters';

const ReportTabSkeleton = () => (
  <div className="space-y-4 sm:space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

const RevenueTab = dynamic(
  () => import('./components/RevenueReport').then((m) => ({ default: m.RevenueTab })),
  { loading: () => <ReportTabSkeleton />, ssr: false }
);

const OccupancyTab = dynamic(
  () => import('./components/OccupancyReport').then((m) => ({ default: m.OccupancyTab })),
  { loading: () => <ReportTabSkeleton />, ssr: false }
);

const PreparationsTab = dynamic(
  () => import('./components/PreparationsReport').then((m) => ({ default: m.PreparationsTab })),
  { loading: () => <ReportTabSkeleton />, ssr: false }
);

const MenuPreparationsTab = dynamic(
  () => import('./components/MenuPreparationsReport').then((m) => ({ default: m.MenuPreparationsTab })),
  { loading: () => <ReportTabSkeleton />, ssr: false }
);

export default function ReportsPage() {
  const accent = moduleAccents.reports || moduleAccents.calendar;

  const defaultPresets = useMemo(() => getDatePresets(), []);
  const defaultFrom = defaultPresets[0].dateFrom;
  const defaultTo = defaultPresets[0].dateTo;

  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [groupBy, setGroupBy] = useState<GroupByPeriod>('month');
  const [hallId] = useState<string>('');
  const [eventTypeId] = useState<string>('');
  const [prepView, setPrepView] = useState<'detailed' | 'summary'>('detailed');
  const [menuPrepView, setMenuPrepView] = useState<'detailed' | 'summary'>('detailed');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const revenueFilters: RevenueReportFilters = useMemo(() => ({
    dateFrom, dateTo, groupBy,
    ...(hallId && { hallId }),
    ...(eventTypeId && { eventTypeId }),
  }), [dateFrom, dateTo, groupBy, hallId, eventTypeId]);
  const occupancyFilters: OccupancyReportFilters = useMemo(() => ({
    dateFrom, dateTo, ...(hallId && { hallId }),
  }), [dateFrom, dateTo, hallId]);
  const preparationsFilters: PreparationsReportFilters = useMemo(() => ({
    dateFrom, dateTo, view: prepView,
  }), [dateFrom, dateTo, prepView]);
  const menuPreparationsFilters: MenuPreparationsReportFilters = useMemo(() => ({
    dateFrom, dateTo, view: menuPrepView,
  }), [dateFrom, dateTo, menuPrepView]);

  const revenueQuery = useRevenueReport(revenueFilters, activeTab === 'revenue');
  const occupancyQuery = useOccupancyReport(occupancyFilters, activeTab === 'occupancy');
  const preparationsQuery = usePreparationsReport(preparationsFilters, activeTab === 'preparations');
  const menuPreparationsQuery = useMenuPreparationsReport(menuPreparationsFilters, activeTab === 'menu-preparations');

  const handleExportExcel = useCallback(async () => {
    setExportingExcel(true);
    try {
      if (activeTab === 'revenue') await exportRevenueExcel(revenueFilters);
      else if (activeTab === 'occupancy') await exportOccupancyExcel(occupancyFilters);
      else if (activeTab === 'preparations') await exportPreparationsExcel(preparationsFilters);
      else await exportMenuPreparationsExcel(menuPreparationsFilters);
    } catch { toast.error('Błąd eksportu Excel. Spróbuj ponownie.'); }
    finally { setExportingExcel(false); }
  }, [activeTab, revenueFilters, occupancyFilters, preparationsFilters, menuPreparationsFilters]);

  const handleExportPDF = useCallback(async () => {
    setExportingPDF(true);
    try {
      if (activeTab === 'revenue') await exportRevenuePDF(revenueFilters);
      else if (activeTab === 'occupancy') await exportOccupancyPDF(occupancyFilters);
      else if (activeTab === 'preparations') await exportPreparationsPDF(preparationsFilters);
      else await exportMenuPreparationsPDF(menuPreparationsFilters);
    } catch { toast.error('Błąd eksportu PDF. Spróbuj ponownie.'); }
    finally { setExportingPDF(false); }
  }, [activeTab, revenueFilters, occupancyFilters, preparationsFilters, menuPreparationsFilters]);

  const presets = defaultPresets;

  const tabClass = (isActive: boolean, color: string) =>
    `py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
      isActive
        ? `border-${color}-500 text-${color}-600 dark:text-${color}-400`
        : 'border-transparent text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
    }`;

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Raporty"
        subtitle={"Analityka przychodów, zajętości sal, przygotowań i menu"}
        icon={BarChart3}
        action={
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} disabled={exportingExcel} size="sm"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
              <FileSpreadsheet className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button onClick={handleExportPDF} disabled={exportingPDF} size="sm"
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
              <FileText className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex gap-4 overflow-x-auto" aria-label="Tabs">
          <button onClick={() => setActiveTab('revenue')}
            className={tabClass(activeTab === 'revenue', 'blue')}>
            <DollarSign className="h-3.5 w-3.5" />
            Przychody
          </button>
          <button onClick={() => setActiveTab('occupancy')}
            className={tabClass(activeTab === 'occupancy', 'blue')}>
            <Building2 className="h-3.5 w-3.5" />
            {"Zajętość sal"}
          </button>
          <button onClick={() => setActiveTab('preparations')}
            className={tabClass(activeTab === 'preparations', 'purple')}>
            <ClipboardList className="h-3.5 w-3.5" />
            Przygotowania
          </button>
          <button onClick={() => setActiveTab('menu-preparations')}
            className={tabClass(activeTab === 'menu-preparations', 'amber')}>
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Menu</span>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <ReportFilters
        presets={presets}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        activeTab={activeTab}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        prepView={prepView}
        setPrepView={setPrepView}
        menuPrepView={menuPrepView}
        setMenuPrepView={setMenuPrepView}
      />

      {activeTab === 'revenue' && <RevenueTab query={revenueQuery} />}
      {activeTab === 'occupancy' && <OccupancyTab query={occupancyQuery} />}
      {activeTab === 'preparations' && <PreparationsTab query={preparationsQuery} view={prepView} />}
      {activeTab === 'menu-preparations' && <MenuPreparationsTab query={menuPreparationsQuery} view={menuPrepView} />}
    </PageLayout>
  );
}
