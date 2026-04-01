'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { motionTokens } from '@/lib/design-tokens'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { User, Building2 } from 'lucide-react'

const clientSchema = z.object({
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']),
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  phone: z.string().min(9, 'Numer telefonu powinien mieć co najmniej 9 cyfr'),
  companyName: z.string().optional(),
  nip: z.string().optional(),
}).refine((data) => {
  if (data.clientType === 'COMPANY') {
    return data.companyName && data.companyName.trim().length >= 2
  }
  return true
}, {
  message: 'Nazwa firmy jest wymagana (min. 2 znaki)',
  path: ['companyName'],
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: {
      clientType: 'INDIVIDUAL',
    },
  })

  const clientType = watch('clientType')
  const isCompany = clientType === 'COMPANY'

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)
    try {
      const cleanedData: Record<string, any> = {
        clientType: data.clientType,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone.replace(/\s+/g, ''),
        email: data.email && data.email.trim() !== '' ? data.email : undefined,
      }

      if (data.clientType === 'COMPANY') {
        cleanedData.companyName = data.companyName?.trim()
        if (data.nip && data.nip.trim()) {
          cleanedData.nip = data.nip.replace(/[\s-]/g, '')
        }
      }

      const response = await apiClient.post('/clients', cleanedData)

      if (response.data.success) {
        const newClient = response.data.data
        toast.success(
          isCompany
            ? `Firma "${newClient.companyName}" dodana pomyślnie!`
            : 'Klient dodany pomyślnie!'
        )
        reset()
        onSuccess(newClient)
        onClose()
      } else {
        throw new Error(response.data.error || 'Nieznany błąd')
      }
    } catch (error: any) {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isCompany ? 'Dodaj nową firmę' : 'Dodaj nowego klienta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">

          {/* ═══ Client Type Toggle ═══ */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('clientType', 'INDIVIDUAL')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                !isCompany
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <User className="w-4 h-4" />
              Osoba prywatna
            </button>
            <button
              type="button"
              onClick={() => setValue('clientType', 'COMPANY')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                isCompany
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Firma
            </button>
          </div>

          {/* ═══ Company Fields (animated) ═══ */}
          <AnimatePresence mode="wait">
            {isCompany && (
              <motion.div
                key="company-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: motionTokens.duration.fast }}
                className="overflow-hidden"
              >
                <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Dane firmy</p>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nazwa firmy *</Label>
                    <Input
                      id="companyName"
                      placeholder="np. Budimex S.A."
                      disabled={loading}
                      {...register('companyName')}
                    />
                    {errors.companyName?.message && (
                      <p className="text-sm text-destructive">{errors.companyName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP (opcjonalnie)</Label>
                    <Input
                      id="nip"
                      placeholder="np. 123-456-78-90"
                      disabled={loading}
                      {...register('nip')}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ Person Fields ═══ */}
          <div>
            {isCompany && (
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider mb-2">Osoba reprezentująca</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  placeholder="Jan"
                  disabled={loading}
                  {...register('firstName')}
                />
                {errors.firstName?.message && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  placeholder="Kowalski"
                  disabled={loading}
                  {...register('lastName')}
                />
                {errors.lastName?.message && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+48 123 456 789"
              disabled={loading}
              {...register('phone')}
            />
            {errors.phone?.message && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (opcjonalnie)</Label>
            <Input
              id="email"
              type="email"
              placeholder="jan.kowalski@example.com"
              disabled={loading}
              {...register('email')}
            />
            {errors.email?.message && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

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
              {loading
                ? 'Dodawanie...'
                : isCompany
                  ? 'Dodaj firmę'
                  : 'Dodaj klienta'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
