// apps/frontend/components/audit-log/details/DetailsVisualization.tsx

import { Info, Tag } from 'lucide-react';
import { isDiffFormat } from './formatters';
import {
  StatusChangeCard,
  DiffChangesCard,
  FlatChangesCard,
  ToggleCard,
  CreatedDataCard,
  PaymentCard,
  DeletedDataCard,
  DiscountCard,
  ReorderCard,
  SourceIdRow,
  FlatChangeRow,
} from './ChangeCards';

/** Renders the appropriate visualization for the details section */
export function DetailsVisualization({ details, action }: { details: Record<string, any>; action: string }) {
  const cards: React.ReactNode[] = [];

  // 1) Description
  if (details.description) {
    cards.push(
      <div key="desc" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/50">
        <Info className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{details.description}</p>
      </div>
    );
  }

  // 2) Reason / changeReason
  const reasonText = details.reason || details.changeReason;
  if (reasonText) {
    cards.push(
      <div key="reason" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30">
        <Tag className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Powód</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{reasonText}</p>
        </div>
      </div>
    );
  }

  // 3) Status change (oldStatus/newStatus)
  if (details.oldStatus || details.newStatus) {
    cards.push(
      <StatusChangeCard key="status-change" oldStatus={details.oldStatus} newStatus={details.newStatus} />
    );
  }

  // 4) Changes (diffObjects format: { field: {old, new} })
  if (details.changes) {
    if (isDiffFormat(details.changes)) {
      cards.push(<DiffChangesCard key="diff-changes" changes={details.changes} />);
    } else {
      // Flat changes (key: value without old/new)
      cards.push(<FlatChangesCard key="flat-changes" changes={details.changes} />);
    }
  }

  // 5) Toggle (oldValue/newValue at top level)
  if ('oldValue' in details || 'newValue' in details) {
    cards.push(
      <ToggleCard key="toggle" oldValue={details.oldValue} newValue={details.newValue} fieldName={details.fieldName} />
    );
  }

  // 6) Created data
  if (details.data && (action.includes('CREATE') || action === 'DEPOSIT_CREATED' || action === 'MARK_PAID')) {
    if (action === 'MARK_PAID') {
      cards.push(<PaymentCard key="payment" details={details} />);
    } else {
      cards.push(<CreatedDataCard key="created" data={details.data} />);
    }
  }

  // 7) Deleted data
  if (details.deletedData) {
    cards.push(<DeletedDataCard key="deleted" data={details.deletedData} />);
  }

  // 8) Discount
  if (details.discountType || details.removedDiscount) {
    cards.push(<DiscountCard key="discount" details={details} />);
  }

  // 9) Reorder
  if (details.orderedIds && Array.isArray(details.orderedIds)) {
    cards.push(<ReorderCard key="reorder" orderedIds={details.orderedIds} />);
  }

  // 10) Duplicate source
  if (details.sourceId) {
    cards.push(<SourceIdRow key="source" sourceId={details.sourceId} />);
  }

  // 11) Fallback for any remaining unknown keys (excluding already rendered)
  const renderedKeys = new Set([
    'description', 'reason', 'changeReason', 'changes', 'oldValue', 'newValue', 'fieldName',
    'data', 'deletedData', 'discountType', 'discountValue', 'discountAmount',
    'removedDiscount', 'restoredPrice', 'orderedIds', 'sourceId',
    'oldStatus', 'newStatus',
  ]);
  const remainingEntries = Object.entries(details).filter(([k]) => !renderedKeys.has(k));

  if (remainingEntries.length > 0) {
    cards.push(
      <div key="extra" className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-700">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Szczegółowe dane</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {remainingEntries.map(([key, value]) => (
            <FlatChangeRow key={key} fieldName={key} value={value} />
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) return null;

  return <div className="space-y-3">{cards}</div>;
}
