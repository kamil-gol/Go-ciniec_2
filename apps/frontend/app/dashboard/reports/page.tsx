'use client';

// apps/frontend/app/dashboard/reports/page.tsx

import { useState, useCallback } from 'react';
import {
  useRevenueReport,
  useOccupancyReport,
  exportRevenueExcel,
  exportRevenuePDF,
  exportOccupancyExcel,
  exportOccupancyPDF,
} from '@/hooks/use-reports';
import type {
  RevenueReportFilters,
  OccupancyReportFilters,
  GroupByPeriod,
} from '@/types/reports.types';

// ============================================
// HELPERS
// ============================================

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

const getDatePresets = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDayThisMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDayThisMonth = new Date(year, month + 1, 0);
  const lastDayThisMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayThisMonth.getDate()).padStart(2, '0')}`;

  const firstDayLastMonth = month === 0
    ? `${year - 1}-12-01`
    : `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayLastMonth = new Date(year, month, 0);
  const lastDayLastMonthStr = month === 0
    ? `${year - 1}-12-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`
    : `${year}-${String(month).padStart(2, '0')}-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`;

  return [
    { label: 'Ten miesi\u0105c', dateFrom: firstDayThisMonth, dateTo: lastDayThisMonthStr },
    { label: 'Poprzedni miesi\u0105c', dateFrom: firstDayLastMonth, dateTo: lastDayLastMonthStr },
    { label: 'Ten rok', dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` },
    { label: 'Poprzedni rok', dateFrom: `${year - 1}-01-01`, dateTo: `${year - 1}-12-31` },
  ];
};

const dayNamesPL: Record<string, string> = {
  Sunday: 'Niedziela',
  Monday: 'Poniedzia\u0142ek',
  Tuesday: 'Wtorek',
  Wednesday: '\u015aroda',
  Thursday: 'Czwartek',
  Friday: 'Pi\u0105tek',
  Saturday: 'Sobota',
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ReportsPage() {
  const now = new Date();
  const year = now.getFullYear();

  // Active tab
  const [activeTab, setActiveTab] = useState<'revenue' | 'occupancy'>('revenue');

  // Filters state
  const [dateFrom, setDateFrom] = useState(`${year}-01-01`);
  const [dateTo, setDateTo] = useState(`${year}-12-31`);
  const [groupBy, setGroupBy] = useState<GroupByPeriod>('month');
  const [hallId, setHallId] = useState<string>('');
  const [eventTypeId, setEventTypeId] = useState<string>('');

  // Export loading states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Build filters
  const revenueFilters: RevenueReportFilters = {
    dateFrom,
    dateTo,
    groupBy,
    ...(hallId && { hallId }),
    ...(eventTypeId && { eventTypeId }),
  };

  const occupancyFilters: OccupancyReportFilters = {
    dateFrom,
    dateTo,
    ...(hallId && { hallId }),
  };

  // Queries
  const revenueQuery = useRevenueReport(revenueFilters, activeTab === 'revenue');
  const occupancyQuery = useOccupancyReport(occupancyFilters, activeTab === 'occupancy');

  // Export handlers
  const handleExportExcel = useCallback(async () => {
    setExportingExcel(true);
    try {
      if (activeTab === 'revenue') {
        await exportRevenueExcel(revenueFilters);
      } else {
        await exportOccupancyExcel(occupancyFilters);
      }
    } catch (error) {
      alert('B\u0142\u0105d eksportu Excel. Spr\u00f3buj ponownie.');
    } finally {
      setExportingExcel(false);
    }
  }, [activeTab, revenueFilters, occupancyFilters]);

  const handleExportPDF = useCallback(async () => {
    setExportingPDF(true);
    try {
      if (activeTab === 'revenue') {
        await exportRevenuePDF(revenueFilters);
      } else {
        await exportOccupancyPDF(occupancyFilters);
      }
    } catch (error) {
      alert('B\u0142\u0105d eksportu PDF. Spr\u00f3buj ponownie.');
    } finally {
      setExportingPDF(false);
    }
  }, [activeTab, revenueFilters, occupancyFilters]);

  const presets = getDatePresets();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">\ud83d\udcca Raporty</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analityka przychod\u00f3w i zaj\u0119to\u015bci sal
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {exportingExcel ? (
              <span className="animate-spin">\u23f3</span>
            ) : (
              <span>\ud83d\udce5</span>
            )}
            Eksport Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {exportingPDF ? (
              <span className="animate-spin">\u23f3</span>
            ) : (
              <span>\ud83d\udcc4</span>
            )}
            Eksport PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'revenue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            \ud83d\udcb0 Przychody
          </button>
          <button
            onClick={() => setActiveTab('occupancy')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'occupancy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            \ud83c\udfe2 Zaj\u0119to\u015b\u0107 sal
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date presets */}
          <div className="flex gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setDateFrom(preset.dateFrom);
                  setDateTo(preset.dateTo);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  dateFrom === preset.dateFrom && dateTo === preset.dateTo
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="flex gap-2 items-center">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Od</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-gray-400 mt-5">\u2192</span>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Do</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Group by (only for revenue) */}
          {activeTab === 'revenue' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Grupuj po</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByPeriod)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="day">Dzie\u0144</option>
                <option value="week">Tydzie\u0144</option>
                <option value="month">Miesi\u0105c</option>
                <option value="year">Rok</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'revenue' ? (
        <RevenueTab query={revenueQuery} />
      ) : (
        <OccupancyTab query={occupancyQuery} />
      )}
    </div>
  );
}

// ============================================
// REVENUE TAB
// ============================================

function RevenueTab({ query }: { query: ReturnType<typeof useRevenueReport> }) {
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="B\u0142\u0105d \u0142adowania raportu przychod\u00f3w" />;
  if (!query.data) return <EmptyState message="Brak danych do wy\u015bwietlenia" />;

  const { summary, breakdown, byHall, byEventType } = query.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="\u0141\u0105czny przych\u00f3d"
          value={formatCurrency(summary.totalRevenue)}
          icon="\ud83d\udcb0"
          color="blue"
        />
        <SummaryCard
          title="\u015arednia / rezerwacj\u0119"
          value={formatCurrency(summary.avgRevenuePerReservation)}
          icon="\ud83d\udcca"
          color="green"
        />
        <SummaryCard
          title="Wzrost vs okres wcze\u015bniej"
          value={formatPercent(summary.growthPercent)}
          icon={summary.growthPercent >= 0 ? '\ud83d\udcc8' : '\ud83d\udcc9'}
          color={summary.growthPercent >= 0 ? 'green' : 'red'}
        />
        <SummaryCard
          title="Rezerwacje"
          value={`${summary.totalReservations} (${summary.completedReservations} zrealizowanych)`}
          icon="\ud83d\udccb"
          color="purple"
        />
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Najlepszy dzie\u0144</p>
          <p className="text-lg font-semibold text-gray-900">
            {summary.maxRevenueDay || 'Brak danych'}
          </p>
          <p className="text-sm text-green-600 font-medium">
            {formatCurrency(summary.maxRevenueDayAmount)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Oczekuj\u0105cy przych\u00f3d</p>
          <p className="text-lg font-semibold text-orange-600">
            {formatCurrency(summary.pendingRevenue)}
          </p>
          <p className="text-sm text-gray-500">
            Z {summary.totalReservations - summary.completedReservations} niezrealizowanych rezerwacji
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">\ud83d\udcc5 Przychody wg okresu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Okres</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Przych\u00f3d</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rezerwacje</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">\u015ar. przych\u00f3d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.map((item) => (
                  <tr key={item.period} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{item.period}</td>
                    <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{item.count}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {formatCurrency(item.avgRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Hall & By Event Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Hall */}
        {byHall.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">\ud83c\udfdb\ufe0f Przychody wg sali</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Przych\u00f3d</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ilo\u015b\u0107</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byHall.map((item, index) => (
                    <tr key={item.hallId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">
                          {index === 0 && '\ud83e\udd47 '}
                          {index === 1 && '\ud83e\udd48 '}
                          {index === 2 && '\ud83e\udd49 '}
                          {item.hallName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* By Event Type */}
        {byEventType.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">\ud83c\udf89 Przychody wg typu wydarzenia</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Przych\u00f3d</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ilo\u015b\u0107</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byEventType.map((item, index) => (
                    <tr key={item.eventTypeId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">
                          {index === 0 && '\ud83e\udd47 '}
                          {index === 1 && '\ud83e\udd48 '}
                          {index === 2 && '\ud83e\udd49 '}
                          {item.eventTypeName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{item.count}</td>
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

// ============================================
// OCCUPANCY TAB
// ============================================

function OccupancyTab({ query }: { query: ReturnType<typeof useOccupancyReport> }) {
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="B\u0142\u0105d \u0142adowania raportu zaj\u0119to\u015bci" />;
  if (!query.data) return <EmptyState message="Brak danych do wy\u015bwietlenia" />;

  const { summary, halls, peakHours, peakDaysOfWeek } = query.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="\u015arednia zaj\u0119to\u015b\u0107"
          value={`${summary.avgOccupancy}%`}
          icon="\ud83d\udcca"
          color="blue"
        />
        <SummaryCard
          title="Najlepszy dzie\u0144 tygodnia"
          value={dayNamesPL[summary.peakDay] || summary.peakDay}
          icon="\ud83d\udcc5"
          color="green"
        />
        <SummaryCard
          title="Najpopularniejsza sala"
          value={summary.peakHall || 'Brak danych'}
          icon="\ud83c\udfdb\ufe0f"
          color="purple"
        />
        <SummaryCard
          title="\u0141\u0105cznie rezerwacji"
          value={`${summary.totalReservations} / ${summary.totalDaysInPeriod} dni`}
          icon="\ud83d\udccb"
          color="orange"
        />
      </div>

      {/* Hall Rankings */}
      {halls.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">\ud83c\udfdb\ufe0f Zaj\u0119to\u015b\u0107 wg sali</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Zaj\u0119to\u015b\u0107</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rezerwacje</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">\u015ar. go\u015bci</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {halls.map((hall, index) => (
                  <tr key={hall.hallId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">
                        {index === 0 && '\ud83e\udd47 '}
                        {index === 1 && '\ud83e\udd48 '}
                        {index === 2 && '\ud83e\udd49 '}
                        {hall.hallName}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center">
                        <span
                          className="inline-block w-16 h-2 rounded-full bg-gray-200 mr-2"
                        >
                          <span
                            className="block h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.min(hall.occupancy, 100)}%` }}
                          />
                        </span>
                        <span className="font-semibold text-blue-700">{hall.occupancy}%</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{hall.reservations}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{hall.avgGuestsPerReservation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Peak Hours & Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        {peakHours.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">\ud83d\udd50 Popularne godziny</h3>
            </div>
            <div className="p-4 space-y-2">
              {peakHours.map((item) => {
                const maxCount = peakHours[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div key={item.hour} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-12">
                      {String(item.hour).padStart(2, '0')}:00
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%`, minWidth: '2rem' }}
                      >
                        <span className="text-xs font-bold text-white">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Peak Days */}
        {peakDaysOfWeek.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">\ud83d\udcc5 Popularne dni tygodnia</h3>
            </div>
            <div className="p-4 space-y-2">
              {peakDaysOfWeek.map((item) => {
                const maxCount = peakDaysOfWeek[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div key={item.dayOfWeekNum} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-24">
                      {dayNamesPL[item.dayOfWeek] || item.dayOfWeek}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%`, minWidth: '2rem' }}
                      >
                        <span className="text-xs font-bold text-white">{item.count}</span>
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

// ============================================
// SHARED COMPONENTS
// ============================================

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">\u23f3</div>
        <p className="text-sm text-gray-500">\u0141adowanie raportu...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-4xl mb-3">\u274c</div>
        <p className="text-sm text-red-600 font-medium">{message}</p>
        <p className="text-xs text-gray-500 mt-1">Spr\u00f3buj od\u015bwie\u017cy\u0107 stron\u0119</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-4xl mb-3">\ud83d\udced</div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
