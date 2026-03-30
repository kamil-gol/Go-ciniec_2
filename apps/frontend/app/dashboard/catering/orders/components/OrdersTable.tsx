'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  CateringOrderListItem,
  CateringDeliveryType,
} from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  ShoppingBag,
  Building2,
  User,
  MapPin,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Pagination } from '@/components/shared/Pagination';
import { formatCurrency as formatPrice, formatDateShort as formatDate } from '@/lib/utils';
import { typography } from '@/lib/design-tokens';

interface Props {
  orders: CateringOrderListItem[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
}

const DELIVERY_ICON: Record<CateringDeliveryType, React.ReactNode> = {
  PICKUP:   <ShoppingCart className="w-3 h-3" />,
  DELIVERY: <Truck className="w-3 h-3" />,
  ON_SITE:  <MapPin className="w-3 h-3" />,
};

const DELIVERY_BADGE_COLOR: Record<CateringDeliveryType, string> = {
  PICKUP:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  DELIVERY: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  ON_SITE:  'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
};

function clientName(order: CateringOrderListItem) {
  if (order.client.clientType === 'COMPANY' && order.client.companyName)
    return order.client.companyName;
  return `${order.client.firstName} ${order.client.lastName}`;
}

export function OrdersTable({ orders, meta, onPageChange, onRowClick }: Props) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Brak zamówień"
        description="Spróbuj zmienić filtry lub utwórz nowe zamówienie"
        variant="dashed"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.map(order => {
          const status = order.status;
          return (
            <div
              key={order.id}
              onClick={() => onRowClick(order.id)}
              className="cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80 p-4 space-y-3 hover:shadow-md transition-shadow active:scale-[0.99]"
            >
              {/* Row 1: Order number + Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  {order.orderNumber}
                </span>
                <StatusBadge type="catering" status={status} />
              </div>

              {/* Row 2: Client */}
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  order.client.clientType === 'COMPANY'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {order.client.clientType === 'COMPANY'
                    ? <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    : <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {clientName(order)}
                </span>
              </div>

              {/* Row 3: Event + Date + Type */}
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-2 min-w-0">
                  {order.eventName && (
                    <span className="truncate">{order.eventName}</span>
                  )}
                  {order.eventDate && (
                    <span className="flex-shrink-0">{formatDate(order.eventDate)}</span>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${DELIVERY_BADGE_COLOR[order.deliveryType]}`}>
                  {DELIVERY_ICON[order.deliveryType]}
                  {DELIVERY_TYPE_LABEL[order.deliveryType]}
                </span>
              </div>

              {/* Row 4: Price */}
              <div className="flex items-center justify-end border-t border-neutral-100 dark:border-neutral-700/50 pt-2">
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className={typography.tableHeaderRow}>
              <TableHead className={`${typography.tableHeaderCell} w-auto min-w-[6rem]`}>Numer</TableHead>
              <TableHead className={typography.tableHeaderCell}>Klient</TableHead>
              <TableHead className={typography.tableHeaderCell}>Wydarzenie</TableHead>
              <TableHead className={typography.tableHeaderCell}>Data</TableHead>
              <TableHead className={typography.tableHeaderCell}>Typ</TableHead>
              <TableHead className={typography.tableHeaderCell}>Status</TableHead>
              <TableHead className={`${typography.tableHeaderCell} text-right`}>Kwota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-orange-50/60 dark:hover:bg-orange-900/10 transition-colors border-l-2 border-l-transparent hover:border-l-orange-400 dark:hover:border-l-orange-500"
                onClick={() => onRowClick(order.id)}
              >
                <TableCell className="font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-300 tracking-tight">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      order.client.clientType === 'COMPANY'
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {order.client.clientType === 'COMPANY'
                        ? <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        : <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">{clientName(order)}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-sm text-neutral-700 dark:text-neutral-300">
                  {order.eventName ?? <span className="text-neutral-500 dark:text-neutral-500">—</span>}
                </TableCell>
                <TableCell className="text-sm text-neutral-600 dark:text-neutral-300">
                  {order.eventDate ? formatDate(order.eventDate) : <span className="text-neutral-500 dark:text-neutral-500">—</span>}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${DELIVERY_BADGE_COLOR[order.deliveryType]}`}>
                    {DELIVERY_ICON[order.deliveryType]}
                    {DELIVERY_TYPE_LABEL[order.deliveryType]}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge type="catering" status={order.status} />
                </TableCell>
                <TableCell className="text-right font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatPrice(order.totalPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={meta?.page ?? 1}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onPageChange={onPageChange}
      />
    </div>
  );
}
