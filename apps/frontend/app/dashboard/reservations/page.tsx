'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { Plus, Calendar } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function ReservationsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Premium Styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-glow">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              Rezerwacje
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Zarządzaj rezerwacjami sal weselnych i okolicznościowych
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Nowa Rezerwacja
          </Button>
        </motion.div>

        {/* Create Form - Premium Card */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-medium border border-neutral-200 dark:border-neutral-700">
              <CreateReservationForm
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </motion.div>
        )}

        {/* Reservations List - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700 shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="border-b border-neutral-200 dark:border-neutral-700">
              <CardTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Lista Rezerwacji
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ReservationsList />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
