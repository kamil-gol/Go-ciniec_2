'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  secondaryLabel?: string
  icon?: React.ReactNode
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  /** Render a footer action (e.g., "Create new client") */
  footerAction?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
  /** Max items to display before showing "show more" */
  maxDisplayed?: number
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Wybierz...',
  searchPlaceholder = 'Szukaj...',
  emptyMessage = 'Nie znaleziono wyników.',
  label,
  error,
  disabled = false,
  className,
  footerAction,
  maxDisplayed = 50,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  // Filter and limit displayed options
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options.slice(0, maxDisplayed)

    const query = searchQuery.toLowerCase()
    return options
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          opt.description?.toLowerCase().includes(query) ||
          opt.secondaryLabel?.toLowerCase().includes(query)
      )
      .slice(0, maxDisplayed)
  }, [options, searchQuery, maxDisplayed])

  const totalMatches = React.useMemo(() => {
    if (!searchQuery) return options.length
    const query = searchQuery.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query) ||
        opt.secondaryLabel?.toLowerCase().includes(query)
    ).length
  }, [options, searchQuery])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? '' : selectedValue)
    setOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label={label || placeholder}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2',
              'text-sm bg-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-secondary-300 hover:border-secondary-400',
            )}
          >
            <span
              className={cn(
                'truncate text-left flex-1',
                !selectedOption && 'text-neutral-400'
              )}
            >
              {selectedOption ? (
                <span className="flex items-center gap-2">
                  {selectedOption.icon}
                  <span>{selectedOption.label}</span>
                  {selectedOption.secondaryLabel && (
                    <span className="text-neutral-400 text-xs">
                      {selectedOption.secondaryLabel}
                    </span>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </span>

            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {value && !disabled && (
                <span
                  onClick={handleClear}
                  className="p-0.5 rounded hover:bg-secondary-100 cursor-pointer"
                  role="button"
                  aria-label="Wyczyść"
                >
                  <X className="h-3.5 w-3.5 text-neutral-400" />
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 text-neutral-400" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-4 text-center">
                  <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">{emptyMessage}</p>
                  {searchQuery && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Spróbuj zmienić frazę wyszukiwania
                    </p>
                  )}
                </div>
              </CommandEmpty>

              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center gap-2 py-2.5 px-3 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        value === option.value
                          ? 'text-primary-600 opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span className="truncate font-medium text-sm">
                          {option.label}
                        </span>
                      </div>
                      {option.description && (
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {option.secondaryLabel && (
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {option.secondaryLabel}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>

              {totalMatches > maxDisplayed && (
                <div className="px-3 py-2 text-center">
                  <p className="text-xs text-neutral-400">
                    Pokazano {filteredOptions.length} z {totalMatches} wyników.
                    Wpisz więcej aby zawęzić.
                  </p>
                </div>
              )}

              {footerAction && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        footerAction.onClick()
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 py-2.5 px-3 cursor-pointer text-primary-600 font-medium"
                    >
                      {footerAction.icon || <UserPlus className="h-4 w-4" />}
                      <span className="text-sm">{footerAction.label}</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
