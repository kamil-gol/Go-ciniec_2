'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Loader2, AlertCircle, Save, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useClient, useUpdateClient, useClients, normalizePhone, checkPhoneDuplicate } from '@/lib/api/clients'
import { CreateClientInput } from '@/types'
import { toast } from 'sonner'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { data: client, isLoading } = useClient(clientId)
  const { data: allClients = [] } = useClients() // For phone validation
  const updateClient = useUpdateClient()

  const [formData, setFormData] = useState<Partial<CreateClientInput>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  const [phoneWarning, setPhoneWarning] = useState<{
    exists: boolean
    client?: any
  } | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  // Populate form when client data loads
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || '',
        phone: client.phone,
        address: client.address || '',
        notes: client.notes || '',
      })
    }
  }, [client])

  // Real-time phone validation
  useEffect(() => {
    if (!formData.phone || formData.phone.length < 9) {
      setPhoneWarning(null)
      return
    }

    const duplicate = checkPhoneDuplicate(formData.phone, allClients, clientId)
    
    if (duplicate) {
      setPhoneWarning({ exists: true, client: duplicate })
    } else {
      setPhoneWarning(null)
    }
  }, [formData.phone, allClients, clientId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Block if phone duplicate
    if (phoneWarning?.exists) {
      toast.error('Numer telefonu już istnieje w bazie!')
      return
    }

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Proszę wypełnić wszystkie wymagane pola!')
      return
    }

    setIsSaving(true)

    try {
      await updateClient.mutateAsync({
        id: clientId,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone,
          address: formData.address || undefined,
          notes: formData.notes || undefined,
        },
      })

      router.push(`/dashboard/clients/${clientId}`)
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Ładowanie danych klienta...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            Klient nie został znaleziony
          </h3>
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Powrót do listy klientów
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Powrót
          </button>

          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Edycja klienta
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {client.firstName} {client.lastName}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-8 shadow-soft border border-neutral-200 dark:border-neutral-700 space-y-6"
        >
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Imię <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Jan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Nazwisko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Kowalski"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="jan.kowalski@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Telefon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 rounded-lg border text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 transition-all ${
                phoneWarning?.exists
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 focus:ring-red-500'
                  : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 focus:ring-primary-500 focus:border-transparent'
              }`}
              placeholder="+48 123 456 789"
            />

            {/* Phone Warning */}
            {phoneWarning?.exists && phoneWarning.client && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                      Numer telefonu już istnieje
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Klient: <strong>{phoneWarning.client.firstName} {phoneWarning.client.lastName}</strong>
                      {phoneWarning.client.email && (
                        <>
                          <br />
                          Email: <a href={`mailto:${phoneWarning.client.email}`} className="underline">{phoneWarning.client.email}</a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Adres
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="ul. Przykładowa 123, 00-000 Warszawa"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Notatki
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Dodatkowe informacje o kliencie..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSaving || phoneWarning?.exists}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all ${
                isSaving || phoneWarning?.exists
                  ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-medium hover:scale-105 active:scale-95'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Zapisz zmiany
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  )
}
