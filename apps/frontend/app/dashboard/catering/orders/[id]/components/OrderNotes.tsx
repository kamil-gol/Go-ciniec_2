import { FileText, History } from 'lucide-react';
import { OrderTimeline } from '../../components/OrderTimeline';
import { SectionCard } from './SectionCard';
import type { CateringOrder } from './types';

interface OrderNotesProps {
  order: CateringOrder;
  orderId: string;
}

export function OrderNotes({ order, orderId }: OrderNotesProps) {
  return (
    <>
      {/* Uwagi */}
      {(order.notes || order.specialRequirements) && (
        <SectionCard
          icon={FileText}
          iconBg="bg-neutral-100 dark:bg-neutral-800"
          iconColor="text-neutral-500 dark:text-neutral-300"
          title="Uwagi"
        >
          <div className="space-y-4">
            {order.notes && (
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Uwagi</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{order.notes}</p>
              </div>
            )}
            {order.specialRequirements && (
              <div className={order.notes ? 'pt-3 border-t border-neutral-100 dark:border-neutral-800' : ''}>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Specjalne wymagania</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{order.specialRequirements}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Historia */}
      <SectionCard
        icon={History}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-500 dark:text-slate-400"
        title="Historia zmian"
      >
        <OrderTimeline orderId={orderId} />
      </SectionCard>
    </>
  );
}
