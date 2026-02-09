'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, CheckCircle2, Clock, AlertCircle, Users, DollarSign, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { getReservations } from '@/lib/api/reservations'
import { useToast } from '@/hooks/use-toast'

export default function ReservationsPage() {
  const { toast } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const data = await getReservations()
      setReservations(data)
    } catch (error: any) {
      console.error('Error loading reservations:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować rezerwacji',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    pending: reservations.filter(r => r.status === 'PENDING').length,
    thisMonth: reservations.filter(r => {
      const date = r.startDateTime ? new Date(r.startDateTime) : r.date ? new Date(r.date) : null
      if (!date) return false
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Rezerwacje</h1>
                    <p className="text-white/90 text-lg mt-1">Zarządzaj rezerwacjami sal weselnych</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nowa Rezerwacja
              </Button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Reservations */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Wszystkie</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Łącznie rezerwacji</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmed */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Potwierdzone</p>
                  <p className="text-3xl font-bold">{stats.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Aktywne rezerwacje</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Oczekujące</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Do potwierdzenia</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Ten miesiąc</p>
                  <p className="text-3xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs text-muted-foreground">Wydarzeń w tym miesiącu</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="border-0 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Nowa Rezerwacja</h2>
              </div>
              <CreateReservationForm
                onSuccess={() => {
                  setShowCreateForm(false)
                  loadReservations()
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </Card>
        )}

        {/* Reservations List */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Lista Rezerwacji</CardTitle>
              </div>
              
              {/* Search */}
              <div className="relative w-96">
                <Input
                  placeholder="Szukaj rezerwacji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-4 text-base border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Ładowanie rezerwacji...</p>
                </div>
              </div>
            ) : (
              <ReservationsList 
                reservations={reservations}
                searchQuery={searchQuery}
                onUpdate={loadReservations}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
