'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

const clientSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  email: z.string().email('Nieprawidłowy adres email'),
  phone: z.string().min(9, 'Numer telefonu powinien mieć co najmniej 9 cyfr'),
})

type ClientFormData = z.infer<typeof clientSchema>

interface CreateClientModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (client: any) => void
}

export function CreateClientModal({ open, onClose, onSuccess }: CreateClientModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  })

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)
    try {
      console.log('Sending client data:', data)
      const response = await apiClient.post('/clients', data)
      console.log('Response:', response.data)
      const newClient = response.data.data || response.data
      
      toast.success('Klient dodany pomyślnie!')
      reset()
      onSuccess(newClient)
      onClose()
    } catch (error: any) {
      console.error('Error creating client:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Błąd podczas dodawania klienta')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Dodaj nowego klienta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Imię"
              placeholder="Jan"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Nazwisko"
              placeholder="Kowalski"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            type="email"
            label="Email"
            placeholder="jan.kowalski@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            type="tel"
            label="Telefon"
            placeholder="+48 123 456 789"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
              {loading ? 'Dodawanie...' : 'Dodaj klienta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
