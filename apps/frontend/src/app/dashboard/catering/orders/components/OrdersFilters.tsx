// apps/frontend/src/app/dashboard/catering/orders/components/OrdersFilters.tsx
'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CateringOrdersFilter,
  CateringOrderStatus,
  CateringDeliveryType,
} from '@/types/catering-order.types';
import {
  ORDER_STATUS_LABEL,
  DELIVERY_TYPE_LABEL,
} from '@/types/catering-order.types';

interface Props {
  filter: CateringOrdersFilter;
  onChange: (partial: Partial<CateringOrdersFilter>) => void;
}

export function OrdersFilters({ filter, onChange }: Props) {
  const [search, setSearch] = useState(filter.search ?? '');

  const handleSearchSubmit = () => {
    onChange({ search: search.trim() || undefined });
  };

  const handleReset = () => {
    setSearch('');
    onChange({
      status: undefined,
      deliveryType: undefined,
      search: undefined,
      eventDateFrom: undefined,
      eventDateTo: undefined,
    });
  };

  const hasActiveFilters =
    filter.status ||
    filter.deliveryType ||
    filter.search ||
    filter.eventDateFrom ||
    filter.eventDateTo;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Szukaj — pełna szerokość na mobile, 2 kolumny na sm */}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
        <Input
          placeholder="Szukaj: nr, klient, wydarzenie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
          className="flex-1"
        />
        <Button variant="outline" size="icon" onClick={handleSearchSubmit} className="shrink-0">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Status */}
      <Select
        value={filter.status ?? 'ALL'}
        onValueChange={v =>
          onChange({ status: v === 'ALL' ? undefined : (v as CateringOrderStatus) })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Wszystkie statusy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Wszystkie statusy</SelectItem>
          {(Object.entries(ORDER_STATUS_LABEL) as [CateringOrderStatus, string][]).map(
            ([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      {/* Typ dostawy */}
      <Select
        value={filter.deliveryType ?? 'ALL'}
        onValueChange={v =>
          onChange({ deliveryType: v === 'ALL' ? undefined : (v as CateringDeliveryType) })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Typ dostawy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Wszystkie typy</SelectItem>
          {(Object.entries(DELIVERY_TYPE_LABEL) as [CateringDeliveryType, string][]).map(
            ([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      {/* Zakres dat — w jednym wierszu */}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Data od</span>
          <Input
            type="date"
            value={filter.eventDateFrom ?? ''}
            onChange={e => onChange({ eventDateFrom: e.target.value || undefined })}
            className="w-full"
          />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Data do</span>
          <Input
            type="date"
            value={filter.eventDateTo ?? ''}
            onChange={e => onChange({ eventDateTo: e.target.value || undefined })}
            className="w-full"
          />
        </div>
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={handleReset} className="shrink-0">
              <X className="mr-1 h-3 w-3" /> Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
