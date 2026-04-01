'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle, Edit, MoreVertical, Trash2,
  CalendarDays, Users, Truck, Receipt, Sparkles, Download, UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { moduleAccents } from '@/lib/design-tokens';
import {
  useCateringOrder,
  useDeleteCateringOrder,
  useUpdateCateringOrder,
  useDeleteCateringDeposit,
} from '@/hooks/use-catering-orders';
import { LoadingState, EmptyState, DetailHero, AnimatedSection } from '@/components/shared';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { ChangeStatusDialog } from '../components/ChangeStatusDialog';
import { DiscountDialog } from '../components/DiscountDialog';
import { AddDepositDialog } from '../components/AddDepositDialog';
import { MarkDepositPaidDialog } from '../components/MarkDepositPaidDialog';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import type { CateringDeposit } from '@/types/catering-order.types';
import { formatCurrency, formatDateLong } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { OrderItems } from './components/OrderItems';
import { OrderDelivery } from './components/OrderDelivery';
import { OrderFinancials } from './components/OrderFinancials';
import { OrderClientCard } from './components/OrderClientCard';
import { OrderNotes } from './components/OrderNotes';
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function CateringOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [payingDeposit, setPayingDeposit] = useState<Pick<
    CateringDeposit,
    'id' | 'amount' | 'title'
  > | null>(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { data: order, isLoading } = useCateringOrder(id);
  const deleteMutation = useDeleteCateringOrder();
  const removeDiscountMutation = useUpdateCateringOrder(id);
  const deleteDepositMutation = useDeleteCateringDeposit(id);

  const handleDownloadPDF = async () => {
    try {
      const response = await apiClient.get(`/catering/orders/${id}/pdf/order`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zamowienie-catering-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Nie udało się pobrać PDF');
    }
  };

  const handleDelete = async () => {
    if (!await confirm({ title: 'Usuwanie zamówienia', description: 'Czy na pewno usunąć to zamówienie?', variant: 'destructive', confirmLabel: 'Usuń' })) return;
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/catering/orders');
  };

  const handleRemoveDiscount = async () => {
    if (!await confirm({ title: 'Usuwanie rabatu', description: 'Czy na pewno usunąć rabat?', variant: 'destructive', confirmLabel: 'Usuń rabat' })) return;
    await removeDiscountMutation.mutateAsync({
      discountType: null,
      discountValue: null,
      discountReason: null,
    });
  };

  const handleDeleteDeposit = async (depositId: string, isPaid?: boolean) => {
    const msg = isPaid
      ? 'Ta zaliczka jest opłacona. Usunięcie jej obniży sumę wpłat. Czy na pewno chcesz kontynuować?'
      : 'Czy na pewno usunąć tę zaliczkę?';
    if (!await confirm({ title: 'Usuwanie zaliczki', description: msg, variant: 'destructive', confirmLabel: 'Usuń zaliczkę' })) return;
    await deleteDepositMutation.mutateAsync(depositId);
  };

  if (isLoading) {
    return <LoadingState message="Wczytywanie zamówienia…" className="py-32" />;
  }

  if (!order) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Nie znaleziono zamówienia"
        description="Zamówienie nie istnieje lub zostało usunięte."
        actionLabel="Powrót do listy"
        actionHref="/dashboard/catering/orders"
        className="py-32"
      />
    );
  }

  const canDelete = order.status === 'DRAFT' || order.status === 'CANCELLED';
  const hasDiscount = !!order.discountType;
  const pricePerGuest =
    order.guestsCount > 0 && Number(order.totalPrice) > 0
      ? Number(order.totalPrice) / order.guestsCount
      : null;

  return (
    <div className="min-h-0">
      <Breadcrumb />
      {/* ═══ HERO ═══ */}
      <DetailHero
        gradient={moduleAccents.catering.gradient}
        backHref="/dashboard/catering/orders"
        backLabel="Powrót"
        icon={UtensilsCrossed}
        orderNumber={order.orderNumber}
        title={order.eventName ?? 'Zamówienie cateringowe'}
        badges={<OrderStatusBadge status={order.status} />}
        statPills={[
          ...(order.eventDate ? [{ icon: CalendarDays, label: 'Data', value: formatDateLong(order.eventDate) }] : []),
          { icon: Users, label: 'Osób', value: String(order.guestsCount) },
          { icon: Receipt, label: 'Wartość', value: formatCurrency(order.totalPrice) },
          ...(pricePerGuest !== null ? [{ icon: Sparkles, label: '/ os.', value: formatCurrency(pricePerGuest) }] : []),
          { icon: Truck, value: DELIVERY_TYPE_LABEL[order.deliveryType] },
        ]}
        actions={
          <>
            <Button size="sm" variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Pobierz PDF
            </Button>
            <Button size="sm" variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
              onClick={() => setStatusDialogOpen(true)}
            >
              Zmień status
            </Button>
            <Button size="sm" variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
              onClick={() => router.push(`/dashboard/catering/orders/${id}/edit`)}
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edytuj
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 w-9 p-0"
                >
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
          </>
        }
      />

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatedSection index={0}>
              <OrderItems order={order} />
            </AnimatedSection>
            <AnimatedSection index={1}>
              <OrderDelivery order={order} />
            </AnimatedSection>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <AnimatedSection index={0}>
              <OrderClientCard
                order={order}
                onViewProfile={() => router.push(`/dashboard/clients/${order.client.id}`)}
              />
            </AnimatedSection>
            <AnimatedSection index={1}>
              <OrderFinancials
                order={order}
                orderId={id}
                pricePerGuest={pricePerGuest}
                hasDiscount={hasDiscount}
                isRemovingDiscount={removeDiscountMutation.isPending}
                isDeletingDeposit={deleteDepositMutation.isPending}
                onOpenDiscountDialog={() => setDiscountDialogOpen(true)}
                onRemoveDiscount={handleRemoveDiscount}
                onOpenDepositDialog={() => setDepositDialogOpen(true)}
                onDeleteDeposit={handleDeleteDeposit}
                onPayDeposit={setPayingDeposit}
              />
            </AnimatedSection>
            <AnimatedSection index={2}>
              <OrderNotes order={order} orderId={id} />
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* ═══ DIALOGI ═══ */}
      <ChangeStatusDialog
        orderId={id}
        currentStatus={order.status}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      />
      <DiscountDialog
        orderId={id}
        current={{
          discountType: order.discountType,
          discountValue: order.discountValue,
          discountReason: order.discountReason,
        }}
        open={discountDialogOpen}
        onClose={() => setDiscountDialogOpen(false)}
      />
      <AddDepositDialog
        orderId={id}
        open={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
      />
      {payingDeposit && (
        <MarkDepositPaidDialog
          orderId={id}
          depositId={payingDeposit.id}
          depositTitle={payingDeposit.title}
          depositAmount={payingDeposit.amount}
          open={true}
          onClose={() => setPayingDeposit(null)}
        />
      )}
      {ConfirmDialog}
    </div>
  );
}
