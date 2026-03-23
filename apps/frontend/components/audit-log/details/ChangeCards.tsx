// apps/frontend/components/audit-log/details/ChangeCards.tsx

import {
  ArrowRight, Plus, Trash2, ToggleLeft, Repeat, Layers, RefreshCw,
  CreditCard, Percent, ListOrdered, Package,
} from 'lucide-react';
import { enumTranslations } from './constants';
import { getFieldLabel, formatValue } from './formatters';

// ─── Row components ──────────────────────────────────────────────────────────

/** A single "old → new" change row */
export function DiffChangeRow({ fieldName, oldVal, newVal }: { fieldName: string; oldVal: any; newVal: any }) {
  const label = getFieldLabel(fieldName);
  const oldStr = formatValue(oldVal, fieldName);
  const newStr = formatValue(newVal, fieldName);

  return (
    <div className="flex items-start gap-3 py-3 px-4 group">
      <div className="w-[140px] flex-shrink-0 pt-0.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
        {/* Old value */}
        <div className="inline-flex items-center gap-1.5 max-w-[45%]">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm border border-red-100 dark:border-red-900/50 break-words">
            {oldStr}
          </span>
        </div>
        {/* Arrow */}
        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
        {/* New value */}
        <div className="inline-flex items-center gap-1.5 max-w-[45%]">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-100 dark:border-emerald-900/50 break-words">
            {newStr}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Row for flat changes (just key: value without old/new) */
export function FlatChangeRow({ fieldName, value }: { fieldName: string; value: any }) {
  const label = getFieldLabel(fieldName);
  const valueStr = formatValue(value, fieldName);

  return (
    <div className="flex items-start gap-3 py-2.5 px-4">
      <div className="w-[140px] flex-shrink-0 pt-0.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-zinc-800 dark:text-zinc-200 break-words">{valueStr}</span>
      </div>
    </div>
  );
}

// ─── Card components ─────────────────────────────────────────────────────────

/** Data card for CREATE operations — shows created entity data */
export function CreatedDataCard({ data }: { data: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/50 flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Utworzone dane</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Object.entries(data).map(([key, value]) => (
          <FlatChangeRow key={key} fieldName={key} value={value} />
        ))}
      </div>
    </div>
  );
}

/** Data card for DELETE operations — shows deleted entity data */
export function DeletedDataCard({ data }: { data: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800/50 flex items-center gap-2">
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
        <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Usunięte dane</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Object.entries(data).map(([key, value]) => (
          <FlatChangeRow key={key} fieldName={key} value={value} />
        ))}
      </div>
    </div>
  );
}

/** Toggle (oldValue/newValue at top level) visualization */
export function ToggleCard({ oldValue, newValue, fieldName }: { oldValue: any; newValue: any; fieldName?: string }) {
  return (
    <div className="rounded-xl border border-teal-200 dark:border-teal-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800/50 flex items-center gap-2">
        <ToggleLeft className="h-3.5 w-3.5 text-teal-500" />
        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Zmiana wartości</span>
      </div>
      <div className="p-4">
        <DiffChangeRow fieldName={fieldName || 'wartość'} oldVal={oldValue} newVal={newValue} />
      </div>
    </div>
  );
}

/** Status change card (oldStatus → newStatus) */
export function StatusChangeCard({ oldStatus, newStatus }: { oldStatus?: string; newStatus?: string }) {
  const oldLabel = oldStatus ? (enumTranslations[oldStatus] || oldStatus) : '—';
  const newLabel = newStatus ? (enumTranslations[newStatus] || newStatus) : '—';

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-200 dark:border-violet-800/50 flex items-center gap-2">
        <RefreshCw className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Zmiana statusu</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 justify-center">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm font-medium border border-red-100 dark:border-red-900/50">
            {oldLabel}
          </span>
          <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-100 dark:border-emerald-900/50">
            {newLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Diff changes card (from diffObjects: { field: {old, new} }) */
export function DiffChangesCard({ changes }: { changes: Record<string, { old: any; new: any }> }) {
  const entries = Object.entries(changes);
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
        <Repeat className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
          {'Zmienione pola (' + entries.length + ')'}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.map(([field, val]) => (
          <DiffChangeRow key={field} fieldName={field} oldVal={val.old} newVal={val.new} />
        ))}
      </div>
    </div>
  );
}

/** Flat changes card (for simple key:value changes without old/new) */
export function FlatChangesCard({ changes }: { changes: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Zmienione dane</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Object.entries(changes).map(([key, value]) => (
          <FlatChangeRow key={key} fieldName={key} value={value} />
        ))}
      </div>
    </div>
  );
}

/** Discount card */
export function DiscountCard({ details }: { details: Record<string, any> }) {
  const isApplied = !!details.discountType;
  const isRemoved = !!details.removedDiscount;

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800/50 flex items-center gap-2">
        <Percent className="h-3.5 w-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
          {isRemoved ? 'Usunięty rabat' : 'Naliczony rabat'}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {isApplied && (
          <>
            <FlatChangeRow fieldName="discountType" value={details.discountType} />
            <FlatChangeRow fieldName="discountValue" value={details.discountValue} />
            {details.discountAmount && <FlatChangeRow fieldName="discountAmount" value={details.discountAmount} />}
            {details.reason && <FlatChangeRow fieldName="reason" value={details.reason} />}
          </>
        )}
        {isRemoved && (
          <>
            <FlatChangeRow fieldName="discountType" value={details.removedDiscount?.type} />
            <FlatChangeRow fieldName="discountValue" value={details.removedDiscount?.value} />
            <FlatChangeRow fieldName="discountAmount" value={details.removedDiscount?.amount} />
            {details.restoredPrice && <FlatChangeRow fieldName="restoredPrice" value={details.restoredPrice} />}
          </>
        )}
      </div>
    </div>
  );
}

/** Payment card */
export function PaymentCard({ details }: { details: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-green-200 dark:border-green-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800/50 flex items-center gap-2">
        <CreditCard className="h-3.5 w-3.5 text-green-500" />
        <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Dane płatności</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {details.data?.amountPaid && <FlatChangeRow fieldName="amountPaid" value={details.data.amountPaid} />}
        {details.data?.paymentMethod && <FlatChangeRow fieldName="paymentMethod" value={details.data.paymentMethod} />}
        {details.data?.status && <FlatChangeRow fieldName="status" value={details.data.status} />}
      </div>
    </div>
  );
}

/** Reorder card */
export function ReorderCard({ orderedIds }: { orderedIds: string[] }) {
  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-800/50 flex items-center gap-2">
        <ListOrdered className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
          {'Nowa kolejność (' + orderedIds.length + ' elementów)'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {orderedIds.map((id, i) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-xs text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50"
            >
              <span className="font-semibold text-indigo-400 dark:text-indigo-500">{i + 1}.</span>
              <span className="font-mono">{id.slice(0, 8)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Source ID info row */
export function SourceIdRow({ sourceId }: { sourceId: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30">
      <Package className="h-3.5 w-3.5 text-indigo-500" />
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{'Źródło:'}</span>
      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300">{sourceId.slice(0, 12)}...</span>
    </div>
  );
}
