'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, UserCheck, UserPlus, TrendingUp, Mail, Phone, Sparkles, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ClientsList } from '@/components/clients/clients-list'
import { CreateClientForm } from '@/components/clients/create-client-form'
import { getClients } from '@/lib/api/clients'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ClientsPage() {
  const { toast } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await getClients()
      setClients(data)
    } catch (error: any) {
      console.error('Error loading clients:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować klientów',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    total: clients.length,
    withEmail: clients.filter(c => c.email).length,
    withPhone: clients.filter(c => c.phone).length,
    thisMonth: clients.filter(c => {
      const created = new Date(c.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length,
  }

  // Filter clients
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase()
    return (
      client.firstName?.toLowerCase().includes(query) ||
      client.lastName?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Klienci</h1>
                    <p className="text-white/90 text-lg mt-1">Zarządzaj bazą klientów</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Dodaj Klienta
              </Button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Clients */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Wszyscy</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Łącznie klientów</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* With Email */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Z emailem</p>
                  <p className="text-3xl font-bold">{stats.withEmail}</p>
                  <p className="text-xs text-muted-foreground">Dane kontaktowe</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* With Phone */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Z telefonem</p>
                  <p className="text-3xl font-bold">{stats.withPhone}</p>
                  <p className="text-xs text-muted-foreground">Numer telefonu</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <Phone className="h-6 w-6 text-white" />
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
                  <p className="text-xs text-muted-foreground">Nowych klientów</p>
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
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Dodaj Nowego Klienta</h2>
              </div>
              <CreateClientForm
                onSuccess={() => {
                  setShowCreateForm(false)
                  loadClients()
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </Card>
        )}

        {/* Clients List */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Lista Klientów</CardTitle>
              </div>
              
              {/* Search */}
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Szukaj klientów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Ładowanie klientów...</p>
                </div>
              </div>
            ) : (
              <ClientsList 
                clients={filteredClients}
                onUpdate={loadClients}
              />
            )}
            {!loading && filteredClients.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">Nie znaleziono klientów</p>
                <p className="text-sm text-muted-foreground mt-1">Spróbuj innych kryteriów wyszukiwania</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
