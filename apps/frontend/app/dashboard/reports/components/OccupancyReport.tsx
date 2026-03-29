import { SummaryCard, ReportLoadingState, ReportErrorState, ReportEmptyState } from './ReportSummaryCards';
import { dayNamesPL } from './chart-utils';
import type { OccupancyQueryResult } from './types';

export function OccupancyTab({ query }: { query: OccupancyQueryResult }) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"Błąd ładowania raportu zajętości"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wyświetlenia"} />;

  const { summary, halls, peakHours, peakDaysOfWeek } = query.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"Śr. zajętość"} value={`${summary.avgOccupancy}%`} color="blue" />
        <SummaryCard title={"Najlepszy dzień"} value={dayNamesPL[summary.peakDay] || summary.peakDay} color="green" />
        <SummaryCard title="Top sala" value={summary.peakHall || 'Brak'} color="purple" />
        <SummaryCard title="Rezerwacje" value={`${summary.totalReservations} / ${summary.totalDaysInPeriod} dni`} color="orange" />
      </div>

      {halls.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{"Zajętość wg sali"}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">Sala</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Zajętość"}</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">Rez.</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">{"Śr. gości"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {halls.map((hall: any) => (
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
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">{hall.reservations}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">{hall.avgGuestsPerReservation}</td>
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
              {peakHours.map((item: any) => {
                const maxCount = peakHours[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div key={item.hour} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 w-10 sm:w-12">{String(item.hour).padStart(2, '0')}:00</span>
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
              {peakDaysOfWeek.map((item: any) => {
                const maxCount = peakDaysOfWeek[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div key={item.dayOfWeekNum} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 w-16 sm:w-24 truncate">{dayNamesPL[item.dayOfWeek] || item.dayOfWeek}</span>
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
