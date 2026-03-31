'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  UtensilsCrossed,
  ArrowRight,
  Users,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Utensils,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import {
  useCateringOrdersByDate,
  CATERING_DELIVERY_LABELS,
  formatCateringCurrency,
  type CateringOrderListItem,
} from '@/lib/api/catering-orders'

// ─── Single order row ──────────────────────────────────────────────────────

function OrderRow({ order, index }: { order: CateringOrderListItem; index: number }) {
  const accent = moduleAccents.catering

  const clientName = order.client.companyName
    ? order.client.companyName
    : `${order.client.firstName} ${order.client.lastName}`

  // Jeśli contactName ustawiony — używamy go, inaczej fallback na klienta
  const contactDisplay = order.contactName
    ? order.contactName
    : `${order.client.firstName} ${order.client.lastName}`
  const hasContact = !!(order.contactName || order.contactPhone)

  // Zaliczki — tylko z getById; w liście deposits jest undefined
  const pendingDeposits = (order.deposits ?? [])
    .filter((d) => !d.paid)
    .reduce((sum, d) => sum + Number(d.remainingAmount), 0)

  const itemsCount = order._count?.items ?? 0
  const hasAddress = order.deliveryType === 'DELIVERY' && !!order.deliveryAddress
  const hasSpecialReq = !!order.specialRequirements

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
    >
      <Link
        href={`/dashboard/catering/orders/${order.id}`}
        className="group block rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-200 hover:-translate-y-0.5 border border-neutral-100 dark:border-neutral-700/50 hover:border-orange-200 dark:hover:border-orange-800/50"
      >
        <div className="flex items-start gap-3">
          {/* Ikona */}
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm flex-shrink-0 mt-0.5',
              accent.iconBg
            )}
          >
            <UtensilsCrossed className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Linia 1: klient + badge statusu */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {clientName}
              </span>
              <StatusBadge type="catering" status={order.status} />
            </div>

            {/* Linia 2: sposób dostawy + godzina + goście + liczba dań */}
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 truncate">
              {CATERING_DELIVERY_LABELS[order.deliveryType]}
              {order.deliveryTime && (
                <> <Clock className="inline h-3 w-3 mb-0.5" /> {order.deliveryTime}</>
              )}
              {(order.guestsCount ?? 0) > 0 && (
                <> • <Users className="inline h-3 w-3 mb-0.5" /> {order.guestsCount} os.</>
              )}
              {order.template?.name && <> • {order.template.name}</>}
              {itemsCount > 0 && (
                <> • <Utensils className="inline h-3 w-3 mb-0.5" /> {itemsCount} poz.</>
              )}
            </p>

            {/* Linia 3: adres dostawy (tylko DELIVERY) */}
            {hasAddress && (
              <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0 text-orange-500" />
                <span className="break-all">{order.deliveryAddress}</span>
              </p>
            )}

            {/* Linia 4: nazwa wydarzenia */}
            {order.eventName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 truncate">
                <PartyPopper className="inline h-3 w-3 mr-0.5 -mt-0.5" />{order.eventName}
              </p>
            )}

            {/* Linia 5: kontakt — osobna linia, bez truncate żeby numer nie był ucinany */}
            {hasContact && (
              <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 flex items-center gap-1 flex-wrap">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="font-medium">{contactDisplay}</span>
                {order.contactPhone && (
                  <span className="text-neutral-600 dark:text-neutral-300 font-mono tracking-tight">
                    {order.contactPhone}
                  </span>
                )}
              </p>
            )}

            {/* Linia 6: alerty — zaliczka + specjalne wymagania */}
            {(pendingDeposits > 0 || hasSpecialReq) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {pendingDeposits > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    💰 Zaliczka: {formatCateringCurrency(pendingDeposits)}
                  </span>
                )}
                {hasSpecialReq && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="h-3 w-3" /> Spec. wymagania
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cena + numer zamówienia */}
          <div className="text-right flex-shrink-0 ml-1">
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              {formatCateringCurrency(order.totalPrice)}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5 whitespace-nowrap">{order.orderNumber}</p>
          </div>

          <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Summary footer ─────────────────────────────────────────────────────────

function SummaryFooter({ orders }: { orders: CateringOrderListItem[] }) {
  const accent = moduleAccents.catering
  const totalValue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0)
  const confirmedCount = orders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS'
  ).length
  const specialCount = orders.filter((o) => !!o.specialRequirements).length

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl px-4 py-3 mt-2',
        'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10',
        'border border-orange-100 dark:border-orange-800/30'
      )}
    >
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="text-neutral-600 dark:text-neutral-300">
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{orders.length}</span>
          {' '}zamówień
        </span>
        {confirmedCount > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs">
            ✅ {confirmedCount} potw.
          </span>
        )}
        {specialCount > 0 && (
          <span className="text-orange-600 dark:text-orange-400 text-xs flex items-center gap-0.5">
            <AlertTriangle className="h-3 w-3" /> {specialCount} spec.
          </span>
        )}
      </div>
      <span className={cn('text-base font-bold whitespace-nowrap', accent.text, accent.textDark)}>
        {formatCateringCurrency(totalValue)}
      </span>
    </div>
  )
}

// ─── Main widget ───────────────────────────────────────────────────────────────

interface CateringDailyWidgetProps {
  date: string
}

export default function CateringDailyWidget({ date }: CateringDailyWidgetProps) {
  const accent = moduleAccents.catering
  const { data, isLoading, error, refetch } = useCateringOrdersByDate(date)
  const orders = data?.data ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-soft border border-neutral-100 dark:border-neutral-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
              accent.iconBg
            )}
          >
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              <UtensilsCrossed className="inline h-4 w-4 mr-1 -mt-0.5" />Catering
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Zamówienia na ten dzień
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-lg p-1.5 text-neutral-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            title="Odśwież"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/dashboard/catering/orders"
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80',
              accent.text,
              accent.textDark
            )}
          >
            Wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {isLoading ? (
          <LoadingState variant="skeleton" count={3} />
        ) : error ? (
          <ErrorState
            message="Nie udało się pobrać zamówień"
            onRetry={() => refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Brak zamówień cateringowych"
            actionLabel="+ Nowe zamówienie"
            actionHref="/dashboard/catering/orders/new"
            variant="compact"
          />
        ) : (
          <>
            {orders.map((order, index) => (
              <OrderRow key={order.id} order={order} index={index} />
            ))}
            <SummaryFooter orders={orders} />
          </>
        )}
      </div>
    </motion.div>
  )
}
