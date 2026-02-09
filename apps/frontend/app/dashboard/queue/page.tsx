'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function QueuePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Clock className="h-8 w-8 text-warning-500" />
            Kolejka Rezerwacji
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Rezerwacje oczekujące na potwierdzenie
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
        >
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900/30 dark:to-warning-800/30 mb-6">
            <Clock className="h-10 w-10 text-warning-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            Moduł Kolejki
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
            System kolejki rezerwacji będzie dostępny wkrótce. Tutaj będziesz mógł:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-2">✅ Przeglądać oczekujące rezerwacje</li>
            <li className="flex items-center gap-2">✅ Zatwierdzać lub odrzucać</li>
            <li className="flex items-center gap-2">✅ Priorytetyzować zgłoszenia</li>
            <li className="flex items-center gap-2">✅ Komunikować się z klientami</li>
          </ul>
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-warning-100 dark:bg-warning-900/30 px-4 py-2 text-sm font-medium text-warning-700 dark:text-warning-400">
              ⏳ Sprint 2 - W kolejce
            </span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
