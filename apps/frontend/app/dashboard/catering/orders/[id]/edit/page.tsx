'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { moduleAccents } from '@/lib/design-tokens';
import { toast } from 'sonner';
import { useCateringOrder, useUpdateCateringOrder } from '@/hooks/use-catering-orders';
import { useCateringTemplates } from '@/hooks/use-catering';
import { useDishes } from '@/hooks/use-dishes';
import { Button } from '@/components/ui/button';
import type { CateringDiscountType } from '@/types/catering-order.types';
import type { FormState } from './components/types';
import { computeTotals, fmt } from './components/types';
import { EditTemplateSection } from './components/EditTemplateSection';
import { EditEventSection } from './components/EditEventSection';
import { EditDeliverySection } from './components/EditDeliverySection';
import { EditItemsSection } from './components/EditItemsSection';
import { EditExtrasSection } from './components/EditExtrasSection';
import { EditDiscountSection } from './components/EditDiscountSection';
import { EditContactSection } from './components/EditContactSection';
import { EditNotesSection } from './components/EditNotesSection';
import { EditPriceSidebar } from './components/EditPriceSidebar';

// ─── Strona ───────────────────────────────────────────────────

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useCateringOrder(id);
  const { data: templates } = useCateringTemplates(false);
  const { data: dishes } = useDishes({ isActive: true });
  const updateMutation = useUpdateCateringOrder(id);

  const [form, setForm] = useState<FormState | null>(null);
  const [keyCounter, setKeyCounter] = useState(1000);

  // Dish options for Combobox
  const dishesArray = useMemo(() => (Array.isArray(dishes) ? dishes : []), [dishes]);
  const dishOptions = useMemo(
    () =>
      dishesArray.map((d: any) => ({
        value: d.id,
        label: d.name,
        description: d.description || undefined,
        secondaryLabel: d.price != null ? fmt(d.price) : undefined,
      })),
    [dishesArray],
  );

  // Pre-fill formularza po załadowaniu zamówienia (tylko raz)
  useEffect(() => {
    if (!order || form) return;
    setForm({
      eventName: order.eventName ?? '',
      eventDate: order.eventDate ?? '',
      eventTime: order.eventTime ?? '',
      eventLocation: order.eventLocation ?? '',
      guestsCount: String(order.guestsCount ?? 0),
      templateId: order.templateId ?? '',
      packageId: order.packageId ?? '',
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress ?? '',
      deliveryDate: order.deliveryDate ?? '',
      deliveryTime: order.deliveryTime ?? '',
      deliveryNotes: order.deliveryNotes ?? '',
      discountType: (order.discountType as CateringDiscountType) ?? '',
      discountValue: order.discountValue != null ? String(order.discountValue) : '',
      discountReason: order.discountReason ?? '',
      contactName: order.contactName ?? '',
      contactPhone: order.contactPhone ?? '',
      contactEmail: order.contactEmail ?? '',
      notes: order.notes ?? '',
      internalNotes: order.internalNotes ?? '',
      specialRequirements: order.specialRequirements ?? '',
      quoteExpiresAt: order.quoteExpiresAt
        ? new Date(order.quoteExpiresAt).toISOString().slice(0, 10)
        : '',
      items: order.items.map((item, i) => ({
        dishId: item.dishId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        note: item.note ?? '',
        _key: i,
      })),
      extras: order.extras.map((extra, i) => ({
        name: extra.name,
        description: extra.description ?? '',
        quantity: extra.quantity,
        unitPrice: Number(extra.unitPrice),
        _key: 100 + i,
      })),
    });
    setKeyCounter(1000 + order.items.length + order.extras.length);
  }, [order, form]);

  const set = (partial: Partial<FormState>) =>
    setForm(prev => (prev ? { ...prev, ...partial } : prev));

  // ─── Live kalkulator ──────────────────────────────────────
  const totals = useMemo(() => {
    if (!form) return null;
    return computeTotals(
      form.items,
      form.extras,
      form.discountType || null,
      parseFloat(form.discountValue) || null,
    );
  }, [form]);

  const addItem = () => {
    const k = keyCounter;
    setKeyCounter(k + 1);
    set({ items: [...(form?.items ?? []), { dishId: '', quantity: 1, unitPrice: 0, _key: k }] });
  };

  const addExtra = () => {
    const k = keyCounter;
    setKeyCounter(k + 1);
    set({ extras: [...(form?.extras ?? []), { name: '', quantity: 1, unitPrice: 0, _key: k }] });
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      await updateMutation.mutateAsync({
        templateId: form.templateId || null,
        packageId: form.packageId || null,
        deliveryType: form.deliveryType,
        eventName: form.eventName || null,
        eventDate: form.eventDate || null,
        eventTime: form.eventTime || null,
        eventLocation: form.eventLocation || null,
        guestsCount: parseInt(form.guestsCount, 10) || 0,
        deliveryAddress: form.deliveryAddress || null,
        deliveryDate: form.deliveryDate || null,
        deliveryTime: form.deliveryTime || null,
        deliveryNotes: form.deliveryNotes || null,
        discountType: (form.discountType as CateringDiscountType) || null,
        discountValue: parseFloat(form.discountValue) || null,
        discountReason: form.discountReason || null,
        contactName: form.contactName || null,
        contactPhone: form.contactPhone || null,
        contactEmail: form.contactEmail || null,
        notes: form.notes || null,
        internalNotes: form.internalNotes || null,
        specialRequirements: form.specialRequirements || null,
        quoteExpiresAt: form.quoteExpiresAt || null,
        items: form.items.map(i => ({
          dishId: i.dishId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          note: (i.note as string) || null,
        })),
        extras: form.extras.map(e => ({
          name: e.name,
          description: (e.description as string | undefined) || null,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
        })),
      });
      toast.success('Zamówienie zaktualizowane');
      router.push(`/dashboard/catering/orders/${id}`);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        toast.error('Brak uprawnień do edycji zamówień cateringowych');
      } else if (status === 401) {
        toast.error('Sesja wygasła — zaloguj się ponownie');
      } else {
        toast.error('Nie udało się zapisać zmian. Spróbuj ponownie.');
      }
    }
  };

  const clientName = order
    ? order.client.clientType === 'COMPANY' && order.client.companyName
      ? order.client.companyName
      : `${order.client.firstName} ${order.client.lastName}`
    : '';

  if (isLoading || !form) {
    return <LoadingState message="Ładowanie zamówienia..." className="py-24" />;
  }

  return (
    <div className="space-y-6 p-6">

      {/* ═══ GRADIENT HERO HEADER ═══ */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${moduleAccents.catering.gradient} px-6 py-6 text-white shadow-lg`}>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/catering/orders/${id}`)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Edytuj zamówienie</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-sm text-white/80">{order?.orderNumber}</span>
                <span className="text-white/40">|</span>
                <span className="text-sm text-white/80">{clientName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/catering/orders/${id}`)}
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-white text-orange-700 hover:bg-white/90 font-semibold h-9 px-5 shadow-sm"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Zapisz zmiany
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ LEWA/ŚRODKOWA KOLUMNA — FORMULARZ ═══ */}
        <div className="lg:col-span-2 space-y-6">
          <EditTemplateSection form={form} set={set} templates={templates} />
          <EditEventSection form={form} set={set} />
          <EditDeliverySection form={form} set={set} />
          <EditItemsSection
            form={form}
            set={set}
            onAddItem={addItem}
            dishOptions={dishOptions}
            dishesArray={dishesArray}
            subtotal={totals?.subtotal ?? 0}
          />
          <EditExtrasSection
            form={form}
            set={set}
            onAddExtra={addExtra}
            extrasTotalPrice={totals?.extrasTotalPrice ?? 0}
          />
          <EditDiscountSection form={form} set={set} totals={totals} />
          <EditContactSection form={form} set={set} />
          <EditNotesSection form={form} set={set} />
        </div>

        {/* ═══ PRAWA KOLUMNA — STICKY SIDEBAR ═══ */}
        <div>
          <EditPriceSidebar
            form={form}
            totals={totals}
            clientName={clientName}
            orderNumber={order?.orderNumber}
            orderTotalPrice={Number(order?.totalPrice ?? 0)}
            isPending={updateMutation.isPending}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
