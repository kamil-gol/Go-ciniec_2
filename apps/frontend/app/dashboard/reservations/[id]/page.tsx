'use client'

import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
            Szczegóły rezerwacji
          </h1>
        </motion.div>

        {/* Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
        >
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 mb-6">
            <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            Strona w budowie
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-2">
            ID rezerwacji: <code className="font-mono text-sm">{reservationId}</code>
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            Ta funkcjonalność zostanie wkrótce dodana.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
