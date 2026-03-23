import type { SummaryCardColor } from './types';

const colorClasses: Record<SummaryCardColor, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
  orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
};

export function SummaryCard({ title, value, color }: {
  title: string; value: string;
  color: SummaryCardColor;
}) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colorClasses[color]}`}>
      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
      <p className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">{value}</p>
    </div>
  );
}

export function ReportLoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin text-3xl sm:text-4xl mb-3">&#9203;</div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{"Ładowanie raportu..."}</p>
      </div>
    </div>
  );
}

export function ReportErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{message}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{"Spróbuj odświeżyć stronę"}</p>
      </div>
    </div>
  );
}

export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
      </div>
    </div>
  );
}
