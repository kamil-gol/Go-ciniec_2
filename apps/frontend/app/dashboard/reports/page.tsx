'use client';

import { useState, useCallback, useMemo } from 'react';
import { BarChart3, FileSpreadsheet, FileText, ClipboardList, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useRevenueReport,
  useOccupancyReport,
  usePreparationsReport,
  exportRevenueExcel,
  exportRevenuePDF,
  exportOccupancyExcel,
  exportOccupancyPDF,
  exportPreparationsExcel,
  exportPreparationsPDF,
} from '@/hooks/use-reports';
import type {
  RevenueReportFilters,
  OccupancyReportFilters,
  PreparationsReportFilters,
  GroupByPeriod,
} from '@/types/reports.types';
import { PageLayout, PageHero } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value}%`;
};

/**
 * Helper: get Monday of the week containing the given date (ISO week, Monday-based).
 */
function getMonday(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(d);
  monday.setDate(diff);
  return monday;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const getDatePresets = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // This week (Mon-Sun)
  const thisMonday = getMonday(now);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);

  // Next week (Mon-Sun)
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  // This month
  const firstDayThisMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDayThisMonth = new Date(year, month + 1, 0);
  const lastDayThisMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayThisMonth.getDate()).padStart(2, '0')}`;

  // Previous month
  const firstDayLastMonth = month === 0 ? `${year - 1}-12-01` : `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayLastMonth = new Date(year, month, 0);
  const lastDayLastMonthStr = month === 0
    ? `${year - 1}-12-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`
    : `${year}-${String(month).padStart(2, '0')}-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`;

  return [
    { label: 'Ten tydzie\u0144', dateFrom: formatDateStr(thisMonday), dateTo: formatDateStr(thisSunday) },
    { label: 'Nast\u0119pny tydzie\u0144', dateFrom: formatDateStr(nextMonday), dateTo: formatDateStr(nextSunday) },
    { label: 'Ten miesi\u0105c', dateFrom: firstDayThisMonth, dateTo: lastDayThisMonthStr },
    { label: 'Poprzedni miesi\u0105c', dateFrom: firstDayLastMonth, dateTo: lastDayLastMonthStr },
    { label: 'Ten rok', dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` },
    { label: 'Ubieg\u0142y rok', dateFrom: `${year - 1}-01-01`, dateTo: `${year - 1}-12-31` },
  ];
};

const dayNamesPL: Record<string, string> = {
  Sunday: 'Niedziela', Monday: 'Poniedzia\u0142ek', Tuesday: 'Wtorek',
  Wednesday: '\u015aroda', Thursday: 'Czwartek', Friday: 'Pi\u0105tek', Saturday: 'Sobota',
};

export default function ReportsPage() {
  const accent = moduleAccents.reports || moduleAccents.calendar;

  // Default dates = this week (first preset)
  const defaultPresets = useMemo(() => getDatePresets(), []);
  const defaultFrom = defaultPresets[0].dateFrom;
  const defaultTo = defaultPresets[0].dateTo;

  const [activeTab, setActiveTab] = useState<'revenue' | 'occupancy' | 'preparations'>('revenue');
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [groupBy, setGroupBy] = useState<GroupByPeriod>('month');
  const [hallId] = useState<string>('');
  const [eventTypeId] = useState<string>('');
  const [prepView, setPrepView] = useState<'detailed' | 'summary'>('detailed');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const revenueFilters: RevenueReportFilters = {
    dateFrom, dateTo, groupBy,
    ...(hallId && { hallId }),
    ...(eventTypeId && { eventTypeId }),
  };
  const occupancyFilters: OccupancyReportFilters = {
    dateFrom, dateTo, ...(hallId && { hallId }),
  };
  const preparationsFilters: PreparationsReportFilters = {
    dateFrom, dateTo, view: prepView,
  };

  const revenueQuery = useRevenueReport(revenueFilters, activeTab === 'revenue');
  const occupancyQuery = useOccupancyReport(occupancyFilters, activeTab === 'occupancy');
  const preparationsQuery = usePreparationsReport(preparationsFilters, activeTab === 'preparations');

  const handleExportExcel = useCallback(async () => {
    setExportingExcel(true);
    try {
      if (activeTab === 'revenue') await exportRevenueExcel(revenueFilters);
      else if (activeTab === 'occupancy') await exportOccupancyExcel(occupancyFilters);
      else await exportPreparationsExcel(preparationsFilters);
    } catch { alert('B\u0142\u0105d eksportu Excel. Spr\u00f3buj ponownie.'); }
    finally { setExportingExcel(false); }
  }, [activeTab, revenueFilters, occupancyFilters, preparationsFilters]);

  const handleExportPDF = useCallback(async () => {
    setExportingPDF(true);
    try {
      if (activeTab === 'revenue') await exportRevenuePDF(revenueFilters);
      else if (activeTab === 'occupancy') await exportOccupancyPDF(occupancyFilters);
      else await exportPreparationsPDF(preparationsFilters);
    } catch { alert('B\u0142\u0105d eksportu PDF. Spr\u00f3buj ponownie.'); }
    finally { setExportingPDF(false); }
  }, [activeTab, revenueFilters, occupancyFilters, preparationsFilters]);

  const presets = defaultPresets;

  const tabClass = (isActive: boolean, color: string) =>
    `py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
      isActive
        ? `border-${color}-500 text-${color}-600 dark:text-${color}-400`
        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
    }`;

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Raporty"
        subtitle={"Analityka przychod\u00f3w, zaj\u0119to\u015bci sal i przygotowa\u0144"}
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
        <nav className="flex gap-4" aria-label="Tabs">
          <button onClick={() => setActiveTab('revenue')}
            className={tabClass(activeTab === 'revenue', 'blue')}>
            <DollarSign className="h-3.5 w-3.5" />
            Przychody
          </button>
          <button onClick={() => setActiveTab('occupancy')}
            className={tabClass(activeTab === 'occupancy', 'blue')}>
            <Building2 className="h-3.5 w-3.5" />
            {"Zaj\u0119to\u015b\u0107 sal"}
          </button>
          <button onClick={() => setActiveTab('preparations')}
            className={tabClass(activeTab === 'preparations', 'purple')}>
            <ClipboardList className="h-3.5 w-3.5" />
            Przygotowania
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button key={preset.label}
                onClick={() => { setDateFrom(preset.dateFrom); setDateTo(preset.dateTo); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  dateFrom === preset.dateFrom && dateTo === preset.dateTo
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}>
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 sm:items-center">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Od</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Do</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            {activeTab === 'revenue' && (
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Grupuj po</label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupByPeriod)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="day">{"Dzie\u0144"}</option>
                  <option value="week">{"Tydzie\u0144"}</option>
                  <option value="month">{"Miesi\u0105c"}</option>
                  <option value="year">Rok</option>
                </select>
              </div>
            )}
            {activeTab === 'preparations' && (
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Widok</label>
                <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-600 overflow-hidden">
                  <button onClick={() => setPrepView('detailed')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${prepView === 'detailed' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
                    {"Szczeg\u00f3\u0142owy"}
                  </button>
                  <button onClick={() => setPrepView('summary')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${prepView === 'summary' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
                    Zbiorczy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'revenue' && <RevenueTab query={revenueQuery} />}
      {activeTab === 'occupancy' && <OccupancyTab query={occupancyQuery} />}
      {activeTab === 'preparations' && <PreparationsTab query={preparationsQuery} view={prepView} />}
    </PageLayout>
  );
}

/* ============================================
   PREPARATIONS TAB (#159)
   Aligned with actual API response structure
   ============================================ */

function PreparationsTab({ query, view }: {
  query: ReturnType<typeof usePreparationsReport>;
  view: 'detailed' | 'summary';
}) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"B\u0142\u0105d \u0142adowania raportu przygotowa\u0144"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wy\u015bwietlenia"} />;

  const { summary, days, summaryDays } = query.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"\u0141\u0105czna liczba us\u0142ug"} value={`${summary.totalExtras}`} color="purple" />
        <SummaryCard title={"Rezerwacje z extras"} value={`${summary.totalReservationsWithExtras}`} color="blue" />
        <SummaryCard
          title="Top kategoria"
          value={summary.topCategory ? `${summary.topCategory.icon} ${summary.topCategory.name} (${summary.topCategory.count})` : 'Brak'}
          color="green"
        />
        <SummaryCard
          title={"Najbli\u017csze wydarzenie"}
          value={summary.nearestEvent ? `${summary.nearestEvent.date}` : 'Brak'}
          color="orange"
        />
      </div>

      {/* Extra info cards */}
      {summary.nearestEvent && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{"Najbli\u017csze wydarzenie"}</p>
          <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {summary.nearestEvent.date} o {summary.nearestEvent.startTime} &mdash; {summary.nearestEvent.clientName}
          </p>
        </div>
      )}

      {/* DETAILED VIEW */}
      {view === 'detailed' && days && days.length > 0 && (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.date} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-800 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>\ud83d\udcc5</span> {day.dateLabel}
                </h3>
                <span className="text-xs text-neutral-300">
                  {day.totalItems} {day.totalItems === 1 ? 'us\u0142uga' : 'us\u0142ug'}
                </span>
              </div>
              {day.categories.map((cat) => (
                <div key={cat.categoryId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                  <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/20">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                      {cat.categoryIcon} {cat.categoryName}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Us\u0142uga"}</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Ilo\u015b\u0107"}</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Warto\u015b\u0107"}</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">Rezerwacja</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden lg:table-cell">Uwagi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {cat.items.map((item) => (
                          <tr key={item.extraId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.serviceName}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300 font-semibold">{item.quantity}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">
                              {item.priceType === 'FREE' ? 'Gratis' : formatCurrency(item.totalPrice)}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-neutral-600 dark:text-neutral-400 text-xs hidden sm:table-cell">
                              {item.reservation.clientName} ({item.reservation.hallName})
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-neutral-500 dark:text-neutral-500 text-xs hidden lg:table-cell">{item.note || '\u2014'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {view === 'detailed' && (!days || days.length === 0) && (
        <ReportEmptyState message={"Brak danych szczeg\u00f3\u0142owych dla wybranego okresu"} />
      )}

      {/* SUMMARY VIEW */}
      {view === 'summary' && summaryDays && summaryDays.length > 0 && (
        <div className="space-y-4">
          {summaryDays.map((day) => (
            <div key={day.date} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-800 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>\ud83d\udcc5</span> {day.dateLabel}
                </h3>
                <span className="text-xs text-neutral-300">
                  {day.totalItems} {day.totalItems === 1 ? 'us\u0142uga' : 'us\u0142ug'} &middot; {day.totalReservations} rez.
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Us\u0142uga"}</th>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">Kategoria</th>
                      <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"\u0141\u0105cznie szt."}</th>
                      <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">Rezerwacji</th>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden lg:table-cell">Klienci</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {day.items.map((item) => (
                      <tr key={item.serviceItemId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.serviceName}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {item.categoryIcon} {item.categoryName}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300 font-semibold">{item.totalQuantity}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{item.reservationCount}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-neutral-500 dark:text-neutral-500 text-xs hidden lg:table-cell">
                          {item.reservations.map((r) => `${r.clientName} (${r.quantity})`).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      {view === 'summary' && (!summaryDays || summaryDays.length === 0) && (
        <ReportEmptyState message={"Brak danych zbiorczych dla wybranego okresu"} />
      )}
    </div>
  );
}

/* ============================================
   REVENUE TAB
   ============================================ */

function RevenueTab({ query }: { query: ReturnType<typeof useRevenueReport> }) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"B\u0142\u0105d \u0142adowania raportu przychod\u00f3w"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wy\u015bwietlenia"} />;

  const { summary, breakdown, byHall, byEventType } = query.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"\u0141\u0105czny przych\u00f3d"} value={formatCurrency(summary.totalRevenue)} color="blue" />
        <SummaryCard title={"\u015ar. / rezerwacj\u0119"} value={formatCurrency(summary.avgRevenuePerReservation)} color="green" />
        <SummaryCard title={"Wzrost vs wcze\u015bniej"} value={formatPercent(summary.growthPercent)} color={summary.growthPercent >= 0 ? 'green' : 'red'} />
        <SummaryCard title="Rezerwacje" value={`${summary.totalReservations} (${summary.completedReservations} zreal.)`} color="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{"Najlepszy dzie\u0144"}</p>
          <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">{summary.maxRevenueDay || 'Brak danych'}</p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">{formatCurrency(summary.maxRevenueDayAmount)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{"Oczekuj\u0105cy przych\u00f3d"}</p>
          <p className="text-base sm:text-lg font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(summary.pendingRevenue)}</p>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Z {summary.totalReservations - summary.completedReservations} niezrealizowanych</p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Przychody wg okresu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Okres</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Przych\u00f3d"}</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">Rez.</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">{"\u015ar."}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {breakdown.map((item) => (
                  <tr key={item.period} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{item.period}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{item.count}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{formatCurrency(item.avgRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {byHall.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Przychody wg sali</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Sala</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Przych\u00f3d"}</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Ilo\u015b\u0107"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {byHall.map((item) => (
                    <tr key={item.hallId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.hallName}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {byEventType.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Przychody wg typu</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Typ</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Przych\u00f3d"}</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Ilo\u015b\u0107"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {byEventType.map((item) => (
                    <tr key={item.eventTypeId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.eventTypeName}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   OCCUPANCY TAB
   ============================================ */

function OccupancyTab({ query }: { query: ReturnType<typeof useOccupancyReport> }) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"B\u0142\u0105d \u0142adowania raportu zaj\u0119to\u015bci"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wy\u015bwietlenia"} />;

  const { summary, halls, peakHours, peakDaysOfWeek } = query.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"\u015ar. zaj\u0119to\u015b\u0107"} value={`${summary.avgOccupancy}%`} color="blue" />
        <SummaryCard title={"Najlepszy dzie\u0144"} value={dayNamesPL[summary.peakDay] || summary.peakDay} color="green" />
        <SummaryCard title="Top sala" value={summary.peakHall || 'Brak'} color="purple" />
        <SummaryCard title="Rezerwacje" value={`${summary.totalReservations} / ${summary.totalDaysInPeriod} dni`} color="orange" />
      </div>

      {halls.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{"Zaj\u0119to\u015b\u0107 wg sali"}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Sala</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{"Zaj\u0119to\u015b\u0107"}</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">Rez.</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase hidden sm:table-cell">{"\u015ar. go\u015bci"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {halls.map((hall) => (
                  <tr key={hall.hallId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{hall.hallName}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right">
                      <span className="inline-flex items-center">
                        <span className="inline-block w-12 sm:w-16 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 mr-2">
                          <span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.min(hall.occupancy, 100)}%` }} />
                        </span>
                        <span className="font-semibold text-blue-700 dark:text-blue-400 text-xs sm:text-sm">{hall.occupancy}%</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{hall.reservations}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{hall.avgGuestsPerReservation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {peakHours.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Popularne godziny</h3>
            </div>
            <div className="p-4 space-y-2">
              {peakHours.map((item) => {
                const maxCount = peakHours[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div key={item.hour} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 w-10 sm:w-12">{String(item.hour).padStart(2, '0')}:00</span>
                    <div className="flex-1 h-5 sm:h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%`, minWidth: '2rem' }}>
                        <span className="text-[10px] sm:text-xs font-bold text-white">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {peakDaysOfWeek.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Popularne dni tygodnia</h3>
            </div>
            <div className="p-4 space-y-2">
              {peakDaysOfWeek.map((item) => {
                const maxCount = peakDaysOfWeek[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div key={item.dayOfWeekNum} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 w-16 sm:w-24 truncate">{dayNamesPL[item.dayOfWeek] || item.dayOfWeek}</span>
                    <div className="flex-1 h-5 sm:h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%`, minWidth: '2rem' }}>
                        <span className="text-[10px] sm:text-xs font-bold text-white">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   SHARED COMPONENTS
   ============================================ */

function SummaryCard({ title, value, color }: {
  title: string; value: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
  };
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colorClasses[color]}`}>
      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
      <p className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">{value}</p>
    </div>
  );
}

function ReportLoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin text-3xl sm:text-4xl mb-3">&#9203;</div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{"\u0141adowanie raportu..."}</p>
      </div>
    </div>
  );
}

function ReportErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{message}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{"Spr\u00f3buj od\u015bwie\u017cy\u0107 stron\u0119"}</p>
      </div>
    </div>
  );
}

function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
      </div>
    </div>
  );
}
