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
  defaultScrollHour?: number
  className?: string
  'aria-required'?: boolean | 'true' | 'false'
  required?: boolean
}

export function TimePicker({
  value,
  onChange,
  label,
  placeholder = 'Wybierz godzinę...',
  error,
  disabled = false,
  minuteStep = 30,
  defaultScrollHour = 12,
  className,
  'aria-required': ariaRequired,
  required,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Generuj wszystkie sloty czasowe
  const timeSlots = React.useMemo(() => {
    const slots: string[] = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += minuteStep) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      }
    }
    return slots
  }, [minuteStep])

  // Scroll do wybranej godziny lub defaultScrollHour
  React.useEffect(() => {
    if (!open || !scrollRef.current) return

    const targetHour = value
      ? parseInt(value.split(':')[0])
      : defaultScrollHour

    const timer = setTimeout(() => {
      if (!scrollRef.current) return
      const targetSlot = `${String(targetHour).padStart(2, '0')}:00`
      const el = scrollRef.current.querySelector(`[data-time="${targetSlot}"]`) as HTMLElement
      if (el) {
        const container = scrollRef.current
        const scrollTop = el.offsetTop - container.offsetTop - 40
        container.scrollTop = Math.max(0, scrollTop)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [open, value, defaultScrollHour])

  const handleSelect = (time: string) => {
    onChange(time)
    setOpen(false)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}{(ariaRequired || required) && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            aria-required={ariaRequired ?? required}
            className={cn(
              'w-full justify-start text-left font-normal h-11',
              'border-secondary-300 bg-white dark:bg-neutral-900 dark:border-neutral-700 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-neutral-800',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
              'transition-all duration-200',
              !value && 'text-neutral-500',
              error && 'border-red-400 dark:border-red-500 focus:ring-red-400 dark:focus:ring-red-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Clock className="mr-2 h-4 w-4 text-primary-500" />
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0 bg-white dark:bg-neutral-900 dark:border-neutral-700" align="start">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              Wybierz godzinę
            </p>
          </div>
          <div
            ref={scrollRef}
            className="max-h-[240px] overflow-y-auto px-2 pb-2"
          >
            <div className="grid grid-cols-3 gap-1">
              {timeSlots.map((time) => {
                const isSelected = value === time
                const hour = parseInt(time.split(':')[0])
                const isDimmed = hour < 8 || hour >= 22

                return (
                  <button
                    key={time}
                    type="button"
                    data-time={time}
                    onClick={() => handleSelect(time)}
                    className={cn(
                      'py-1.5 text-[13px] rounded-md transition-all duration-100',
                      'hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/40 dark:hover:text-primary-300',
                      'focus:outline-none focus:ring-1 focus:ring-primary-400',
                      isSelected
                        ? 'bg-primary-600 text-white font-semibold hover:bg-primary-700 hover:text-white'
                        : isDimmed
                          ? 'text-neutral-500 dark:text-neutral-500'
                          : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
