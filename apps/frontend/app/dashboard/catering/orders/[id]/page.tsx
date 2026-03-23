'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  useCateringOrder,
  useDeleteCateringOrder,
  useUpdateCateringOrder,
  useDeleteCateringDeposit,
} from '@/hooks/use-catering-orders';
import { Button } from '@/components/ui/button';
import { ChangeStatusDialog } from '../components/ChangeStatusDialog';
import { DiscountDialog } from '../components/DiscountDialog';
import { AddDepositDialog } from '../components/AddDepositDialog';
import { MarkDepositPaidDialog } from '../components/MarkDepositPaidDialog';
import type { CateringDeposit } from '@/types/catering-order.types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

import { OrderHeader } from './components/OrderHeader';
import { OrderItems } from './components/OrderItems';
import { OrderDelivery } from './components/OrderDelivery';
import { OrderFinancials } from './components/OrderFinancials';
import { OrderClientCard } from './components/OrderClientCard';
import { OrderNotes } from './components/OrderNotes';

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
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Wczytywanie zamówienia…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="h-12 w-12 text-neutral-300" />
        <p className="font-semibold text-neutral-600 dark:text-neutral-400">Zamówienie nie istnieje</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/catering/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do listy
        </Button>
      </div>
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
      {/* ═══ HERO ═══ */}
      <OrderHeader
        order={order}
        pricePerGuest={pricePerGuest}
        canDelete={canDelete}
        onBack={() => router.push('/dashboard/catering/orders')}
        onEdit={() => router.push(`/dashboard/catering/orders/${id}/edit`)}
        onChangeStatus={() => setStatusDialogOpen(true)}
        onDelete={handleDelete}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <OrderItems order={order} />
            <OrderDelivery order={order} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <OrderClientCard
              order={order}
              onViewProfile={() => router.push(`/dashboard/clients/${order.client.id}`)}
            />
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
            <OrderNotes order={order} orderId={id} />
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
