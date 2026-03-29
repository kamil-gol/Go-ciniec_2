import { SummaryCard, ReportLoadingState, ReportErrorState, ReportEmptyState } from './ReportSummaryCards';
import { formatCurrency, formatPercent } from './chart-utils';
import type { RevenueQueryResult } from './types';

export function RevenueTab({ query }: { query: RevenueQueryResult }) {
  if (query.isLoading) return <ReportLoadingState />;
  if (query.isError) return <ReportErrorState message={"Błąd ładowania raportu przychodów"} />;
  if (!query.data) return <ReportEmptyState message={"Brak danych do wyświetlenia"} />;

  const { summary, breakdown, byHall, byEventType, byCategoryExtra } = query.data as any;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard title={"Łączny przychód"} value={formatCurrency(summary.totalRevenue)} color="blue" />
        <SummaryCard title={"Śr. / rezerwację"} value={formatCurrency(summary.avgRevenuePerReservation)} color="green" />
        <SummaryCard title={"Wzrost vs wcześniej"} value={formatPercent(summary.growthPercent)} color={summary.growthPercent >= 0 ? 'green' : 'red'} />
        <SummaryCard title="Rezerwacje" value={`${summary.totalReservations} (${summary.completedReservations} zreal.)`} color="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">{"Najlepszy dzień"}</p>
          <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">{summary.maxRevenueDay || 'Brak danych'}</p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">{formatCurrency(summary.maxRevenueDayAmount)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">{"Oczekujący przychód"}</p>
          <p className="text-base sm:text-lg font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(summary.pendingRevenue)}</p>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">Z {summary.totalReservations - summary.completedReservations} niezrealizowanych</p>
        </div>
                {summary.extrasRevenue != null && summary.extrasRevenue > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">✨ Przychody z usług dodatkowych</p>
                              <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.extrasRevenue)}</p>
                              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Usługi dodatkowe</p>
                            </div>
              )}
                {summary.categoryExtrasRevenue != null && summary.categoryExtrasRevenue > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">🍽️ Dodatkowo płatne porcje</p>
                              <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.categoryExtrasRevenue)}</p>
                              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Porcje dodatkowe</p>
                            </div>
              )}
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
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">Okres</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Przychód"}</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">Rez.</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">{"Śr."}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {breakdown.map((item: any) => (
                  <tr key={item.period} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{item.period}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">{item.count}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">{formatCurrency(item.avgRevenue)}</td>
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
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">Sala</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Przychód"}</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Ilość"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {byHall.map((item: any) => (
                    <tr key={item.hallId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.hallName}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{item.count}</td>
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
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">Typ</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Przychód"}</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Ilość"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {byEventType.map((item: any) => (
                    <tr key={item.eventTypeId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.eventTypeName}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* #216: Dodatkowo platne porcje breakdown */}
      {byCategoryExtra && byCategoryExtra.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">🍽️ Dodatkowo płatne porcje</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">Kategoria</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">{"Przychód"}</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">Porcje</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase hidden sm:table-cell">{"Śr."}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {byCategoryExtra.map((item: any) => (
                  <tr key={item.categoryName} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.categoryName}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-amber-700 dark:text-amber-400 font-semibold whitespace-nowrap">{formatCurrency(item.revenue)}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{item.totalQuantity}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">{formatCurrency(item.avgRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
