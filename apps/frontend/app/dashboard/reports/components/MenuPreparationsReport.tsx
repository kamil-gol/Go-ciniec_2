import { Users, Clock, ChefHat } from 'lucide-react';
import { SummaryCard, ReportLoadingState, ReportErrorState, ReportEmptyState } from './ReportSummaryCards';
import { formatTime } from './chart-utils';
import type { MenuPreparationsQueryResult } from './types';

/**
 * Badge for portionTarget -- shows who the course serves (dorośli / dzieci).
 * Renders nothing for ALL (default).
 */
function PortionTargetBadge({ target }: { target?: string }) {
  if (!target || target === 'ALL') return null;
  if (target === 'ADULTS_ONLY') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ml-1.5 normal-case tracking-normal">
        👤 dorośli
      </span>
    );
  }
  if (target === 'CHILDREN_ONLY') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 ml-1.5 normal-case tracking-normal">
        🧒 dzieci
      </span>
    );
  }
  return null;
}

export function MenuPreparationsTab({ query, view }: {
  query: MenuPreparationsQueryResult;
  view: 'detailed' | 'summary';
}) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"Błąd ładowania raportu menu"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wyświetlenia"} />;

  const { summary, days, summaryDays } = query.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"Rezerwacje z menu"} value={`${summary.totalMenus}`} color="orange" />
        <SummaryCard
          title={"Łącznie gości"}
          value={`${summary.totalGuests}`}
          color="blue"
        />
        <SummaryCard
          title="Top pakiet"
          value={summary.topPackage ? `${summary.topPackage.name} (${summary.topPackage.count})` : 'Brak'}
          color="green"
        />
        <SummaryCard
          title={"Goście (D/Dz/M)"}
          value={`${summary.totalAdults} / ${summary.totalChildren} / ${summary.totalToddlers}`}
          color="purple"
        />
      </div>

      {/* DETAILED VIEW */}
      {view === 'detailed' && days && days.length > 0 && (
        <div className="space-y-4">
          {days.map((day: any) => (
            <div key={day.date} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-800 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>{"📅"}</span> {day.dateLabel}
                </h3>
                <span className="text-xs text-neutral-300">
                  {day.totalReservations} {day.totalReservations === 1 ? 'rezerwacja' : 'rezerwacji'} &middot; {day.totalGuests} gości
                </span>
              </div>
              {day.reservations.map((res: any) => (
                <div key={res.reservationId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                  {/* Reservation header */}
                  <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {res.clientName}
                      </span>
                      {res.hallName && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          ({res.hallName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {res.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(res.startTime)}{res.endTime ? ` – ${formatTime(res.endTime)}` : ''}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {res.guests.total} ({res.guests.adults}D + {res.guests.children}Dz + {res.guests.toddlers}M)
                      </span>
                    </div>
                  </div>
                  {/* Package info */}
                  <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      <ChefHat className="h-3 w-3" />
                      Pakiet: <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{res.package.name}</span>
                    </span>
                  </div>
                  {/* Courses & dishes -- with portionTarget badge */}
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {res.courses.map((course: any, ci: number) => (
                      <div key={ci} className="px-4 py-2">
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1 flex items-center">
                          {course.courseName}
                          <PortionTargetBadge target={(course as any).portionTarget} />
                        </div>
                        <div className="space-y-0.5">
                          {course.dishes.map((dish: any, di: number) => (
                            <div key={di} className="flex items-start gap-2 text-sm">
                              <span className="text-neutral-400 mt-0.5">•</span>
                              <div>
                                <span className="text-neutral-900 dark:text-neutral-100">{dish.name}</span>
                                {dish.description && (
                                  <span className="text-neutral-400 dark:text-neutral-500 text-xs ml-1.5">— {dish.description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {res.courses.length === 0 && (
                      <div className="px-4 py-3 text-xs text-neutral-400">Brak dań w menu</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {view === 'detailed' && (!days || days.length === 0) && (
        <ReportEmptyState message={"Brak danych menu dla wybranego okresu"} />
      )}

      {/* SUMMARY VIEW -- with Maluchy column + portionTarget badge */}
      {view === 'summary' && summaryDays && summaryDays.length > 0 && (
        <div className="space-y-4">
          {summaryDays.map((day: any) => (
            <div key={day.date} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-800 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>{"📅"}</span> {day.dateLabel}
                </h3>
                <span className="text-xs text-neutral-300">
                  {day.totalReservations} rez. &middot; {day.totalGuests} gości
                </span>
              </div>
              {day.courses.map((course: any, ci: number) => (
                <div key={ci} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                  <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide inline-flex items-center">
                      {course.courseName}
                      <PortionTargetBadge target={(course as any).portionTarget} />
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col className="w-[26%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%] hidden sm:table-column" />
                        <col className="w-[10%] hidden sm:table-column" />
                        <col className="w-[10%] hidden sm:table-column" />
                        <col className="w-[34%] hidden lg:table-column" />
                      </colgroup>
                      <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">Danie</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Porcje</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">{"Dorosłe"}</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Dziecięce</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Maluchy</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Klienci</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {course.dishes.map((dish: any, di: number) => (
                          <tr key={di} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100 truncate">{dish.dishName}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300 font-semibold">{dish.totalPortions}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{dish.adultPortions}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{dish.childrenPortions}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{dish.toddlerPortions}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-neutral-500 dark:text-neutral-500 text-xs hidden lg:table-cell truncate">
                              {dish.reservations.map((r: any) => `${r.clientName} (${r.guests})`).join(', ')}
                            </td>
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
      {view === 'summary' && (!summaryDays || summaryDays.length === 0) && (
        <ReportEmptyState message={"Brak danych zbiorczych menu dla wybranego okresu"} />
      )}
    </div>
  );
}
