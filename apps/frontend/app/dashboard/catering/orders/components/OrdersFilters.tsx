'use client';

import { useState, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
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
import { ORDER_STATUS_LABEL, DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';

interface Props {
  filter: CateringOrdersFilter;
  onChange: (partial: Partial<CateringOrdersFilter>) => void;
}

export function OrdersFilters({ filter, onChange }: Props) {
  const [search, setSearch] = useState(filter.search ?? '');

  const handleSearchSubmit = useCallback(() => {
    onChange({ search: search.trim() || undefined });
  }, [search, onChange]);

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
    filter.status || filter.deliveryType || filter.search || filter.eventDateFrom || filter.eventDateTo;

  return (
    <div className="space-y-3">
      {/* Top row — search + selects */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
          <Input
            placeholder="Numer, klient, wydarzenie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
            className="pl-9 h-10 rounded-xl"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              onClick={() => { setSearch(''); onChange({ search: undefined }); }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status */}
        <Select
          value={filter.status ?? 'ALL'}
          onValueChange={v => onChange({ status: v === 'ALL' ? undefined : v as CateringOrderStatus })}
        >
          <SelectTrigger className="w-44 h-10 rounded-xl">
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Wszystkie statusy</SelectItem>
            {(Object.entries(ORDER_STATUS_LABEL) as [CateringOrderStatus, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Typ dostawy */}
        <Select
          value={filter.deliveryType ?? 'ALL'}
          onValueChange={v => onChange({ deliveryType: v === 'ALL' ? undefined : v as CateringDeliveryType })}
        >
          <SelectTrigger className="w-44 h-10 rounded-xl">
            <SelectValue placeholder="Typ realizacji" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Wszystkie typy</SelectItem>
            {(Object.entries(DELIVERY_TYPE_LABEL) as [CateringDeliveryType, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Data od */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-0.5">Data od</span>
          <Input
            type="date"
            value={filter.eventDateFrom ?? ''}
            onChange={e => onChange({ eventDateFrom: e.target.value || undefined })}
            className="w-40 h-10 rounded-xl"
          />
        </div>

        {/* Data do */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-0.5">Data do</span>
          <Input
            type="date"
            value={filter.eventDateTo ?? ''}
            onChange={e => onChange({ eventDateTo: e.target.value || undefined })}
            className="w-40 h-10 rounded-xl"
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-10 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Resetuj
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filter.search && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              <SlidersHorizontal className="w-3 h-3" />
              Szukaj: {filter.search}
              <button onClick={() => { setSearch(''); onChange({ search: undefined }); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filter.status && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              Status: {ORDER_STATUS_LABEL[filter.status]}
              <button onClick={() => onChange({ status: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filter.deliveryType && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              Typ: {DELIVERY_TYPE_LABEL[filter.deliveryType]}
              <button onClick={() => onChange({ deliveryType: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(filter.eventDateFrom || filter.eventDateTo) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              Data: {filter.eventDateFrom ?? '...'} → {filter.eventDateTo ?? '...'}
              <button onClick={() => onChange({ eventDateFrom: undefined, eventDateTo: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
