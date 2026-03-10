// apps/frontend/src/app/dashboard/catering/orders/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Loader2 } from 'lucide-react';
import { useCateringOrders } from '@/hooks/use-catering-orders';
import { Button } from '@/components/ui/button';
import { OrdersTable } from './components/OrdersTable';
import { OrdersFilters } from './components/OrdersFilters';
import type { CateringOrdersFilter } from '@/types/catering-order.types';

export default function CateringOrdersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<CateringOrdersFilter>({ page: 1, limit: 20 });

  const { data, isLoading } = useCateringOrders(filter);

  const handleFilterChange = (partial: Partial<CateringOrdersFilter>) => {
    setFilter(prev => ({ ...prev, ...partial, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
            Zamówienia cateringowe
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Lista zamówień — {data?.meta?.total ?? 0} łącznie
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/catering/orders/new')}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nowe zamówienie
        </Button>
      </div>

      {/* Filtry */}
      <OrdersFilters filter={filter} onChange={handleFilterChange} />

      {/* Tabela / Karty */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <OrdersTable
          orders={data?.data ?? []}
          meta={data?.meta}
          onPageChange={handlePageChange}
          onRowClick={(id) => router.push(`/dashboard/catering/orders/${id}`)}
        />
      )}
    </div>
  );
}
