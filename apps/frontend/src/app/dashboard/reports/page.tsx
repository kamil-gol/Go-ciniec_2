'use client';

// apps/frontend/src/app/dashboard/reports/page.tsx

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
    { label: 'Ten miesiąc', dateFrom: firstDayThisMonth, dateTo: lastDayThisMonthStr },
    { label: 'Poprzedni miesiąc', dateFrom: firstDayLastMonth, dateTo: lastDayLastMonthStr },
    { label: 'Ten rok', dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` },
    { label: 'Poprzedni rok', dateFrom: `${year - 1}-01-01`, dateTo: `${year - 1}-12-31` },
  ];
};

const dayNamesPL: Record<string, string> = {
  Sunday: 'Niedziela',
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
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
      alert('Błąd eksportu Excel. Spróbuj ponownie.');
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
      alert('Błąd eksportu PDF. Spróbuj ponownie.');
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
          <h1 className="text-2xl font-bold text-gray-900">📊 Raporty</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analityka przychodów i zajętości sal
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {exportingExcel ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>📥</span>
            )}
            Eksport Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {exportingPDF ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>📄</span>
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
            💰 Przychody
          </button>
          <button
            onClick={() => setActiveTab('occupancy')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'occupancy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Zajętość sal
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
            <span className="text-gray-400 mt-5">→</span>
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
                <option value="day">Dzień</option>
                <option value="week">Tydzień</option>
                <option value="month">Miesiąc</option>
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
  if (query.isError) return <ErrorState message="Błąd ładowania raportu przychodów" />;
  if (!query.data) return <EmptyState message="Brak danych do wyświetlenia" />;

  const { summary, breakdown, byHall, byEventType } = query.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Łączny przychód"
          value={formatCurrency(summary.totalRevenue)}
          icon="💰"
          color="blue"
        />
        <SummaryCard
          title="Średnia / rezerwację"
          value={formatCurrency(summary.avgRevenuePerReservation)}
          icon="📊"
          color="green"
        />
        <SummaryCard
          title="Wzrost vs okres wcześniej"
          value={formatPercent(summary.growthPercent)}
          icon={summary.growthPercent >= 0 ? '📈' : '📉'}
          color={summary.growthPercent >= 0 ? 'green' : 'red'}
        />
        <SummaryCard
          title="Rezerwacje"
          value={`${summary.totalReservations} (${summary.completedReservations} zrealizowanych)`}
          icon="📋"
          color="purple"
        />
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Najlepszy dzień</p>
          <p className="text-lg font-semibold text-gray-900">
            {summary.maxRevenueDay || 'Brak danych'}
          </p>
          <p className="text-sm text-green-600 font-medium">
            {formatCurrency(summary.maxRevenueDayAmount)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Oczekujący przychód</p>
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
            <h3 className="text-sm font-semibold text-gray-900">📅 Przychody wg okresu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Okres</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Przychód</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rezerwacje</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Śr. przychód</th>
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
              <h3 className="text-sm font-semibold text-gray-900">🏛️ Przychody wg sali</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Przychód</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ilość</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byHall.map((item, index) => (
                    <tr key={item.hallId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
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
              <h3 className="text-sm font-semibold text-gray-900">🎉 Przychody wg typu wydarzenia</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Przychód</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ilość</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byEventType.map((item, index) => (
                    <tr key={item.eventTypeId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
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
  if (query.isError) return <ErrorState message="Błąd ładowania raportu zajętości" />;
  if (!query.data) return <EmptyState message="Brak danych do wyświetlenia" />;

  const { summary, halls, peakHours, peakDaysOfWeek } = query.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Średnia zajętość"
          value={`${summary.avgOccupancy}%`}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          title="Najlepszy dzień tygodnia"
          value={dayNamesPL[summary.peakDay] || summary.peakDay}
          icon="📅"
          color="green"
        />
        <SummaryCard
          title="Najpopularniejsza sala"
          value={summary.peakHall || 'Brak danych'}
          icon="🏛️"
          color="purple"
        />
        <SummaryCard
          title="Łącznie rezerwacji"
          value={`${summary.totalReservations} / ${summary.totalDaysInPeriod} dni`}
          icon="📋"
          color="orange"
        />
      </div>

      {/* Hall Rankings */}
      {halls.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">🏛️ Zajętość wg sali</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Zajętość</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rezerwacje</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Śr. gości</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {halls.map((hall, index) => (
                  <tr key={hall.hallId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">
                        {index === 0 && '🥇 '}
                        {index === 1 && '🥈 '}
                        {index === 2 && '🥉 '}
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
              <h3 className="text-sm font-semibold text-gray-900">🕐 Popularne godziny</h3>
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
              <h3 className="text-sm font-semibold text-gray-900">📅 Popularne dni tygodnia</h3>
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
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="text-sm text-gray-500">Ładowanie raportu...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-sm text-red-600 font-medium">{message}</p>
        <p className="text-xs text-gray-500 mt-1">Spróbuj odświeżyć stronę</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
