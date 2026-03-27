'use client';

import type { GroupByPeriod } from '@/types/reports.types';
import type { ReportFiltersProps } from './types';

export function ReportFilters({
  presets,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  activeTab,
  groupBy,
  setGroupBy,
  prepView,
  setPrepView,
  menuPrepView,
  setMenuPrepView,
}: ReportFiltersProps) {
  const showViewToggle = activeTab === 'preparations' || activeTab === 'menu-preparations';
  const currentView = activeTab === 'menu-preparations' ? menuPrepView : prepView;
  const setCurrentView = activeTab === 'menu-preparations' ? setMenuPrepView : setPrepView;
  const viewColor = activeTab === 'menu-preparations' ? 'amber' : 'purple';

  return (
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
                className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Do</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-blue-500" />
            </div>
          </div>
          {activeTab === 'revenue' && (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Grupuj po</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupByPeriod)}
                className="w-full sm:w-auto px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-blue-500">
                <option value="day">{"Dzień"}</option>
                <option value="week">{"Tydzień"}</option>
                <option value="month">{"Miesiąc"}</option>
                <option value="year">Rok</option>
              </select>
            </div>
          )}
          {showViewToggle && (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Widok</label>
              <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-600 overflow-hidden">
                <button onClick={() => setCurrentView('detailed')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${currentView === 'detailed' ? `bg-${viewColor}-600 text-white` : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
                  {"Szczegółowy"}
                </button>
                <button onClick={() => setCurrentView('summary')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${currentView === 'summary' ? `bg-${viewColor}-600 text-white` : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
                  Zbiorczy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
