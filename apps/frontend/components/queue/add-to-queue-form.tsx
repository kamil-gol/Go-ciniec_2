'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
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
import { Client, CreateQueueReservationInput } from '@/types'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { clientsApi } from '@/lib/api/clients'

const formSchema = z.object({
  clientId: z.string().min(1, 'Wybierz klienta'),
  reservationQueueDate: z.string().min(1, 'Wybierz datę'),
  adults: z.coerce.number().min(1, 'Min. 1 osoba dorosła'),
  children: z.coerce.number().min(0, 'Min. 0 dzieci'),
  notes: z.string().optional(),
})

const newClientSchema = z.object({
  firstName: z.string().min(2, 'Min. 2 znaki'),
  lastName: z.string().min(2, 'Min. 2 znaki'),
  phone: z.string().min(9, 'Nieprawidłowy numer'),
  email: z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
})

interface AddToQueueFormProps {
  clients: Client[]
  onSubmit: (data: CreateQueueReservationInput) => Promise<void>
  onCancel?: () => void
  onClientAdded?: () => void
}

export function AddToQueueForm({ clients, onSubmit, onCancel, onClientAdded }: AddToQueueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [clientSearchValue, setClientSearchValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      clientId: '',
      reservationQueueDate: '',
      adults: 1,
      children: 0,
      notes: '',
    },
  })

  const newClientForm = useForm<z.infer<typeof newClientSchema>>({
    resolver: zodResolver(newClientSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
  })

  const safeClients = useMemo(() => clients ?? [], [clients])

  // Filter clients based on search (show results if 3+ chars)
  const filteredClients = useMemo(() => {
    if (clientSearchValue.length < 3) {
      return []
    }
    const searchLower = clientSearchValue.toLowerCase()
    return safeClients.filter(
      (client) =>
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        client.phone.includes(searchLower)
    )
  }, [safeClients, clientSearchValue])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const guests = values.adults + values.children
      await onSubmit({
        ...values,
        guests,
      })
      form.reset()
      setSelectedDate(undefined)
      setClientSearchValue('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNewClient = async (values: z.infer<typeof newClientSchema>) => {
    setIsAddingClient(true)
    try {
      const newClient = await clientsApi.create(values)
      form.setValue('clientId', newClient.id)
      setClientSearchValue(`${newClient.firstName} ${newClient.lastName} (${newClient.phone})`)
      setShowNewClientDialog(false)
      newClientForm.reset()
      if (onClientAdded) {
        onClientAdded()
      }
    } catch (error) {
      console.error('Error adding client:', error)
    } finally {
      setIsAddingClient(false)
    }
  }

  const handleClientSelect = (client: Client) => {
    form.setValue('clientId', client.id)
    setClientSearchValue(`${client.firstName} ${client.lastName} (${client.phone})`)
    setShowDropdown(false)
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Client Autocomplete with Add New Button */}
          <FormField
            control={form.control}
            name="clientId"
            render={() => (
              <FormItem>
                <FormLabel>Klient</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1" ref={dropdownRef}>
                    <FormControl>
                      <Input
                        ref={inputRef}
                        placeholder="Wpisz min. 3 znaki aby wyszukać..."
                        value={clientSearchValue}
                        onChange={(e) => {
                          setClientSearchValue(e.target.value)
                          setShowDropdown(e.target.value.length >= 3)
                          if (e.target.value.length < 3) {
                            form.setValue('clientId', '')
                          }
                        }}
                        onFocus={() => {
                          if (clientSearchValue.length >= 3) {
                            setShowDropdown(true)
                          }
                        }}
                      />
                    </FormControl>
                    {/* Dropdown */}
                    {showDropdown && filteredClients.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="px-3 py-2 cursor-pointer hover:bg-neutral-100"
                            onClick={() => handleClientSelect(client)}
                          >
                            {client.firstName} {client.lastName} ({client.phone})
                          </div>
                        ))}
                      </div>
                    )}
                    {showDropdown && clientSearchValue.length >= 3 && filteredClients.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                        <div className="px-3 py-2 text-sm text-neutral-500 text-center">
                          Nie znaleziono klienta
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewClientDialog(true)}
                    title="Dodaj nowego klienta"
                    aria-label="Dodaj nowego klienta"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Picker with auto-close */}
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
                    className="w-auto p-0 bg-white" 
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
              {isSubmitting ? 'Dodawanie...' : 'Dodaj do kolejki'}
            </Button>
          </div>
        </form>
      </Form>

      {/* New Client Dialog with better spacing */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-md" style={{ zIndex: 10000 }}>
          <DialogHeader>
            <DialogTitle>Dodaj nowego klienta</DialogTitle>
            <DialogDescription>
              Wypełnij dane klienta, który zostanie automatycznie wybrany po dodaniu
            </DialogDescription>
          </DialogHeader>
          <Form {...newClientForm}>
            <form onSubmit={newClientForm.handleSubmit(handleAddNewClient)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newClientForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imię</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newClientForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwisko</FormLabel>
                      <FormControl>
                        <Input placeholder="Kowalski" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={newClientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+48 123 456 789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newClientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-muted-foreground text-xs">(opcjonalnie)</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jan.kowalski@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewClientDialog(false)}
                  disabled={isAddingClient}
                >
                  Anuluj
                </Button>
                <Button type="submit" disabled={isAddingClient}>
                  {isAddingClient ? 'Dodawanie...' : 'Dodaj klienta'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
