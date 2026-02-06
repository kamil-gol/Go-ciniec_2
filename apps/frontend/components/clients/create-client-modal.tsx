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
import { User, Mail, Phone } from 'lucide-react'

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
      const response = await apiClient.post('/clients', data)
      const newClient = response.data.data || response.data
      
      toast.success('Klient dodany pomyślnie!')
      reset()
      onSuccess(newClient)
      onClose()
    } catch (error: any) {
      console.error('Error creating client:', error)
      toast.error(error.response?.data?.error || 'Błąd podczas dodawania klienta')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowego klienta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-secondary-500" />
                <Input
                  label="Imię"
                  placeholder="Jan"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-secondary-500" />
                <Input
                  label="Nazwisko"
                  placeholder="Kowalski"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-secondary-500" />
              <Input
                type="email"
                label="Email"
                placeholder="jan.kowalski@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-secondary-500" />
              <Input
                type="tel"
                label="Telefon"
                placeholder="+48 123 456 789"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Dodawanie...' : 'Dodaj klienta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
