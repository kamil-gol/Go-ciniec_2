import { Clock, Calendar } from 'lucide-react';
import { SummaryCard, ReportLoadingState, ReportErrorState, ReportEmptyState } from './ReportSummaryCards';
import { formatTime } from './chart-utils';
import type { PreparationsQueryResult } from './types';

export function PreparationsTab({ query, view }: {
  query: PreparationsQueryResult;
  view: 'detailed' | 'summary';
}) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"Błąd ładowania raportu przygotowań"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wyświetlenia"} />;

  const { summary, days, summaryDays } = query.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"Łączna liczba usług"} value={`${summary.totalExtras}`} color="purple" />
        <SummaryCard title={"Rezerwacje z extras"} value={`${summary.totalReservationsWithExtras}`} color="blue" />
        <SummaryCard
          title="Top kategoria"
          value={summary.topCategory ? `${summary.topCategory.name} (${summary.topCategory.count})` : 'Brak'}
          color="green"
        />
        <SummaryCard
          title={"Najbliższe wydarzenie"}
          value={summary.nearestEvent ? `${summary.nearestEvent.date}` : 'Brak'}
          color="orange"
        />
      </div>

      {/* DETAILED VIEW */}
      {view === 'detailed' && days && days.length > 0 && (
        <div className="space-y-4">
          {days.map((day: any) => (
            <div key={day.date} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-800 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {day.dateLabel}
                </h3>
                <span className="text-xs text-neutral-300">
                  {day.totalItems} {day.totalItems === 1 ? 'usługa' : 'usług'}
                </span>
              </div>
              {day.categories.map((cat: any) => (
                <div key={cat.categoryId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                  <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/20">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[10%]" />
                        <col className="w-[35%] hidden sm:table-column" />
                        <col className="w-[25%] hidden lg:table-column" />
                      </colgroup>
                      <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase truncate">{"Usługa"}</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Ilość"}</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">Rezerwacja</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden lg:table-cell">Uwagi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {cat.items.map((item: any) => (
                          <tr key={item.extraId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.serviceName}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300 font-semibold">{item.quantity}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-neutral-600 dark:text-neutral-300 text-xs hidden sm:table-cell">
                              <div className="flex flex-col">
                                <span className="truncate">{item.reservation.clientName} ({item.reservation.hallName})</span>
                                {item.reservation.startTime && (
                                  <span className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500 mt-0.5">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    {formatTime(item.reservation.startTime)}{item.reservation.endTime ? ` – ${formatTime(item.reservation.endTime)}` : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-neutral-500 dark:text-neutral-500 text-xs hidden lg:table-cell truncate">{item.note || '—'}</td>
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
        <ReportEmptyState message={"Brak danych szczegółowych dla wybranego okresu"} />
      )}

      {/* SUMMARY VIEW */}
      {view === 'summary' && summaryDays && summaryDays.length > 0 && (
        <div className="space-y-4">
          {summaryDays.map((day: any) => (
            <div key={day.date} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-800 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {day.dateLabel}
                </h3>
                <span className="text-xs text-neutral-300">
                  {day.totalItems} {day.totalItems === 1 ? 'usługa' : 'usług'} &middot; {day.totalReservations} rez.
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[18%] hidden sm:table-column" />
                    <col className="w-[12%]" />
                    <col className="w-[12%] hidden sm:table-column" />
                    <col className="w-[33%] hidden lg:table-column" />
                  </colgroup>
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Usługa"}</th>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">Kategoria</th>
                      <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Łącznie szt."}</th>
                      <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">Rezerwacji</th>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden lg:table-column">Klienci</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {day.items.map((item: any) => (
                      <tr key={item.serviceItemId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.serviceName}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 truncate">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300 font-semibold">{item.totalQuantity}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">{item.reservationCount}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-neutral-500 dark:text-neutral-500 text-xs hidden lg:table-column truncate">
                          {item.reservations.map((r: any) => {
                            const time = formatTime(r.startTime);
                            return time
                              ? `${r.clientName} ${time}`
                              : r.clientName;
                          }).join(', ')}
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
