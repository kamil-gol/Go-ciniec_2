'use client';

import { Badge } from '@/components/ui/badge';
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
  CateringOrderStatus,
  CateringDeliveryType,
} from '@/types/catering-order.types';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  DELIVERY_TYPE_LABEL,
} from '@/types/catering-order.types';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Building2,
  User,
  MapPin,
  ShoppingCart,
  Truck,
} from 'lucide-react';

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

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function clientName(order: CateringOrderListItem) {
  if (order.client.clientType === 'COMPANY' && order.client.companyName)
    return order.client.companyName;
  return `${order.client.firstName} ${order.client.lastName}`;
}

export function OrdersTable({ orders, meta, onPageChange, onRowClick }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 py-20 bg-neutral-50 dark:bg-neutral-900/30">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
          <ShoppingBag className="h-7 w-7 text-orange-500 dark:text-orange-400" />
        </div>
        <p className="font-semibold text-neutral-700 dark:text-neutral-300">Brak zamówień</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Spróbuj zmienić filtry lub utwórz nowe zamówienie</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300 w-auto min-w-[6rem]">Numer</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Klient</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Wydarzenie</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Data</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Typ</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Status</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300 text-right">Kwota</TableHead>
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
                  {order.eventName ?? <span className="text-neutral-400 dark:text-neutral-600">—</span>}
                </TableCell>
                <TableCell className="text-sm text-neutral-600 dark:text-neutral-300">
                  {order.eventDate ? formatDate(order.eventDate) : <span className="text-neutral-400 dark:text-neutral-600">—</span>}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${DELIVERY_BADGE_COLOR[order.deliveryType]}`}>
                    {DELIVERY_ICON[order.deliveryType]}
                    {DELIVERY_TYPE_LABEL[order.deliveryType]}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`text-xs font-medium ${ORDER_STATUS_COLOR[order.status as CateringOrderStatus]}`}
                    variant="outline"
                  >
                    {ORDER_STATUS_LABEL[order.status as CateringOrderStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatPrice(order.totalPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-300">
          <span>
            Strona <strong className="text-neutral-800 dark:text-neutral-200">{meta.page}</strong> z {meta.totalPages}
            <span className="ml-2 text-xs">({meta.total} wyników)</span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
