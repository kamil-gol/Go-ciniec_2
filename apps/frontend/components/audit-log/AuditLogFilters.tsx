// apps/frontend/components/audit-log/AuditLogFilters.tsx
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
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useActions, useEntityTypes } from '@/hooks/use-audit-log';
import type { AuditLogFilters } from '@/types/audit-log.types';

const actionLabels: Record<string, string> = {
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywrócenie',
  RESTORE: 'Przywrócenie',
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usunięcie',
  STATUS_CHANGE: 'Zmiana statusu',
  LOGIN: 'Logowanie',
  LOGOUT: 'Wylogowanie',
  QUEUE_ADD: 'Dodanie do kolejki',
  QUEUE_REMOVE: 'Usunięcie z kolejki',
  QUEUE_SWAP: 'Zamiana pozycji',
  QUEUE_MOVE: 'Przeniesienie',
  MARK_PAID: 'Oznaczenie płatności',
  ATTACHMENT_ADD: 'Dodanie załącznika',
  ATTACHMENT_DELETE: 'Usunięcie załącznika',
};

const entityTypeLabels: Record<string, string> = {
  RESERVATION: 'Rezerwacja',
  CLIENT: 'Klient',
  ROOM: 'Sala',
  HALL: 'Sala',
  MENU: 'Menu',
  USER: 'Użytkownik',
  DEPOSIT: 'Zaliczka',
  EVENT_TYPE: 'Typ wydarzenia',
};

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Akcja */}
      <div className="space-y-1.5">
        <Label htmlFor="action" className="text-xs font-medium text-muted-foreground">
          Akcja
        </Label>
        <Select
          value={filters.action || 'all'}
          onValueChange={handleActionChange}
        >
          <SelectTrigger id="action" className="h-9 bg-white dark:bg-neutral-900">
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
      <div className="space-y-1.5">
        <Label htmlFor="entityType" className="text-xs font-medium text-muted-foreground">
          Typ obiektu
        </Label>
        <Select
          value={filters.entityType || 'all'}
          onValueChange={handleEntityTypeChange}
        >
          <SelectTrigger id="entityType" className="h-9 bg-white dark:bg-neutral-900">
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
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Data od</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full h-9 justify-start text-left font-normal bg-white dark:bg-neutral-900',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, 'd MMMM yyyy', { locale: pl })
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
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Data do</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full h-9 justify-start text-left font-normal bg-white dark:bg-neutral-900',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, 'd MMMM yyyy', { locale: pl })
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
  );
}
