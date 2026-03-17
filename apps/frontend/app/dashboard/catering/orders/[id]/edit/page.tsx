'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  BookOpen,
  CalendarDays,
  Truck,
  Utensils,
  Star,
  Percent,
  User,
  FileText,
  Calculator,
  Clock,
  MapPin,
  Users,
  CalendarCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCateringOrder, useUpdateCateringOrder } from '@/hooks/use-catering-orders';
import { useCateringTemplates } from '@/hooks/use-catering';
import { useDishes } from '@/hooks/use-dishes';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackageCards } from '../../components/PackageCards';
import type {
  CateringDeliveryType,
  CateringDiscountType,
  CreateOrderItemInput,
  CreateOrderExtraInput,
} from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';

// ─── Live kalkulator (ta sama logika co backend) ──────────────

function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  extras: { quantity: number; unitPrice: number }[],
  discountType?: CateringDiscountType | null,
  discountValue?: number | null,
) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const extrasTotalPrice = extras.reduce((s, e) => s + e.quantity * e.unitPrice, 0);
  const gross = subtotal + extrasTotalPrice;
  let discountAmount = 0;
  if (discountType && discountValue && discountValue > 0) {
    discountAmount =
      discountType === 'PERCENTAGE'
        ? Math.round(gross * (discountValue / 100) * 100) / 100
        : Math.min(discountValue, gross);
  }
  return {
    subtotal,
    extrasTotalPrice,
    discountAmount,
    totalPrice: Math.max(0, gross - discountAmount),
  };
}

function fmt(v: number) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(v);
}

// ─── Typ stanu formularza ─────────────────────────────────────

interface FormState {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestsCount: string;
  templateId: string;
  packageId: string;
  deliveryType: CateringDeliveryType;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes: string;
  discountType: CateringDiscountType | '';
  discountValue: string;
  discountReason: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  internalNotes: string;
  specialRequirements: string;
  quoteExpiresAt: string;
  items: (CreateOrderItemInput & { _key: number })[];
  extras: (CreateOrderExtraInput & { _key: number })[];
}

// ─── Reusable Section wrapper ─────────────────────────────────

function SectionBlock({
  icon: Icon,
  title,
  subtitle,
  colorFrom,
  colorTo,
  borderColor,
  children,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border ${borderColor} overflow-hidden shadow-sm bg-white dark:bg-neutral-900`}>
      <div className={`flex items-center gap-3 px-5 py-4 bg-gradient-to-r ${colorFrom} ${colorTo} border-b ${borderColor}`}>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorFrom.replace('from-', 'from-').replace('-50', '-500')} ${colorTo.replace('to-', 'to-').replace('-50', '-500')} flex items-center justify-center shadow-sm shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

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
  }, [form?.items, form?.extras, form?.discountType, form?.discountValue]);

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

  const selectedTemplate = templates?.find(t => t.id === form?.templateId);
  const templatePackages = selectedTemplate?.packages as
    | { id: string; name: string; basePrice: number }[]
    | undefined;

  const clientName = order
    ? order.client.clientType === 'COMPANY' && order.client.companyName
      ? order.client.companyName
      : `${order.client.firstName} ${order.client.lastName}`
    : '';

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ═══ GRADIENT HERO HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 py-6 text-white shadow-lg">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
        {/* ═══ LEWA/ŚRODKOWA KOLUMNA — FORMULARZ ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Szablon / Pakiet ── */}
          <SectionBlock
            icon={BookOpen}
            title="Szablon i pakiet"
            subtitle="Opcjonalnie wybierz gotowy szablon cateringu"
            colorFrom="from-blue-50"
            colorTo="to-cyan-50"
            borderColor="border-blue-200 dark:border-blue-800"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Szablon</Label>
                <Select
                  value={form.templateId || 'NONE'}
                  onValueChange={v =>
                    set({ templateId: v === 'NONE' ? '' : v, packageId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Bez szablonu —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Bez szablonu —</SelectItem>
                    {templates?.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templatePackages && templatePackages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Pakiet</Label>
                  <PackageCards
                    packages={templatePackages}
                    selectedId={form.packageId}
                    onSelect={pkgId => set({ packageId: pkgId })}
                  />
                </div>
              )}
            </div>
          </SectionBlock>

          {/* ── Wydarzenie ── */}
          <SectionBlock
            icon={CalendarDays}
            title="Wydarzenie"
            subtitle="Szczegóły dotyczące okazji i terminu realizacji"
            colorFrom="from-orange-50"
            colorTo="to-amber-50"
            borderColor="border-orange-200 dark:border-orange-800"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Nazwa wydarzenia</Label>
                <Input
                  value={form.eventName}
                  onChange={e => set({ eventName: e.target.value })}
                  placeholder="np. Wesele Kowalskich"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" /> Data
                </Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={e => set({ eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Godzina
                </Label>
                <Input
                  type="time"
                  value={form.eventTime}
                  onChange={e => set({ eventTime: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Miejsce
                </Label>
                <Input
                  value={form.eventLocation}
                  onChange={e => set({ eventLocation: e.target.value })}
                  placeholder="np. Sala bankietowa Belvedere"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Liczba gości
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.guestsCount}
                  onChange={e => set({ guestsCount: e.target.value })}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarCheck className="w-3 h-3" /> Oferta ważna do
                </Label>
                <Input
                  type="date"
                  value={form.quoteExpiresAt}
                  onChange={e => set({ quoteExpiresAt: e.target.value })}
                />
              </div>
            </div>
          </SectionBlock>

          {/* ── Dostawa ── */}
          <SectionBlock
            icon={Truck}
            title="Logistyka dostawy"
            subtitle="Sposób i adres dostarczenia zamówienia"
            colorFrom="from-rose-50"
            colorTo="to-pink-50"
            borderColor="border-rose-200 dark:border-rose-800"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Typ dostawy</Label>
                <Select
                  value={form.deliveryType}
                  onValueChange={v => set({ deliveryType: v as CateringDeliveryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(DELIVERY_TYPE_LABEL) as [
                        CateringDeliveryType,
                        string,
                      ][]
                    ).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.deliveryType !== 'PICKUP' && (
                <>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Adres dostawy
                    </Label>
                    <Textarea
                      value={form.deliveryAddress}
                      onChange={e => set({ deliveryAddress: e.target.value })}
                      rows={2}
                      placeholder="ul. Kwiatowa 15, 30-001 Kraków"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" /> Data dostawy
                    </Label>
                    <Input
                      type="date"
                      value={form.deliveryDate}
                      onChange={e => set({ deliveryDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Godzina dostawy
                    </Label>
                    <Input
                      type="time"
                      value={form.deliveryTime}
                      onChange={e => set({ deliveryTime: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uwagi do logistyki</Label>
                <Textarea
                  value={form.deliveryNotes}
                  onChange={e => set({ deliveryNotes: e.target.value })}
                  rows={2}
                  placeholder="Dodatkowe informacje dot. dostawy..."
                />
              </div>
            </div>
          </SectionBlock>

          {/* ═══ DANIA — PREMIUM ═══ */}
          <div className="rounded-2xl border border-green-200 dark:border-green-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Dania</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {form.items.length > 0
                    ? `${form.items.length} ${form.items.length === 1 ? 'pozycja' : 'pozycje'} · ${fmt(totals?.subtotal ?? 0)}`
                    : 'Dodaj pozycje menu do zamówienia'}
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Dodaj danie
              </button>
            </div>

            {/* Items list */}
            <div className="p-4 space-y-3">
              {form.items.length === 0 && (
                <div className="text-center py-8">
                  <Utensils className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Brak dań — kliknij &quot;Dodaj danie&quot; aby rozpocząć</p>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {form.items.map((item, i) => (
                  <motion.div
                    key={item._key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all"
                  >
                    {/* Position badge */}
                    <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-10">
                      {i + 1}
                    </div>

                    {/* Row 1: Combobox + delete */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <Combobox
                          options={dishOptions}
                          value={item.dishId}
                          onChange={dishId => {
                            const dish = dishesArray.find((d: any) => d.id === dishId) as any;
                            const items = [...form.items];
                            items[i] = { ...items[i], dishId, unitPrice: dish?.price ?? items[i].unitPrice };
                            set({ items });
                          }}
                          placeholder="Wybierz danie..."
                          searchPlaceholder="Szukaj po nazwie..."
                          emptyMessage="Nie znaleziono dania"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => set({ items: form.items.filter((_, j) => j !== i) })}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Row 2: Quantity + Price + Total */}
                    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3 py-2.5 border border-neutral-100 dark:border-neutral-700/50">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Ilość</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => {
                            const items = [...form.items];
                            items[i] = { ...items[i], quantity: parseInt(e.target.value, 10) || 1 };
                            set({ items });
                          }}
                          onFocus={e => e.target.select()}
                          className="w-16 h-8 text-center text-sm"
                        />
                      </div>
                      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                      <div className="flex items-center gap-2 flex-1">
                        <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Cena jedn.</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => {
                            const items = [...form.items];
                            items[i] = { ...items[i], unitPrice: parseFloat(e.target.value) || 0 };
                            set({ items });
                          }}
                          onFocus={e => e.target.select()}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                      {item.quantity > 0 && item.unitPrice > 0 && (
                        <>
                          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Razem</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-300">
                              {fmt(item.quantity * item.unitPrice)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ═══ USŁUGI DODATKOWE — PREMIUM AMBER ═══ */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b border-amber-200 dark:border-amber-800">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm shrink-0">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Usługi dodatkowe</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {form.extras.length > 0
                    ? `${form.extras.length} ${form.extras.length === 1 ? 'usługa' : 'usługi'} · ${fmt(totals?.extrasTotalPrice ?? 0)}`
                    : 'Dodaj usługi dodatkowe do zamówienia'}
                </p>
              </div>
              <button
                type="button"
                onClick={addExtra}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Dodaj usługę
              </button>
            </div>

            {/* Extras list */}
            <div className="p-4 space-y-3">
              {form.extras.length === 0 && (
                <div className="text-center py-8">
                  <Star className="h-8 w-8 text-amber-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Brak usług dodatkowych — kliknij &quot;Dodaj usługę&quot;</p>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {form.extras.map((extra, i) => (
                  <motion.div
                    key={extra._key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all"
                  >
                    {/* Position badge */}
                    <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-10">
                      {i + 1}
                    </div>

                    {/* Row 1: Name + delete */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="Nazwa usługi (np. Kelner, Dekoracje)"
                          value={extra.name}
                          onChange={e => {
                            const extras = [...form.extras];
                            extras[i] = { ...extras[i], name: e.target.value };
                            set({ extras });
                          }}
                          className="h-10"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => set({ extras: form.extras.filter((_, j) => j !== i) })}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Row 2: Quantity + Price + Total */}
                    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3 py-2.5 border border-neutral-100 dark:border-neutral-700/50">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Ilość</Label>
                        <Input
                          type="number"
                          min={1}
                          value={extra.quantity}
                          onChange={e => {
                            const extras = [...form.extras];
                            extras[i] = { ...extras[i], quantity: parseInt(e.target.value, 10) || 1 };
                            set({ extras });
                          }}
                          onFocus={e => e.target.select()}
                          className="w-16 h-8 text-center text-sm"
                        />
                      </div>
                      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                      <div className="flex items-center gap-2 flex-1">
                        <Label className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Cena jedn.</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={extra.unitPrice}
                          onChange={e => {
                            const extras = [...form.extras];
                            extras[i] = { ...extras[i], unitPrice: parseFloat(e.target.value) || 0 };
                            set({ extras });
                          }}
                          onFocus={e => e.target.select()}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                      {extra.quantity > 0 && extra.unitPrice > 0 && (
                        <>
                          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Razem</p>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                              {fmt(extra.quantity * extra.unitPrice)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Rabat ── */}
          <SectionBlock
            icon={Percent}
            title="Rabat"
            subtitle={totals && totals.discountAmount > 0 ? `Aktywny rabat: −${fmt(totals.discountAmount)}` : 'Opcjonalny rabat na zamówienie'}
            colorFrom="from-violet-50"
            colorTo="to-purple-50"
            borderColor="border-violet-200 dark:border-violet-800"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Typ rabatu</Label>
                <Select
                  value={form.discountType || 'NONE'}
                  onValueChange={v =>
                    set({
                      discountType:
                        v === 'NONE' ? '' : (v as CateringDiscountType),
                      discountValue: '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Brak —</SelectItem>
                    <SelectItem value="PERCENTAGE">Procent (%)</SelectItem>
                    <SelectItem value="AMOUNT">Kwota (zł)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.discountType && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {form.discountType === 'PERCENTAGE'
                      ? 'Wartość (%)'
                      : 'Kwota (zł)'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={form.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    value={form.discountValue}
                    onChange={e => set({ discountValue: e.target.value })}
                    onFocus={e => e.target.select()}
                  />
                </div>
              )}
              <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Powód rabatu</Label>
                <Input
                  value={form.discountReason}
                  onChange={e => set({ discountReason: e.target.value })}
                  placeholder="np. Stały klient, promocja świąteczna"
                />
              </div>
            </div>
          </SectionBlock>

          {/* ── Kontakt ── */}
          <SectionBlock
            icon={User}
            title="Kontakt do zamówienia"
            subtitle="Dane kontaktowe osoby odpowiedzialnej"
            colorFrom="from-indigo-50"
            colorTo="to-blue-50"
            borderColor="border-indigo-200 dark:border-indigo-800"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Imię i nazwisko</Label>
                <Input
                  value={form.contactName}
                  onChange={e => set({ contactName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Telefon</Label>
                <Input
                  value={form.contactPhone}
                  onChange={e => set({ contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">E-mail</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => set({ contactEmail: e.target.value })}
                />
              </div>
            </div>
          </SectionBlock>

          {/* ── Uwagi ── */}
          <SectionBlock
            icon={FileText}
            title="Uwagi"
            subtitle="Dodatkowe informacje i specjalne wymagania"
            colorFrom="from-neutral-50"
            colorTo="to-slate-50"
            borderColor="border-neutral-200 dark:border-neutral-700"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uwagi (widoczne dla klienta)</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set({ notes: e.target.value })}
                  placeholder="Informacje widoczne na ofercie/zamówieniu klienta..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uwagi wewnętrzne</Label>
                <Textarea
                  rows={3}
                  value={form.internalNotes}
                  onChange={e => set({ internalNotes: e.target.value })}
                  placeholder="Notatki widoczne tylko dla zespołu..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Specjalne wymagania</Label>
                <Textarea
                  rows={2}
                  value={form.specialRequirements}
                  onChange={e => set({ specialRequirements: e.target.value })}
                  placeholder="Alergie, diety, wymagania organizacyjne..."
                />
              </div>
            </div>
          </SectionBlock>
        </div>

        {/* ═══ PRAWA KOLUMNA — STICKY SIDEBAR ═══ */}
        <div>
          <div className="sticky top-6 space-y-4">

            {/* Live kalkulator */}
            <div className="rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
                    <Calculator className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Kalkulator ceny</h3>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3 text-sm bg-white dark:bg-neutral-900">
                {totals && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Dania ({form.items.length} poz.)
                      </span>
                      <span className="font-mono font-medium">{fmt(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Usługi ({form.extras.length} poz.)
                      </span>
                      <span className="font-mono font-medium">{fmt(totals.extrasTotalPrice)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <span>
                          Rabat
                          {form.discountType === 'PERCENTAGE' && form.discountValue
                            ? ` (${form.discountValue}%)`
                            : ''}
                        </span>
                        <span className="font-mono font-medium">
                          −{fmt(totals.discountAmount)}
                        </span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Razem</span>
                      <span className="font-mono text-orange-600 dark:text-orange-400">
                        {fmt(totals.totalPrice)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Kontekst zamówienia */}
            {order && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
                <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Informacje</h3>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Klient</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{clientName}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Numer zamówienia</p>
                    <p className="font-mono text-neutral-900 dark:text-neutral-100">{order.orderNumber}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Aktualna cena w bazie</p>
                    <p className="font-mono text-neutral-500">{fmt(Number(order.totalPrice))}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky save button */}
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md"
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
    </div>
  );
}
