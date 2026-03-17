'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCateringOrder, useUpdateCateringOrder } from '@/hooks/use-catering-orders';
import { useCateringTemplates } from '@/hooks/use-catering';
import { useDishes } from '@/hooks/use-dishes';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/catering/orders/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edytuj zamówienie</h1>
            <p className="text-muted-foreground text-sm font-mono">{order?.orderNumber}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Zapisz zmiany
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Lewa/środkowa kolumna — formularz ────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Szablon / Pakiet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Szablon i pakiet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Szablon</Label>
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
                  <Label>Pakiet</Label>
                  <PackageCards
                    packages={templatePackages}
                    selectedId={form.packageId}
                    onSelect={pkgId => set({ packageId: pkgId })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wydarzenie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wydarzenie</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Nazwa wydarzenia</Label>
                <Input
                  value={form.eventName}
                  onChange={e => set({ eventName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={e => set({ eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Godzina</Label>
                <Input
                  type="time"
                  value={form.eventTime}
                  onChange={e => set({ eventTime: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Miejsce</Label>
                <Input
                  value={form.eventLocation}
                  onChange={e => set({ eventLocation: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Liczba gości</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.guestsCount}
                  onChange={e => set({ guestsCount: e.target.value })}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Oferta ważna do</Label>
                <Input
                  type="date"
                  value={form.quoteExpiresAt}
                  onChange={e => set({ quoteExpiresAt: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dostawa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dostawa</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Typ dostawy</Label>
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
                    <Label>Adres dostawy</Label>
                    <Textarea
                      value={form.deliveryAddress}
                      onChange={e => set({ deliveryAddress: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data dostawy</Label>
                    <Input
                      type="date"
                      value={form.deliveryDate}
                      onChange={e => set({ deliveryDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Godzina dostawy</Label>
                    <Input
                      type="time"
                      value={form.deliveryTime}
                      onChange={e => set({ deliveryTime: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Uwagi do logistyki</Label>
                <Textarea
                  value={form.deliveryNotes}
                  onChange={e => set({ deliveryNotes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dania */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Dania</CardTitle>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Dodaj danie
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.items.length === 0 && (
                <p className="text-sm text-muted-foreground">Brak dań</p>
              )}
              {form.items.map((item, i) => (
                <div key={item._key} className="flex gap-2 items-start">
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
                      emptyMessage="Nie znaleziono dań"
                    />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ilość"
                    value={item.quantity}
                    onChange={e => {
                      const items = [...form.items];
                      items[i] = {
                        ...items[i],
                        quantity: parseInt(e.target.value, 10) || 1,
                      };
                      set({ items });
                    }}
                    onFocus={e => e.target.select()}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Cena"
                    value={item.unitPrice}
                    onChange={e => {
                      const items = [...form.items];
                      items[i] = {
                        ...items[i],
                        unitPrice: parseFloat(e.target.value) || 0,
                      };
                      set({ items });
                    }}
                    onFocus={e => e.target.select()}
                    className="w-28"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      set({ items: form.items.filter((_, j) => j !== i) })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Usługi dodatkowe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Usługi dodatkowe</CardTitle>
                <Button size="sm" variant="outline" onClick={addExtra}>
                  <Plus className="mr-1 h-3 w-3" /> Dodaj
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.extras.length === 0 && (
                <p className="text-sm text-muted-foreground">Brak usług dodatkowych</p>
              )}
              {form.extras.map((extra, i) => (
                <div key={extra._key} className="flex gap-2 items-start">
                  <Input
                    placeholder="Nazwa usługi"
                    value={extra.name}
                    onChange={e => {
                      const extras = [...form.extras];
                      extras[i] = { ...extras[i], name: e.target.value };
                      set({ extras });
                    }}
                    className="flex-1 min-w-0"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ilość"
                    value={extra.quantity}
                    onChange={e => {
                      const extras = [...form.extras];
                      extras[i] = {
                        ...extras[i],
                        quantity: parseInt(e.target.value, 10) || 1,
                      };
                      set({ extras });
                    }}
                    onFocus={e => e.target.select()}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Cena"
                    value={extra.unitPrice}
                    onChange={e => {
                      const extras = [...form.extras];
                      extras[i] = {
                        ...extras[i],
                        unitPrice: parseFloat(e.target.value) || 0,
                      };
                      set({ extras });
                    }}
                    onFocus={e => e.target.select()}
                    className="w-28"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      set({ extras: form.extras.filter((_, j) => j !== i) })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rabat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rabat</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Typ rabatu</Label>
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
                  <Label>
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
                <Label>Powód rabatu</Label>
                <Input
                  value={form.discountReason}
                  onChange={e => set({ discountReason: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kontakt do zamówienia</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Imię i nazwisko</Label>
                <Input
                  value={form.contactName}
                  onChange={e => set({ contactName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input
                  value={form.contactPhone}
                  onChange={e => set({ contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => set({ contactEmail: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Uwagi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uwagi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Uwagi (widoczne dla klienta)</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set({ notes: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Uwagi wewnętrzne</Label>
                <Textarea
                  rows={3}
                  value={form.internalNotes}
                  onChange={e => set({ internalNotes: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Specjalne wymagania</Label>
                <Textarea
                  rows={2}
                  value={form.specialRequirements}
                  onChange={e => set({ specialRequirements: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Prawa kolumna — Live kalkulator (sticky) ──────── */}
        <div>
          <div className="sticky top-6 space-y-4">
            {/* Kalkulator */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Kalkulator ceny
                  <span className="ml-auto text-xs font-normal text-muted-foreground">Live</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {totals && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Dania ({form.items.length} poz.)
                      </span>
                      <span className="font-mono">{fmt(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Usługi dodatkowe ({form.extras.length} poz.)
                      </span>
                      <span className="font-mono">{fmt(totals.extrasTotalPrice)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Rabat
                          {form.discountType === 'PERCENTAGE' &&
                          form.discountValue
                            ? ` (${form.discountValue}%)`
                            : ''}
                        </span>
                        <span className="font-mono">
                          −{fmt(totals.discountAmount)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Razem</span>
                      <span className="font-mono text-primary">
                        {fmt(totals.totalPrice)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Kontekst zamówienia */}
            {order && (
              <Card>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Klient</p>
                    <p className="font-medium">
                      {order.client.clientType === 'COMPANY' &&
                      order.client.companyName
                        ? order.client.companyName
                        : `${order.client.firstName} ${order.client.lastName}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Numer zamówienia</p>
                    <p className="font-mono">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cena w bazie danych</p>
                    <p className="font-mono text-muted-foreground">
                      {fmt(Number(order.totalPrice))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Dolny przycisk zapisu ─────────────────────────────── */}
      <div className="flex justify-end gap-3 pb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/catering/orders/${id}`)}
        >
          Anuluj
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
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
  );
}
