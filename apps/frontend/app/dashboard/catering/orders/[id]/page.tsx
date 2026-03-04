'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Loader2,
  MoreVertical,
  Trash2,
  CalendarDays,
  Users,
  Truck,
  MapPin,
  Clock,
  Phone,
  Mail,
  Building2,
  User,
  Utensils,
  Star,
  Receipt,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  ChevronRight,
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

// ═══ HELPERS ═══

function formatPrice(value: number | string | null | undefined) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);
}

function formatDatePl(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getInitials(firstName?: string | null, lastName?: string | null, companyName?: string | null) {
  if (companyName) return companyName.slice(0, 2).toUpperCase();
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '??';
}

// ═══ SUB-COMPONENTS ═══

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label?: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
      <Icon className="w-4 h-4 shrink-0" />
      {label && <span className="text-xs text-white/70">{label}</span>}
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  badge,
  children,
  className,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-0 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden ${className ?? ''}`}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</CardTitle>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{value ?? '—'}</p>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold">
      {count}
    </span>
  );
}

// ═══ PAGE ═══

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

  const clientName =
    order.client.clientType === 'COMPANY' && order.client.companyName
      ? order.client.companyName
      : `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim() || '—';

  const isCompany = order.client.clientType === 'COMPANY';
  const initials = isCompany
    ? getInitials(null, null, order.client.companyName)
    : getInitials(order.client.firstName, order.client.lastName);

  const canDelete = order.status === 'DRAFT' || order.status === 'CANCELLED';

  const items = order.items ?? [];
  const extras = order.extras ?? [];
  const deposits = order.deposits ?? [];

  const pricePerGuest =
    order.guestsCount > 0 && Number(order.totalPrice) > 0
      ? Number(order.totalPrice) / order.guestsCount
      : null;

  return (
    <div className="min-h-0">
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 px-6 py-8 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-32 bottom-0 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <button
              onClick={() => router.push('/dashboard/catering/orders')}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors py-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Powrót
            </button>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
                onClick={() => setStatusDialogOpen(true)}
              >
                Zmień status
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
                onClick={() => router.push(`/dashboard/catering/orders/${id}/edit`)}
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Edytuj
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 w-9 p-0">
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

          {/* Order number + status */}
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-white/60 text-sm tracking-wide">
              {order.orderNumber}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Event name */}
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-6">
            {order.eventName ?? 'Zamówienie cateringowe'}
          </h1>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            {order.eventDate && (
              <StatPill icon={CalendarDays} label="Data" value={formatDatePl(order.eventDate)} />
            )}
            <StatPill icon={Users} label="Osób" value={String(order.guestsCount)} />
            <StatPill icon={Receipt} label="Wartość" value={formatPrice(order.totalPrice)} />
            {pricePerGuest !== null && (
              <StatPill icon={Sparkles} label="/ os." value={formatPrice(pricePerGuest)} />
            )}
            <StatPill icon={Truck} value={DELIVERY_TYPE_LABEL[order.deliveryType]} />
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Wydarzenie */}
            <SectionCard
              icon={CalendarDays}
              iconBg="bg-orange-100 dark:bg-orange-900/30"
              iconColor="text-orange-600 dark:text-orange-400"
              title="Szczegóły wydarzenia"
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Okazja" value={order.eventName} />
                <Field label="Data realizacji" value={formatDatePl(order.eventDate)} />
                <Field label="Liczba osób" value={order.guestsCount ? `${order.guestsCount} osób` : '—'} />
              </div>
            </SectionCard>

            {/* Logistyka */}
            <SectionCard
              icon={Truck}
              iconBg="bg-rose-100 dark:bg-rose-900/30"
              iconColor="text-rose-600 dark:text-rose-400"
              title="Logistyka"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <Truck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                    {DELIVERY_TYPE_LABEL[order.deliveryType]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {(order.deliveryType === 'DELIVERY' || order.deliveryType === 'ON_SITE') &&
                    order.deliveryAddress && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                          {order.deliveryType === 'DELIVERY' ? 'Adres dostawy' : 'Adres klienta'}
                        </p>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    )}

                  {order.deliveryTime && (
                    <div>
                      <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                        {order.deliveryType === 'PICKUP' ? 'Godzina odbioru' : 'Godzina'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{order.deliveryTime}</p>
                      </div>
                    </div>
                  )}

                  {order.deliveryDate && (
                    <Field label="Data dostawy" value={formatDatePl(order.deliveryDate)} />
                  )}
                </div>

                {order.deliveryNotes && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Uwagi</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{order.deliveryNotes}</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Dania */}
            {items.length > 0 && (
              <SectionCard
                icon={Utensils}
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600 dark:text-green-400"
                title="Dania"
                badge={<CountBadge count={items.length} />}
                className="pb-0"
              >
                <div className="-mx-5 -mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-y border-neutral-200 dark:border-neutral-700">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Danie</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Ilość</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cena jedn.</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Razem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr
                          key={item.id}
                          className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${
                            i % 2 === 1 ? 'bg-neutral-50/50 dark:bg-neutral-800/20' : 'bg-white dark:bg-transparent'
                          }`}
                        >
                          <td className="px-5 py-3">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {item.dishNameSnapshot ?? '—'}
                            </span>
                            {item.note && (
                              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.note}</span>
                            )}
                          </td>
                          <td className="text-center px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono">
                            ×{item.quantity}
                          </td>
                          <td className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-400">
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td className="text-right px-5 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatPrice(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-50 dark:bg-green-900/10 border-t-2 border-green-200 dark:border-green-800">
                        <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-green-700 dark:text-green-300">
                          Razem za dania
                        </td>
                        <td className="text-right px-5 py-3 font-bold text-green-700 dark:text-green-300">
                          {formatPrice(order.subtotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Extras */}
            {extras.length > 0 && (
              <SectionCard
                icon={Star}
                iconBg="bg-amber-100 dark:bg-amber-900/30"
                iconColor="text-amber-600 dark:text-amber-400"
                title="Usługi dodatkowe"
                badge={<CountBadge count={extras.length} />}
                className="pb-0"
              >
                <div className="-mx-5 -mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-y border-neutral-200 dark:border-neutral-700">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Usługa</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Ilość</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cena jedn.</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Razem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extras.map((extra, i) => (
                        <tr
                          key={extra.id}
                          className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${
                            i % 2 === 1 ? 'bg-neutral-50/50 dark:bg-neutral-800/20' : 'bg-white dark:bg-transparent'
                          }`}
                        >
                          <td className="px-5 py-3">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">{extra.name}</span>
                            {extra.description && (
                              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{extra.description}</span>
                            )}
                          </td>
                          <td className="text-center px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono">
                            ×{extra.quantity}
                          </td>
                          <td className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-400">
                            {formatPrice(extra.unitPrice)}
                          </td>
                          <td className="text-right px-5 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatPrice(extra.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-50 dark:bg-amber-900/10 border-t-2 border-amber-200 dark:border-amber-800">
                        <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">
                          Razem za usługi
                        </td>
                        <td className="text-right px-5 py-3 font-bold text-amber-700 dark:text-amber-300">
                          {formatPrice(order.extrasTotalPrice)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </SectionCard>
            )}
          </div>

          {/* RIGHT COLUMN — 1/3 */}
          <div className="space-y-6">

            {/* Klient */}
            <SectionCard
              icon={isCompany ? Building2 : User}
              iconBg={isCompany ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}
              iconColor={isCompany ? 'text-violet-600 dark:text-violet-400' : 'text-indigo-600 dark:text-indigo-400'}
              title="Klient"
            >
              {/* Avatar row */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                    isCompany
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                      : 'bg-gradient-to-br from-indigo-500 to-blue-600'
                  }`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{clientName}</p>
                  {isCompany && (
                    <span className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                      <Building2 className="w-2.5 h-2.5" /> Firma
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {order.client.email && (
                  <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                    <Mail className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="truncate">{order.client.email}</span>
                  </div>
                )}
                {order.client.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                    <Phone className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span>{order.client.phone}</span>
                  </div>
                )}
              </div>

              {(order.contactName || order.contactPhone || order.contactEmail) && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
                    Kontakt do zamówienia
                  </p>
                  <div className="space-y-2">
                    {order.contactName && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <User className="w-4 h-4 shrink-0 text-neutral-400" />
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{order.contactName}</span>
                      </div>
                    )}
                    {order.contactPhone && (
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <Phone className="w-4 h-4 shrink-0 text-neutral-400" />
                        <span>{order.contactPhone}</span>
                      </div>
                    )}
                    {order.contactEmail && (
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <Mail className="w-4 h-4 shrink-0 text-neutral-400" />
                        <span className="truncate">{order.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push(`/dashboard/clients/${order.client.id}`)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Profil klienta <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </SectionCard>

            {/* Rozliczenie */}
            <SectionCard
              icon={Receipt}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              title="Rozliczenie"
            >
              <div className="space-y-2.5">
                {Number(order.subtotal) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <Utensils className="w-3.5 h-3.5" /> Dania
                    </span>
                    <span className="font-medium">{formatPrice(order.subtotal)}</span>
                  </div>
                )}
                {Number(order.extrasTotalPrice) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <Star className="w-3.5 h-3.5" /> Usługi dodatkowe
                    </span>
                    <span className="font-medium">{formatPrice(order.extrasTotalPrice)}</span>
                  </div>
                )}
                {order.discountAmount && Number(order.discountAmount) > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>
                      Rabat
                      {order.discountType === 'PERCENTAGE' && order.discountValue
                        ? ` (${order.discountValue}%)`
                        : ''}
                    </span>
                    <span className="font-medium">−{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">Łącznie</span>
                  <span className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>
                {pricePerGuest !== null && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-right">
                    {formatPrice(pricePerGuest)} / osobę
                  </p>
                )}
              </div>

              {/* Depozyty */}
              {deposits.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Zaliczki</p>
                  {deposits.map(d => {
                    const paid = d.paid || d.status === 'PAID';
                    return (
                      <div key={d.id} className="flex items-center gap-3">
                        <div className="shrink-0">
                          {paid
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${
                            paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {d.title ?? 'Zaliczka'}
                          </p>
                          {d.dueDate && (
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDatePl(d.dueDate)}</p>
                          )}
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${
                          paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400'
                        }`}>
                          {formatPrice(d.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Uwagi */}
            {(order.notes || order.specialRequirements) && (
              <SectionCard
                icon={FileText}
                iconBg="bg-neutral-100 dark:bg-neutral-800"
                iconColor="text-neutral-500 dark:text-neutral-400"
                title="Uwagi"
              >
                <div className="space-y-4">
                  {order.notes && (
                    <div>
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Uwagi</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{order.notes}</p>
                    </div>
                  )}
                  {order.specialRequirements && (
                    <div className={order.notes ? 'pt-3 border-t border-neutral-100 dark:border-neutral-800' : ''}>
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Specjalne wymagania</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{order.specialRequirements}</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Timeline */}
            <Card className="border-0 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Historia</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <OrderTimeline orderId={id} />
              </CardContent>
            </Card>

          </div>
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
