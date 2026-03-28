import { Utensils, Star, CalendarDays } from 'lucide-react';
import { SectionCard, CountBadge, Field } from './SectionCard';
import { formatPrice } from './types';
import type { CateringOrder } from './types';

interface OrderItemsProps {
  order: CateringOrder;
}

export function OrderItems({ order }: OrderItemsProps) {
  const items = order.items ?? [];
  const extras = order.extras ?? [];

  return (
    <>
      {/* Szczegoly cateringu */}
      <SectionCard
        icon={CalendarDays}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
        iconColor="text-orange-600 dark:text-orange-400"
        title="Szczegóły cateringu"
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Okazja" value={order.eventName} />
          <Field label="Liczba osób" value={order.guestsCount ? `${order.guestsCount} osób` : '—'} />
        </div>
      </SectionCard>

      {/* Dania */}
      {items.length > 0 && (
        <SectionCard
          icon={Utensils}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          title="Dania"
          badge={<CountBadge count={items.length} />}
          className="pb-0"
        >
          <div className="-mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-y border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Danie</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Ilość</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cena jedn.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Razem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${i % 2 === 1 ? 'bg-neutral-50/50 dark:bg-neutral-800/20' : 'bg-white dark:bg-transparent'}`}>
                    <td className="px-5 py-3">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.dishNameSnapshot ?? '—'}</span>
                      {item.note && <span className="block text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">{item.note}</span>}
                    </td>
                    <td className="text-center px-4 py-3 text-neutral-600 dark:text-neutral-300 font-mono">×{item.quantity}</td>
                    <td className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-300">{formatPrice(item.unitPrice)}</td>
                    <td className="text-right px-5 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{formatPrice(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 dark:bg-green-900/10 border-t-2 border-green-200 dark:border-green-800">
                  <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-green-700 dark:text-green-300">Razem za dania</td>
                  <td className="text-right px-5 py-3 font-bold text-green-700 dark:text-green-300">{formatPrice(order.subtotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Uslugi dodatkowe */}
      {extras.length > 0 && (
        <SectionCard
          icon={Star}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          title="Usługi dodatkowe"
          badge={<CountBadge count={extras.length} />}
          className="pb-0"
        >
          <div className="-mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-y border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Usługa</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Ilość</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cena jedn.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Razem</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((extra, i) => (
                  <tr key={extra.id} className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${i % 2 === 1 ? 'bg-neutral-50/50 dark:bg-neutral-800/20' : 'bg-white dark:bg-transparent'}`}>
                    <td className="px-5 py-3">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{extra.name}</span>
                      {extra.description && <span className="block text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">{extra.description}</span>}
                    </td>
                    <td className="text-center px-4 py-3 text-neutral-600 dark:text-neutral-300 font-mono">×{extra.quantity}</td>
                    <td className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-300">{formatPrice(extra.unitPrice)}</td>
                    <td className="text-right px-5 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{formatPrice(extra.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 dark:bg-amber-900/10 border-t-2 border-amber-200 dark:border-amber-800">
                  <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">Razem za usługi</td>
                  <td className="text-right px-5 py-3 font-bold text-amber-700 dark:text-amber-300">{formatPrice(order.extrasTotalPrice)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
}
