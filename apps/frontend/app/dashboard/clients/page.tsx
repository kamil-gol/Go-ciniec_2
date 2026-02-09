'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Users, Plus, Search, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import ClientCard from '@/components/clients/client-card'
import ClientStats from '@/components/clients/client-stats'
import { useClients, useDeleteClient } from '@/lib/api/clients'

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Debounced search (300ms delay)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Use effect for debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch clients with search
  const { data: clients = [], isLoading, error, refetch } = useClients(debouncedSearch)
  const deleteClient = useDeleteClient()

  // TODO: Replace with actual auth check when implemented
  // For now, allow delete for all users (will be restricted to ADMIN later)
  const canDelete = true

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleCreateSuccess = () => {
    refetch()
  }

  // Empty states
  const hasClients = clients && clients.length > 0
  const hasSearchTerm = searchTerm.trim().length > 0
  const noResults = !isLoading && hasSearchTerm && !hasClients
  const isEmpty = !isLoading && !hasSearchTerm && !hasClients

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary-500" />
              Klienci
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Baza klientów i historia współpracy
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Nowy Klient
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ClientStats clients={clients} isLoading={isLoading} />
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Szukaj po imieniu, nazwisku, email lub telefonie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              ×
            </button>
          )}
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Ładowanie klientów...
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-8 text-center border border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
              Błąd ładowania klientów
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error instanceof Error ? error.message : 'Nieznany błąd'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </motion.div>
        )}

        {/* Empty State - No Clients */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 mb-6">
              <Users className="h-10 w-10 text-primary-500" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Brak klientów
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
              Dodaj pierwszego klienta, aby rozpocząć zarządzanie bazą kontaktów.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Dodaj pierwszego klienta
            </button>
          </motion.div>
        )}

        {/* Empty State - No Search Results */}
        {noResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700 mb-6">
              <Search className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Brak wyników
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
              Nie znaleziono klientów pasujących do: <strong>"{searchTerm}"</strong>
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Wyczyść wyszukiwanie
            </button>
          </motion.div>
        )}

        {/* Clients Grid */}
        {hasClients && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onDelete={handleDeleteClient}
                    canDelete={canDelete}
                  />
                ))
              </div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Create Client Modal */}
      <CreateClientModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </DashboardLayout>
  )
}
