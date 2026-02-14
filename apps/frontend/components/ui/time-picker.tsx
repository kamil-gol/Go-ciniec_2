'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TimePickerProps {
  value?: string // HH:MM
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  minuteStep?: number
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function TimePicker({
  value,
  onChange,
  label,
  placeholder = 'Godzina...',
  error,
  disabled = false,
  minuteStep = 15,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const MINUTES = React.useMemo(
    () => Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep),
    [minuteStep]
  )

  const [selectedHour, selectedMinute] = React.useMemo(() => {
    if (!value) return [null, null]
    const parts = value.split(':')
    return [parseInt(parts[0]), parseInt(parts[1])]
  }, [value])

  // Scroll to selected hour when opened
  React.useEffect(() => {
    if (open && scrollRef.current && selectedHour !== null) {
      const el = scrollRef.current.querySelector(`[data-hour="${selectedHour}"]`)
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [open, selectedHour])

  const handleSelect = (hour: number, minute: number) => {
    const hh = String(hour).padStart(2, '0')
    const mm = String(minute).padStart(2, '0')
    onChange(`${hh}:${mm}`)
    setOpen(false)
  }

  const displayValue = React.useMemo(() => {
    if (!value) return null
    return value
  }, [value])

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
              !displayValue && 'text-secondary-400',
              error && 'border-red-400 focus:ring-red-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Clock className="mr-2 h-4 w-4 text-primary-500" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-3">
            <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider mb-2">
              Wybierz godzinę
            </p>
            <div ref={scrollRef} className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              <div className="space-y-1">
                {HOURS.map((hour) => (
                  <div key={hour} data-hour={hour}>
                    <p className="text-xs font-semibold text-secondary-400 sticky top-0 bg-white py-1 z-10">
                      {String(hour).padStart(2, '0')}:00
                    </p>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {MINUTES.map((minute) => {
                        const isSelected = selectedHour === hour && selectedMinute === minute
                        return (
                          <button
                            key={`${hour}-${minute}`}
                            type="button"
                            onClick={() => handleSelect(hour, minute)}
                            className={cn(
                              'px-2 py-1.5 text-sm rounded-lg transition-all duration-150',
                              'hover:bg-primary-100 hover:text-primary-700',
                              'focus:outline-none focus:ring-2 focus:ring-primary-400',
                              isSelected
                                ? 'bg-primary-600 text-white font-semibold shadow-sm hover:bg-primary-700 hover:text-white'
                                : 'text-secondary-700 hover:shadow-sm'
                            )}
                          >
                            {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
