'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  minDate?: Date
  className?: string
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Wybierz datę...',
  error,
  disabled = false,
  minDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value + 'T00:00:00')
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      const yyyy = day.getFullYear()
      const mm = String(day.getMonth() + 1).padStart(2, '0')
      const dd = String(day.getDate()).padStart(2, '0')
      onChange(`${yyyy}-${mm}-${dd}`)
    }
    setOpen(false)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-secondary-700">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-11',
              'border-secondary-300 hover:border-primary-400 hover:bg-primary-50/50',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
              'transition-all duration-200',
              !dateValue && 'text-secondary-400',
              error && 'border-red-400 focus:ring-red-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary-500" />
            {dateValue
              ? format(dateValue, 'd MMMM yyyy', { locale: pl })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            disabled={minDate ? { before: minDate } : undefined}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
