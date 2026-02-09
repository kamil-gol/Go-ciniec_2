'use client'

import { useState } from 'react'
import { User, Mail, Phone, FileText, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/api/clients'

interface CreateClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: 'Błąd walidacji',
        description: 'Wypełnij wszystkie wymagane pola',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await createClient(formData)
      toast({
        title: 'Sukces',
        description: 'Klient został dodany',
      })
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: '',
      })
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating client:', error)
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się dodać klienta',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-orange-600" />
          <span>Dane osobowe</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-semibold">
              Imię <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Jan"
              required
              className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-semibold">
              Nazwisko <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Kowalski"
              required
              className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Phone className="h-5 w-5 text-blue-600" />
          <span>Dane kontaktowe</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jan.kowalski@example.com"
              className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+48 123 456 789"
              required
              className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-purple-600" />
          <span>Notatki</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base font-semibold">
            Dodatkowe informacje
          </Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Dodatkowe informacje o kliencie..."
            rows={4}
            className="text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 text-base"
          >
            <X className="mr-2 h-4 w-4" />
            Anuluj
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 text-base bg-gradient-to-r from-orange-600 via-pink-600 to-rose-600 hover:from-orange-700 hover:via-pink-700 hover:to-rose-700 shadow-lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Dodawanie...' : 'Dodaj klienta'}
        </Button>
      </div>
    </form>
  )
}
