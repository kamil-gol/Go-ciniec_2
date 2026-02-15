// apps/frontend/src/components/audit-log/AuditLogFilters.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useActions, useEntityTypes } from '@/hooks/use-audit-log';
import type { AuditLogFilters } from '@/types/audit-log.types';

interface Props {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onReset: () => void;
}

export function AuditLogFilters({ filters, onFiltersChange, onReset }: Props) {
  const { data: actions = [] } = useActions();
  const { data: entityTypes = [] } = useEntityTypes();
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  const handleActionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      action: value === 'all' ? undefined : (value as any),
    });
  };

  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entityType: value === 'all' ? undefined : (value as any),
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onFiltersChange({
      ...filters,
      startDate: date ? date.toISOString() : undefined,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onFiltersChange({
      ...filters,
      endDate: date ? date.toISOString() : undefined,
    });
  };

  const hasActiveFilters =
    filters.action ||
    filters.entityType ||
    filters.startDate ||
    filters.endDate;

  const actionLabels: Record<string, string> = {
    ARCHIVE: 'Archiwizacja',
    UNARCHIVE: 'Przywrócenie',
    CREATE: 'Utworzenie',
    UPDATE: 'Aktualizacja',
    DELETE: 'Usunięcie',
  };

  const entityTypeLabels: Record<string, string> = {
    RESERVATION: 'Rezerwacja',
    CLIENT: 'Klient',
    ROOM: 'Sala',
    MENU: 'Menu',
    USER: 'Użytkownik',
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtry</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2"
          >
            <X className="mr-1 h-4 w-4" />
            Wyczyść
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Akcja */}
        <div className="space-y-2">
          <Label htmlFor="action">Akcja</Label>
          <Select
            value={filters.action || 'all'}
            onValueChange={handleActionChange}
          >
            <SelectTrigger id="action">
              <SelectValue placeholder="Wszystkie akcje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie akcje</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {actionLabels[action] || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Typ encji */}
        <div className="space-y-2">
          <Label htmlFor="entityType">Typ</Label>
          <Select
            value={filters.entityType || 'all'}
            onValueChange={handleEntityTypeChange}
          >
            <SelectTrigger id="entityType">
              <SelectValue placeholder="Wszystkie typy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie typy</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {entityTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data od */}
        <div className="space-y-2">
          <Label>Data od</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, 'PPP', { locale: pl })
                ) : (
                  <span>Wybierz datę</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                initialFocus
                locale={pl}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data do */}
        <div className="space-y-2">
          <Label>Data do</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, 'PPP', { locale: pl })
                ) : (
                  <span>Wybierz datę</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                initialFocus
                locale={pl}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
