import { Truck, MapPin, Clock } from 'lucide-react';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { SectionCard, Field } from './SectionCard';
import { formatDatePl } from './types';
import type { CateringOrder } from './types';

interface OrderDeliveryProps {
  order: CateringOrder;
}

export function OrderDelivery({ order }: OrderDeliveryProps) {
  return (
    <SectionCard
      icon={Truck}
      iconBg="bg-rose-100 dark:bg-rose-900/30"
      iconColor="text-rose-600 dark:text-rose-400"
      title="Logistyka"
    >
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <Truck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            {DELIVERY_TYPE_LABEL[order.deliveryType]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {(order.deliveryType === 'DELIVERY' || order.deliveryType === 'ON_SITE') &&
            order.deliveryAddress && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                  {order.deliveryType === 'DELIVERY' ? 'Adres dostawy' : 'Adres klienta'}
                </p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>
            )}
          {order.deliveryTime && (
            <div>
              <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                {order.deliveryType === 'PICKUP' ? 'Godzina odbioru' : 'Godzina'}
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {order.deliveryTime}
                </p>
              </div>
            </div>
          )}
          {order.deliveryDate && (
            <Field label="Data dostawy" value={formatDatePl(order.deliveryDate)} />
          )}
        </div>
        {order.deliveryNotes && (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Uwagi</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{order.deliveryNotes}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
