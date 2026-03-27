'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, QueueItem } from '@/types'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  clientId: z.string().min(1, 'Wybierz klienta'),
  reservationQueueDate: z.string().min(1, 'Wybierz datę'),
  adults: z.coerce.number().min(1, 'Min. 1 osoba dorosła'),
  children: z.coerce.number().min(0, 'Min. 0 dzieci'),
  notes: z.string().optional(),
})

interface EditQueueFormProps {
  queueItem: QueueItem
  clients: Client[]
  onSubmit: (id: string, data: any) => Promise<void>
  onCancel?: () => void
}

export function EditQueueForm({ queueItem, clients, onSubmit, onCancel }: EditQueueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: queueItem.client.id,
      reservationQueueDate: format(parseISO(queueItem.queueDate), 'yyyy-MM-dd'),
      adults: 1,
      children: 0,
      notes: queueItem.notes || '',
    },
  })

  useEffect(() => {
    // Calculate adults and children from total guests
    // Assuming adults = guests, children = 0 if not specified
    const adults = queueItem.guests || 1
    const children = 0
    
    form.setValue('adults', adults)
    form.setValue('children', children)
    setSelectedDate(parseISO(queueItem.queueDate))
  }, [queueItem, form])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const guests = values.adults + values.children
      await onSubmit(queueItem.id, {
        ...values,
        guests,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Client Select - DISABLED (cannot change client) */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Klient</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled>
                <FormControl>
                  <SelectTrigger className="cursor-not-allowed opacity-60">
                    <SelectValue placeholder="Wybierz klienta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Picker with white background and auto-close */}
        <FormField
          control={form.control}
          name="reservationQueueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data wydarzenia (docelowa)</FormLabel>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {selectedDate ? (
                        format(selectedDate, 'd MMMM yyyy', { locale: pl })
                      ) : (
                        <span>Wybierz datę</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-neutral-800"
                  align="start"
                  style={{ zIndex: 9999 }}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      // Close calendar after selection
                      setCalendarOpen(false)
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Adults & Children */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="adults"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dorośli</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="children"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dzieci</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notatki (opcjonalnie)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Dodatkowe informacje..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Anuluj
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
