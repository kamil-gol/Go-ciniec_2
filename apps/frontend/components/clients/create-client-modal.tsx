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
      console.log('=== CREATING CLIENT ====')
      console.log('Data to send:', data)
      
      const response = await apiClient.post('/clients', data)
      
      console.log('Raw response:', response)
      console.log('Response data:', response.data)
      console.log('Response status:', response.status)
      
      // Backend returns {success: true, data: {...}, message: "..."}
      if (response.data.success) {
        const newClient = response.data.data
        console.log('New client created:', newClient)
        
        toast.success('Klient dodany pomyślnie!')
        reset()
        onSuccess(newClient)
        onClose()
      } else {
        throw new Error(response.data.error || 'Nieznany błąd')
      }
    } catch (error: any) {
      console.error('=== ERROR CREATING CLIENT ===')
      console.error('Error object:', error)
      console.error('Error response:', error.response)
      console.error('Error response data:', error.response?.data)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Błąd podczas dodawania klienta'
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      reset()
      onClose()
    }
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
              disabled={loading}
              {...register('firstName')}
            />
            <Input
              label="Nazwisko"
              placeholder="Kowalski"
              error={errors.lastName?.message}
              disabled={loading}
              {...register('lastName')}
            />
          </div>

          <Input
            type="email"
            label="Email"
            placeholder="jan.kowalski@example.com"
            error={errors.email?.message}
            disabled={loading}
            {...register('email')}
          />

          <Input
            type="tel"
            label="Telefon"
            placeholder="+48 123 456 789"
            error={errors.phone?.message}
            disabled={loading}
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
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 sm:flex-none"
            >
              {loading ? 'Dodawanie...' : 'Dodaj klienta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
