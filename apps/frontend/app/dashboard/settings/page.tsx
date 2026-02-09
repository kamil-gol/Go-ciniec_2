'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Settings className="h-8 w-8 text-neutral-500" />
            Ustawienia
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Konfiguracja systemu i preferencje
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
        >
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 mb-6">
            <Settings className="h-10 w-10 text-neutral-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            Moduł Ustawień ✨
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
            Panel ustawień w przygotowaniu. Funkcje:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-2">✅ Dane firmy</li>
            <li className="flex items-center gap-2">✅ Użytkownicy i uprawnienia</li>
            <li className="flex items-center gap-2">✅ Powiadomienia email/SMS</li>
            <li className="flex items-center gap-2">✅ Integracje zewnętrzne</li>
          </ul>
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-400">
              ✨ Nowy moduł - Sprint 6
            </span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
