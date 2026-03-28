'use client'
import { formatDateLong } from '@/lib/utils'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, Building2, Loader2 } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { useGlobalSearch } from '@/hooks/use-search'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusLabels: Record<string, string> = {
  PENDING: 'Oczekująca',
  RESERVED: 'Zarezerwowana',
  CONFIRMED: 'Potwierdzona',
  CANCELLED: 'Anulowana',
  COMPLETED: 'Zakończona',
  ARCHIVED: 'Zarchiwizowana',
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  const { data, isFetching } = useGlobalSearch(debouncedQuery)

  const handleSelect = useCallback(
    (path: string) => {
      onOpenChange(false)
      router.push(path)
    },
    [router, onOpenChange]
  )

  const hasResults =
    data &&
    (data.reservations.length > 0 ||
      data.clients.length > 0 ||
      data.halls.length > 0)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogPrimitive.Title className="sr-only">
            Wyszukiwanie globalne
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Wyszukaj rezerwacje, klientów lub sale
          </DialogPrimitive.Description>
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              placeholder="Szukaj rezerwacji, klientów, sal..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isFetching && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wyszukiwanie...
                </div>
              )}

              {!isFetching && debouncedQuery.length >= 2 && !hasResults && (
                <CommandEmpty>Brak wyników dla &ldquo;{debouncedQuery}&rdquo;</CommandEmpty>
              )}

              {!isFetching && debouncedQuery.length > 0 && debouncedQuery.length < 2 && (
                <div className="py-6 text-center text-sm text-neutral-500">
                  Wpisz minimum 2 znaki...
                </div>
              )}

              {data && data.reservations.length > 0 && (
                <CommandGroup heading="Rezerwacje">
                  {data.reservations.map((r) => {
                    const clientName = r.client
                      ? r.client.clientType === 'COMPANY' && r.client.companyName
                        ? r.client.companyName
                        : `${r.client.firstName} ${r.client.lastName}`
                      : 'Brak klienta'
                    const dateObj = r.startDateTime
                      ? new Date(r.startDateTime)
                      : r.date
                        ? new Date(r.date + 'T00:00:00')
                        : null
                    const dateStr = dateObj
                      ? formatDateLong(dateObj)
                      : null
                    const status = statusLabels[r.status] || r.status

                    return (
                      <CommandItem
                        key={`r-${r.id}`}
                        value={r.id}
                        onSelect={() => handleSelect(`/dashboard/reservations/${r.id}`)}
                        className="cursor-pointer"
                      >
                        <Calendar className="mr-3 h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{clientName}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                              {status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {[dateStr, r.hall?.name, r.eventType?.name].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {data && data.reservations.length > 0 && data.clients.length > 0 && (
                <CommandSeparator />
              )}

              {data && data.clients.length > 0 && (
                <CommandGroup heading="Klienci">
                  {data.clients.map((c) => {
                    const name =
                      c.clientType === 'COMPANY' && c.companyName
                        ? c.companyName
                        : `${c.firstName} ${c.lastName}`
                    const subtitle = [c.email, c.phone].filter(Boolean).join(' • ')

                    return (
                      <CommandItem
                        key={`c-${c.id}`}
                        value={c.id}
                        onSelect={() => handleSelect(`/dashboard/clients?search=${encodeURIComponent(c.lastName || c.firstName)}`)}
                        className="cursor-pointer"
                      >
                        <Users className="mr-3 h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{name}</span>
                          {subtitle && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                              {subtitle}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {data &&
                (data.reservations.length > 0 || data.clients.length > 0) &&
                data.halls.length > 0 && <CommandSeparator />}

              {data && data.halls.length > 0 && (
                <CommandGroup heading="Sale">
                  {data.halls.map((h) => (
                    <CommandItem
                      key={`h-${h.id}`}
                      value={h.id}
                      onSelect={() => handleSelect(`/dashboard/halls`)}
                      className="cursor-pointer"
                    >
                      <Building2 className="mr-3 h-4 w-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{h.name}</span>
                        {h.capacity && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                            do {h.capacity} osób
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
