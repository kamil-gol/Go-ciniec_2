'use client'

import { Theater, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EventTypesPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Theater className="h-8 w-8 text-secondary-500" />
            Typy Wydarzeń
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Konfiguruj rodzaje imprez i ich parametry
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 px-6 py-3 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95">
          <Plus className="h-5 w-5" />
          Nowy Typ
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white dark:bg-neutral-800 p-12 shadow-soft border border-neutral-200 dark:border-neutral-700 text-center"
      >
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900/30 dark:to-secondary-800/30 mb-6">
          <Theater className="h-10 w-10 text-secondary-500" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Moduł Typów Wydarzeń ✨
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
          System typów wydarzeń w przygotowaniu. Funkcje:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-neutral-600 dark:text-neutral-400">
          <li className="flex items-center gap-2">✅ Wesela, Komunie, Urodziny</li>
          <li className="flex items-center gap-2">✅ Pakiety cenowe</li>
          <li className="flex items-center gap-2">✅ Wymagane zaliczki</li>
          <li className="flex items-center gap-2">✅ Szablony dokumentów</li>
        </ul>
        <div className="mt-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-100 dark:bg-secondary-900/30 px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-400">
            ✨ Nowy moduł - Sprint 4
          </span>
        </div>
      </motion.div>
    </div>
  )
}
