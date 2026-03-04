'use client';

import { useCateringOrderHistory } from '@/hooks/use-catering-orders';
import { Loader2, CircleCheck, RefreshCw, PenLine, CircleDot } from 'lucide-react';
import type { CateringOrderHistoryEntry } from '@/types/catering-order.types';
import { ORDER_STATUS_LABEL } from '@/types/catering-order.types';

const CHANGE_TYPE_LABEL: Record<string, string> = {
  CREATED: 'Zamówienie utworzone',
  STATUS_CHANGE: 'Zmiana statusu',
  UPDATED: 'Zaktualizowano',
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function entryLabel(entry: CateringOrderHistoryEntry) {
  if (entry.changeType === 'STATUS_CHANGE' && entry.oldValue && entry.newValue) {
    const from = ORDER_STATUS_LABEL[entry.oldValue as keyof typeof ORDER_STATUS_LABEL] ?? entry.oldValue;
    const to = ORDER_STATUS_LABEL[entry.newValue as keyof typeof ORDER_STATUS_LABEL] ?? entry.newValue;
    return `${from} → ${to}`;
  }
  if (entry.changeType === 'CREATED') return 'Zamówienie zostało utworzone';
  return entry.newValue ?? '—';
}

function getAuthorInitials(author?: { firstName?: string; lastName?: string } | null) {
  const f = author?.firstName?.[0] ?? '';
  const l = author?.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function getEntryConfig(changeType: string) {
  switch (changeType) {
    case 'CREATED':
      return {
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        dotBg: 'bg-emerald-500',
        Icon: CircleCheck,
      };
    case 'STATUS_CHANGE':
      return {
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
        dotBg: 'bg-blue-500',
        Icon: RefreshCw,
      };
    case 'UPDATED':
      return {
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        dotBg: 'bg-amber-500',
        Icon: PenLine,
      };
    default:
      return {
        iconBg: 'bg-neutral-100 dark:bg-neutral-800',
        iconColor: 'text-neutral-500 dark:text-neutral-400',
        dotBg: 'bg-neutral-400',
        Icon: CircleDot,
      };
  }
}

export function OrderTimeline({ orderId }: { orderId: string }) {
  const { data: history, isLoading } = useCateringOrderHistory(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Ładowanie historii...</span>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
          <CircleDot className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
        </div>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Brak wpisów w historii</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Oś czasu — pionowa linia */}
      <div className="absolute left-4 top-5 bottom-2 w-px bg-neutral-200 dark:bg-neutral-700" />

      <ol className="space-y-5">
        {history.map((entry) => {
          const { iconBg, iconColor, Icon } = getEntryConfig(entry.changeType);

          return (
            <li key={entry.id} className="relative flex items-start gap-4">
              {/* Ikona typu zdarzenia */}
              <div
                className={`relative z-10 shrink-0 w-8 h-8 rounded-full ${iconBg} flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow-sm`}
              >
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>

              {/* Treść */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {CHANGE_TYPE_LABEL[entry.changeType] ?? entry.changeType}
                </p>

                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {entryLabel(entry)}
                </p>

                {entry.reason && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic mt-0.5">
                    Powód: {entry.reason}
                  </p>
                )}

                {/* Data + autor */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatDate(entry.createdAt)}
                  </span>

                  {entry.changedBy && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-300 dark:text-neutral-600 text-xs">·</span>
                      <div
                        className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0"
                        style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}
                      >
                        {getAuthorInitials(entry.changedBy)}
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {entry.changedBy.firstName} {entry.changedBy.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
