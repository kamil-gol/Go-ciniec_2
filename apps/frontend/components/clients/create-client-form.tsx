'use client'

import { useState } from 'react'
import { User, Building2, Mail, Phone, FileText, Save, X, Globe, MapPin, Briefcase, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/api/clients'
import type { ClientType } from '@/types'

interface CreateClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clientType, setClientType] = useState<ClientType>('INDIVIDUAL')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    companyName: '',
    nip: '',
    regon: '',
    industry: '',
    website: '',
    companyAddress: '',
  })

  const isCompany = clientType === 'COMPANY'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: 'B\u0142\u0105d walidacji',
        description: 'Wype\u0142nij wszystkie wymagane pola',
        variant: 'destructive',
      })
      return
    }

    if (isCompany && !formData.companyName) {
      toast({
        title: 'B\u0142\u0105d walidacji',
        description: 'Podaj nazw\u0119 firmy',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone,
        notes: formData.notes || undefined,
        clientType,
      }

      if (isCompany) {
        payload.companyName = formData.companyName
        if (formData.nip) payload.nip = formData.nip
        if (formData.regon) payload.regon = formData.regon
        if (formData.industry) payload.industry = formData.industry
        if (formData.website) payload.website = formData.website
        if (formData.companyAddress) payload.companyAddress = formData.companyAddress
      }

      await createClient(payload)
      toast({
        title: 'Sukces',
        description: isCompany ? 'Firma zosta\u0142a dodana' : 'Klient zosta\u0142 dodany',
      })
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: '',
        companyName: '',
        nip: '',
        regon: '',
        industry: '',
        website: '',
        companyAddress: '',
      })
      setClientType('INDIVIDUAL')
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating client:', error)
      toast({
        title: 'B\u0142\u0105d',
        description: error.message || 'Nie uda\u0142o si\u0119 doda\u0107 klienta',
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
      {/* Client Type Toggle */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Typ klienta</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setClientType('INDIVIDUAL')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
              clientType === 'INDIVIDUAL'
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <User className="h-5 w-5" />
            Osoba prywatna
          </button>
          <button
            type="button"
            onClick={() => setClientType('COMPANY')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
              clientType === 'COMPANY'
                ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Building2 className="h-5 w-5" />
            Firma
          </button>
        </div>
      </div>

      {/* Company Info - only for COMPANY */}
      {isCompany && (
        <div className="space-y-4 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20">
          <div className="flex items-center gap-2 text-lg font-semibold text-purple-700 dark:text-purple-400">
            <Building2 className="h-5 w-5" />
            <span>Dane firmy</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyName" className="text-base font-semibold">
                Nazwa firmy <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="np. Budimex S.A."
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip" className="text-base font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4" />
                NIP
              </Label>
              <Input
                id="nip"
                name="nip"
                value={formData.nip}
                onChange={handleChange}
                placeholder="1234567890"
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regon" className="text-base font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4" />
                REGON
              </Label>
              <Input
                id="regon"
                name="regon"
                value={formData.regon}
                onChange={handleChange}
                placeholder="123456789"
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Bran\u017ca
              </Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="np. Budownictwo"
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Strona www
              </Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.firma.pl"
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyAddress" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adres firmy
              </Label>
              <Input
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                placeholder="ul. Przyk\u0142adowa 1, 00-001 Warszawa"
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Personal Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-orange-600" />
          <span>{isCompany ? 'Osoba reprezentuj\u0105ca' : 'Dane osobowe'}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-semibold">
              Imi\u0119 <span className="text-red-500">*</span>
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
          {loading ? 'Dodawanie...' : isCompany ? 'Dodaj firm\u0119' : 'Dodaj klienta'}
        </Button>
      </div>
    </form>
  )
}
