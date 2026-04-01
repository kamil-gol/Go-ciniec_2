'use client';

import type {
  CateringOrderListItem,
  CateringDeliveryType,
} from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { UnifiedDataTable } from '@/components/shared/UnifiedDataTable';
import type { DataTableColumn } from '@/components/shared/UnifiedDataTable';
import {
  ShoppingBag,
  Building2,
  User,
  MapPin,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { formatCurrency as formatPrice, formatDateShort as formatDate } from '@/lib/utils';

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

function ClientIcon({ order }: { order: CateringOrderListItem }) {
  const isCompany = order.client.clientType === 'COMPANY';
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
      isCompany
        ? 'bg-purple-100 dark:bg-purple-900/30'
        : 'bg-blue-100 dark:bg-blue-900/30'
    }`}>
      {isCompany
        ? <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        : <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
    </div>
  );
}

const columns: DataTableColumn<CateringOrderListItem>[] = [
  {
    key: 'orderNumber',
    header: 'Numer',
    headerClassName: 'w-auto min-w-[6rem]',
    cellClassName: 'font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-300 tracking-tight',
    render: (order) => order.orderNumber,
  },
  {
    key: 'client',
    header: 'Klient',
    render: (order) => (
      <div className="flex items-center gap-2">
        <ClientIcon order={order} />
        <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">{clientName(order)}</span>
      </div>
    ),
  },
  {
    key: 'event',
    header: 'Wydarzenie',
    cellClassName: 'max-w-[180px] truncate text-sm text-neutral-700 dark:text-neutral-300',
    render: (order) =>
      order.eventName ?? <span className="text-neutral-500 dark:text-neutral-500">&mdash;</span>,
  },
  {
    key: 'date',
    header: 'Data',
    cellClassName: 'text-sm text-neutral-600 dark:text-neutral-300',
    render: (order) =>
      order.eventDate
        ? formatDate(order.eventDate)
        : <span className="text-neutral-500 dark:text-neutral-500">&mdash;</span>,
  },
  {
    key: 'deliveryType',
    header: 'Typ',
    render: (order) => (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${DELIVERY_BADGE_COLOR[order.deliveryType]}`}>
        {DELIVERY_ICON[order.deliveryType]}
        {DELIVERY_TYPE_LABEL[order.deliveryType]}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (order) => <StatusBadge type="catering" status={order.status} />,
  },
  {
    key: 'totalPrice',
    header: 'Kwota',
    headerClassName: 'text-right',
    cellClassName: 'text-right font-semibold text-neutral-900 dark:text-neutral-100',
    render: (order) => formatPrice(order.totalPrice),
  },
];

function MobileOrderCard({ order, onRowClick }: { order: CateringOrderListItem; onRowClick: (id: string) => void }) {
  return (
    <div
      onClick={() => onRowClick(order.id)}
      className="cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80 p-4 space-y-3 hover:shadow-md transition-shadow active:scale-[0.99]"
    >
      {/* Row 1: Order number + Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {order.orderNumber}
        </span>
        <StatusBadge type="catering" status={order.status} />
      </div>

      {/* Row 2: Client */}
      <div className="flex items-center gap-2">
        <ClientIcon order={order} />
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
    <UnifiedDataTable
      data={orders}
      columns={columns}
      keyExtractor={(order) => order.id}
      onRowClick={(order) => onRowClick(order.id)}
      mobileCardRenderer={(order) => (
        <MobileOrderCard order={order} onRowClick={onRowClick} />
      )}
      hoverAccent="amber"
      pagination={{
        page: meta?.page ?? 1,
        totalPages: meta?.totalPages ?? 1,
        total: meta?.total,
        onPageChange,
      }}
    />
  );
}
