'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useClient, useUpdateClient } from '@/lib/api/clients'
import { CreateClientInput } from '@/types'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { data: client, isLoading, error } = useClient(clientId)
  const updateClient = useUpdateClient()

  const [formData, setFormData] = useState<CreateClientInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  // Populate form when client data loads
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateClient.mutateAsync({
        id: clientId,
        data: formData,
      })
      router.push(`/dashboard/clients/${clientId}`)
    } catch (error) {
      console.error('Error updating client:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            Błąd ładowania klienta
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error instanceof Error ? error.message : 'Klient nie został znaleziony'}
          </p>
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
            Edytuj klienta
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {client.firstName} {client.lastName}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Kowalski"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="jan.kowalski@example.com"
                />
              </div>

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
                  className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+48 123 456 789"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Adres
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Dodatkowe informacje o kliencie..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={updateClient.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateClient.isPending ? (
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
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
