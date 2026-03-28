'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Save, User, Building2, Mail, Phone, FileText, AlertCircle, Globe, MapPin, Briefcase, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useClient, useUpdateClient } from '@/lib/api/clients'
import type { ClientType } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { data: client, isLoading, error } = useClient(clientId)
  const updateClient = useUpdateClient()

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

  useEffect(() => {
    if (client) {
      setClientType(client.clientType || 'INDIVIDUAL')
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
        companyName: client.companyName || '',
        nip: client.nip || '',
        regon: client.regon || '',
        industry: client.industry || '',
        website: client.website || '',
        companyAddress: client.companyAddress || '',
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Wypełnij wszystkie wymagane pola')
      return
    }

    if (isCompany && !formData.companyName) {
      toast.error('Podaj nazwę firmy')
      return
    }

    try {
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
        payload.nip = formData.nip || undefined
        payload.regon = formData.regon || undefined
        payload.industry = formData.industry || undefined
        payload.website = formData.website || undefined
        payload.companyAddress = formData.companyAddress || undefined
      } else {
        // Clear company fields when switching to INDIVIDUAL
        payload.companyName = null
        payload.nip = null
        payload.regon = null
        payload.industry = null
        payload.website = null
        payload.companyAddress = null
      }

      await updateClient.mutateAsync({
        id: clientId,
        data: payload,
      })
      toast.success(isCompany ? 'Dane firmy zostały zaktualizowane' : 'Dane klienta zostały zaktualizowane',)
      router.push(`/dashboard/clients/${clientId}`)
    } catch (error: any) {
      console.error('Error updating client:', error)
      toast.error(error.message || 'Nie udało się zaktualizować danych klienta')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <LoadingState message="Wczytywanie klienta..." />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <ErrorState
            variant="card"
            title="Błąd ładowania"
            message={error instanceof Error ? error.message : 'Klient nie został znaleziony'}
          />
          <div className="text-center mt-4">
            <Link href="/dashboard/clients">
              <Button variant="outline" size="lg">Powrót do listy klientów</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        {/* Premium Hero */}
        <div className={`relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl bg-gradient-to-r ${
          isCompany
            ? 'from-purple-600 via-indigo-600 to-blue-600'
            : 'from-orange-600 via-pink-600 to-rose-600'
        }`}>
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-4">
            <Link href={`/dashboard/clients/${clientId}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do szczegółów
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                {isCompany ? <Building2 className="h-8 w-8" /> : <User className="h-8 w-8" />}
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  {isCompany ? 'Edytuj firmę' : 'Edytuj klienta'}
                </h1>
                <p className="text-white/90 text-lg mt-1">
                  {isCompany && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Type Toggle */}
          <Card className="border-0 shadow-xl">
            <div className="p-8">
              <Label className="text-lg font-bold mb-4 block">Typ klienta</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setClientType('INDIVIDUAL')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 font-semibold text-lg transition-all ${
                    clientType === 'INDIVIDUAL'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-500'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <User className="h-6 w-6" />
                  Osoba prywatna
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('COMPANY')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 font-semibold text-lg transition-all ${
                    clientType === 'COMPANY'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-500'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <Building2 className="h-6 w-6" />
                  Firma
                </button>
              </div>
            </div>
          </Card>

          {/* Company Info - only for COMPANY */}
          {isCompany && (
            <Card className="border-0 shadow-xl">
              <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Dane firmy</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base font-semibold">
                      Nazwa firmy <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="np. Budimex S.A."
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      NIP
                    </Label>
                    <Input
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      placeholder="1234567890"
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      REGON
                    </Label>
                    <Input
                      name="regon"
                      value={formData.regon}
                      onChange={handleChange}
                      placeholder="123456789"
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Branża
                    </Label>
                    <Input
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="np. Budownictwo"
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Strona www
                    </Label>
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.firma.pl"
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adres firmy
                    </Label>
                    <Input
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      placeholder="ul. Przykładowa 1, 00-001 Warszawa"
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Personal Info */}
          <Card className="border-0 shadow-xl">
            <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-rose-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">
                  {isCompany ? 'Osoba reprezentująca' : 'Dane osobowe'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Imię <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jan"
                    required
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Nazwisko <span className="text-red-500">*</span>
                  </Label>
                  <Input
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
          </Card>

          {/* Contact Info */}
          <Card className="border-0 shadow-xl">
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Dane kontaktowe</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jan.kowalski@example.com"
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+48 123 456 789"
                    required
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="border-0 shadow-xl">
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Notatki</h2>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Dodatkowe informacje</Label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Dodatkowe informacje o kliencie..."
                  rows={6}
                  className="text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/dashboard/clients/${clientId}`} className="flex-1">
              <Button type="button" variant="outline" size="lg" className="w-full h-14 text-lg">
                Anuluj
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateClient.isPending}
              size="lg"
              className={`flex-1 h-14 text-lg shadow-xl bg-gradient-to-r ${
                isCompany
                  ? 'from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700'
                  : 'from-orange-600 via-pink-600 to-rose-600 hover:from-orange-700 hover:via-pink-700 hover:to-rose-700'
              }`}
            >
              <Save className="mr-2 h-5 w-5" />
              {updateClient.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
