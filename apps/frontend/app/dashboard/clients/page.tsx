'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Users, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
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
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" />
            Nowy Klient
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
        >
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 mb-6">
            <Users className="h-10 w-10 text-primary-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            Moduł Klientów ✨
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
            System zarządzania klientami w przygotowaniu. Funkcje:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-2">✅ Baza danych klientów</li>
            <li className="flex items-center gap-2">✅ Historia rezerwacji</li>
            <li className="flex items-center gap-2">✅ Dane kontaktowe</li>
            <li className="flex items-center gap-2">✅ Notatki i preferencje</li>
          </ul>
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-100 dark:bg-secondary-900/30 px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-400">
              ✨ Nowy moduł - Sprint 3
            </span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
