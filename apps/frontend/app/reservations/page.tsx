'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { Plus, Calendar } from 'lucide-react'

export default function ReservationsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-primary-600" />
                Rezerwacje
              </h1>
              <p className="text-secondary-600 mt-1">
                Zarządzaj rezerwacjami sal weselnych i okolicznościowych
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nowa Rezerwacja
            </Button>
          </div>
        </motion.div>

        {/* Create Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <CreateReservationForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </motion.div>
        )}

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Rezerwacji</CardTitle>
          </CardHeader>
          <CardContent>
            <ReservationsList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
