'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useCateringOrders } from '@/hooks/use-catering-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OrdersTable } from './components/OrdersTable';
import { OrdersFilters } from './components/OrdersFilters';
import { NewOrderWizard } from './components/NewOrderWizard';
import { PageLayout, StatCard, LoadingState, EmptyState  } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader';
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens';
import type { CateringOrdersFilter } from '@/types/catering-order.types';
import { Breadcrumb } from '@/components/shared/Breadcrumb'

const CATERING_ACCENT = moduleAccents.catering;

export default function CateringOrdersPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter] = useState<CateringOrdersFilter>({ page: 1, limit: 20 });
  const wizardRef = useRef<HTMLDivElement>(null);

  // Duży limit dla statystyk
  const { data: statsData } = useCateringOrders({ page: 1, limit: 100 });
  const { data, isLoading } = useCateringOrders(filter);

  // Auto-scroll do wizarda po otwarciu
  useEffect(() => {
    if (showWizard && wizardRef.current) {
      const timer = setTimeout(() => {
        wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showWizard]);

  const allOrders = statsData?.data ?? [];
  const now = new Date();

  const stats = {
    total: statsData?.meta?.total ?? 0,
    confirmed: allOrders.filter(
      o => o.status === 'CONFIRMED' || o.status === 'IN_PREPARATION' || o.status === 'READY'
    ).length,
    pending: allOrders.filter(
      o => o.status === 'DRAFT' || o.status === 'INQUIRY' || o.status === 'QUOTED'
    ).length,
    thisMonth: allOrders.filter(o => {
      if (!o.eventDate) return false;
      const d = new Date(o.eventDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const handleFilterChange = (partial: Partial<CateringOrdersFilter>) =>
    setFilter(prev => ({ ...prev, ...partial, page: 1 }));

  const handlePageChange = (page: number) =>
    setFilter(prev => ({ ...prev, page }));

  return (
    <PageLayout>
      <Breadcrumb />
      {/* Hero */}
      <PageHeader
        title="Zamówienia cateringowe"
        subtitle="Zarządzaj zamówieniami, logistyką i klientami cateringu"
        icon={ShoppingBag}
        actions={
          <Button
            size="lg"
            onClick={() => setShowWizard(prev => !prev)}
            className="bg-white text-orange-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowe zamówienie
          </Button>
        }
      />

      {/* StatCards */}
      <div className={layout.statGrid}>
        <StatCard
          label="Wszystkie"
          value={stats.total}
          subtitle="Łącznie zamówień"
          icon={ShoppingBag}
          iconGradient={statGradients.count}
          delay={0.1}
        />
        <StatCard
          label="Aktywne"
          value={stats.confirmed}
          subtitle="Potwierdzone / W realizacji"
          icon={CheckCircle2}
          iconGradient={statGradients.success}
          delay={0.2}
        />
        <StatCard
          label="Do potwierdzenia"
          value={stats.pending}
          subtitle="Szkice i zapytania"
          icon={Clock}
          iconGradient={statGradients.alert}
          delay={0.3}
        />
        <StatCard
          label="Ten miesiąc"
          value={stats.thisMonth}
          subtitle="Wydarzeń w tym miesiącu"
          icon={TrendingUp}
          iconGradient={statGradients.info}
          delay={0.4}
        />
      </div>

      {/* Inline Wizard */}
      {showWizard && (
        <div ref={wizardRef} className="scroll-mt-4">
          <Card className="overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className={`bg-gradient-to-br ${CATERING_ACCENT.gradientSubtle} p-4 sm:p-8`}>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-br ${CATERING_ACCENT.iconBg} rounded-lg shadow-lg`}>
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Nowe zamówienie cateringowe
                  </h2>
                </div>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  Zamknij ✕
                </button>
              </div>
              <NewOrderWizard
                onSuccess={(id) => {
                  setShowWizard(false);
                  router.push(`/dashboard/catering/orders/${id}`);
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Filters + Table */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <OrdersFilters filter={filter} onChange={handleFilterChange} />
          {isLoading ? (
            <LoadingState variant="skeleton" rows={6} message="Wczytywanie zamówień..." />
          ) : !data?.data?.length ? (
            <EmptyState
              icon={ShoppingBag}
              title="Brak zamówień"
              description="Nie znaleziono zamówień spełniających wybrane kryteria. Utwórz nowe zamówienie cateringowe, aby rozpocząć."
              actionLabel="Nowe zamówienie"
              onAction={() => setShowWizard(true)}
            />
          ) : (
            <OrdersTable
              orders={data.data}
              meta={data?.meta}
              onPageChange={handlePageChange}
              onRowClick={(id) => router.push(`/dashboard/catering/orders/${id}`)}
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
