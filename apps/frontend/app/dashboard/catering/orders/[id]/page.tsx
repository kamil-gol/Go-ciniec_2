'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Loader2,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { useCateringOrder, useDeleteCateringOrder } from '@/hooks/use-catering-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderTimeline } from '../components/OrderTimeline';
import { ChangeStatusDialog } from '../components/ChangeStatusDialog';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value));
}

export default function CateringOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const { data: order, isLoading } = useCateringOrder(id);
  const deleteMutation = useDeleteCateringOrder();

  const handleDelete = async () => {
    if (!confirm('Czy na pewno usunąć to zamówienie?')) return;
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/catering/orders');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Zamówienie nie istnieje</p>
      </div>
    );
  }

  const clientName =
    order.client.clientType === 'COMPANY' && order.client.companyName
      ? order.client.companyName
      : `${order.client.firstName} ${order.client.lastName}`;

  const canDelete = order.status === 'DRAFT' || order.status === 'CANCELLED';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/catering/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStatusDialogOpen(true)}>
            Zmień status
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/catering/orders/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edytuj
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canDelete}
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Usuń zamówienie
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Wydarzenie</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nazwa</p>
                <p className="font-medium">{order.eventName ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data i godzina</p>
                <p className="font-medium">
                  {order.eventDate ?? '—'} {order.eventTime ? `· ${order.eventTime}` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Miejsce</p>
                <p className="font-medium">{order.eventLocation ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Goście</p>
                <p className="font-medium">{order.guestsCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dostawa</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Typ</p>
                <p className="font-medium">{DELIVERY_TYPE_LABEL[order.deliveryType]}</p>
              </div>
              {order.deliveryType === 'DELIVERY' && (
                <>
                  <div>
                    <p className="text-muted-foreground">Adres dostawy</p>
                    <p className="font-medium">{order.deliveryAddress ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data dostawy</p>
                    <p className="font-medium">{order.deliveryDate ?? '—'} {order.deliveryTime ? `· ${order.deliveryTime}` : ''}</p>
                  </div>
                </>
              )}
              {order.deliveryNotes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Uwagi do dostawy</p>
                  <p className="font-medium">{order.deliveryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {order.items.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Dania</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-medium text-muted-foreground">Danie</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Ilość</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Cena</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Razem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2">
                          {item.dishNameSnapshot}
                          {item.note && <span className="block text-xs text-muted-foreground">{item.note}</span>}
                        </td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatPrice(item.unitPrice)}</td>
                        <td className="text-right py-2 font-medium">{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {order.extras.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Usługi dodatkowe</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-medium text-muted-foreground">Usługa</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Ilość</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Cena</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Razem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.extras.map(extra => (
                      <tr key={extra.id} className="border-b last:border-0">
                        <td className="py-2">
                          {extra.name}
                          {extra.description && <span className="block text-xs text-muted-foreground">{extra.description}</span>}
                        </td>
                        <td className="text-right py-2">{extra.quantity}</td>
                        <td className="text-right py-2">{formatPrice(extra.unitPrice)}</td>
                        <td className="text-right py-2 font-medium">{formatPrice(extra.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Klient</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{clientName}</p>
              {order.client.email && <p className="text-muted-foreground">{order.client.email}</p>}
              {order.client.phone && <p className="text-muted-foreground">{order.client.phone}</p>}
              {(order.contactName || order.contactPhone || order.contactEmail) && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Kontakt do zamówienia</p>
                  {order.contactName && <p>{order.contactName}</p>}
                  {order.contactPhone && <p className="text-muted-foreground">{order.contactPhone}</p>}
                  {order.contactEmail && <p className="text-muted-foreground">{order.contactEmail}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Podsumowanie finansowe</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dania</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.extrasTotalPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usługi dodatkowe</span>
                  <span>{formatPrice(order.extrasTotalPrice)}</span>
                </div>
              )}
              {order.discountAmount && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Rabat{order.discountType === 'PERCENTAGE' && order.discountValue ? ` (${order.discountValue}%)` : ''}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Razem</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
              {order.deposits.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Depozyty</p>
                  {order.deposits.map(d => (
                    <div key={d.id} className="flex justify-between text-xs">
                      <span className={d.paid ? 'text-green-600' : 'text-muted-foreground'}>
                        {d.title ?? 'Depozyt'} · {d.dueDate}
                      </span>
                      <span className={d.paid ? 'text-green-600 font-medium' : ''}>
                        {d.paid ? '✓ ' : ''}{formatPrice(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {(order.notes || order.specialRequirements) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Uwagi</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Uwagi</p>
                    <p>{order.notes}</p>
                  </div>
                )}
                {order.specialRequirements && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Specjalne wymagania</p>
                    <p>{order.specialRequirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <OrderTimeline orderId={id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ChangeStatusDialog
        orderId={id}
        currentStatus={order.status}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      />
    </div>
  );
}
