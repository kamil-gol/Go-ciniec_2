// apps/frontend/src/app/dashboard/catering/orders/components/OrdersTable.tsx
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
} from '@/types/catering-order.types';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  DELIVERY_TYPE_LABEL,
} from '@/types/catering-order.types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  orders: CateringOrderListItem[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
}

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(Number(value));
}

function clientName(order: CateringOrderListItem) {
  if (order.client.clientType === 'COMPANY' && order.client.companyName)
    return order.client.companyName;
  return `${order.client.firstName} ${order.client.lastName}`;
}

export function OrdersTable({ orders, meta, onPageChange, onRowClick }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground">Brak zamówień spełniających kryteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numer</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Wydarzenie</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(order.id)}
              >
                <TableCell className="font-mono text-sm font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>{clientName(order)}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {order.eventName ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {order.eventDate ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {DELIVERY_TYPE_LABEL[order.deliveryType]}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`text-xs ${ORDER_STATUS_COLOR[order.status as CateringOrderStatus]}`}
                    variant="outline"
                  >
                    {ORDER_STATUS_LABEL[order.status as CateringOrderStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(order.totalPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginacja */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Strona {meta.page} z {meta.totalPages} ({meta.total} wyników)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
