'use client';

import { useCateringOrderHistory } from '@/hooks/use-catering-orders';
import { Loader2, History } from 'lucide-react';
import type { CateringOrderHistoryEntry } from '@/types/catering-order.types';
import { ORDER_STATUS_LABEL } from '@/types/catering-order.types';

const CHANGE_TYPE_LABEL: Record<string, string> = {
  CREATED: 'Zamówienie utworzone',
  STATUS_CHANGE: 'Zmiana statusu',
  UPDATED: 'Zaktualizowano',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function entryLabel(entry: CateringOrderHistoryEntry) {
  if (entry.changeType === 'STATUS_CHANGE' && entry.oldValue && entry.newValue) {
    const from = ORDER_STATUS_LABEL[entry.oldValue as keyof typeof ORDER_STATUS_LABEL] ?? entry.oldValue;
    const to = ORDER_STATUS_LABEL[entry.newValue as keyof typeof ORDER_STATUS_LABEL] ?? entry.newValue;
    return `${from} → ${to}`;
  }
  if (entry.changeType === 'CREATED') {
    return 'Zamówienie zostało utworzone';
  }
  return entry.newValue ?? '—';
}

export function OrderTimeline({ orderId }: { orderId: string }) {
  const { data: history, isLoading } = useCateringOrderHistory(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Ładowanie historii...</span>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Brak wpisów w historii</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <History className="h-4 w-4" /> Historia zmian
      </h3>
      <ol className="relative border-l border-border ml-3 space-y-4">
        {history.map(entry => (
          <li key={entry.id} className="ml-4">
            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-muted-foreground" />
            <p className="text-sm font-medium">
              {CHANGE_TYPE_LABEL[entry.changeType] ?? entry.changeType}
            </p>
            <p className="text-sm text-muted-foreground">{entryLabel(entry)}</p>
            {entry.reason && (
              <p className="text-xs text-muted-foreground italic">Powód: {entry.reason}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
              {entry.changedBy && (
                <span className="text-xs text-muted-foreground">
                  · {entry.changedBy.firstName} {entry.changedBy.lastName}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
