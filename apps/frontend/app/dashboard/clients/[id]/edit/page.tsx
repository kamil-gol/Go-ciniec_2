'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Save, User, Mail, Phone, FileText, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useClient, useUpdateClient } from '@/lib/api/clients'
import { useToast } from '@/hooks/use-toast'
import { CreateClientInput } from '@/types'
import Link from 'next/link'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.id as string

  const { data: client, isLoading, error } = useClient(clientId)
  const updateClient = useUpdateClient()

  const [formData, setFormData] = useState<CreateClientInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
      })
    }
  }, [client])

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
      await updateClient.mutateAsync({
        id: clientId,
        data: formData,
      })
      toast({
        title: 'Sukces',
        description: 'Dane klienta zostały zaktualizowane',
      })
      router.push(`/dashboard/clients/${clientId}`)
    } catch (error: any) {
      console.error('Error updating client:', error)
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się zaktualizować danych klienta',
        variant: 'destructive',
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="border-0 shadow-xl max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Błąd ładowania</h3>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'Klient nie został znaleziony'}
            </p>
            <Link href="/dashboard/clients">
              <Button variant="outline" size="lg">Powrót do listy klientów</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        {/* Premium Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-pink-600 to-rose-600 p-8 text-white shadow-2xl">
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
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Edytuj klienta</h1>
                <p className="text-white/90 text-lg mt-1">
                  {client.firstName} {client.lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <Card className="border-0 shadow-xl">
            <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-rose-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Dane osobowe</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
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

                {/* Last Name */}
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
                {/* Email */}
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

                {/* Phone */}
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
              className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-600 via-pink-600 to-rose-600 hover:from-orange-700 hover:via-pink-700 hover:to-rose-700 shadow-xl"
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
