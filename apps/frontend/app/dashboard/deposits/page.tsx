'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { DollarSign, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DepositsPage() {
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
              <DollarSign className="h-8 w-8 text-success-500" />
              Zaliczki
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Zarządzaj zaliczkami i płatnościami
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-success-500 to-success-600 px-6 py-3 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" />
            Nowa Zaliczka
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
        >
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900/30 dark:to-success-800/30 mb-6">
            <DollarSign className="h-10 w-10 text-success-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            Moduł Zaliczek ✨
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
            System zarządzania zaliczkami w przygotowaniu. Funkcje:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-2">✅ Rejestrowanie wpłat</li>
            <li className="flex items-center gap-2">✅ Historia płatności</li>
            <li className="flex items-center gap-2">✅ Przypomnienia o zaliczkach</li>
            <li className="flex items-center gap-2">✅ Generowanie potwierdzeń</li>
          </ul>
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-success-100 dark:bg-success-900/30 px-4 py-2 text-sm font-medium text-success-700 dark:text-success-400">
              ✨ Nowy moduł - Sprint 4
            </span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
