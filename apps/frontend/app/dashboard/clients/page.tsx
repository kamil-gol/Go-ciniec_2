'use client'

import { useState, useMemo } from 'react'
import { Users, Plus, Search, UserPlus, Building2, User, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { ClientsList } from '@/components/clients/clients-list'
import { CreateClientForm } from '@/components/clients/create-client-form'
import { clientsApi, clientsKeys } from '@/lib/api/clients'
import { useQuery } from '@tanstack/react-query'
import type { ClientType } from '@/types'

const accent = moduleAccents.clients

type FilterTab = 'ALL' | 'INDIVIDUAL' | 'COMPANY'

const FILTER_TABS: { value: FilterTab; label: string; icon: any }[] = [
  { value: 'ALL', label: 'Wszyscy', icon: Users },
  { value: 'INDIVIDUAL', label: 'Osoby prywatne', icon: User },
  { value: 'COMPANY', label: 'Firmy', icon: Building2 },
]

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [showDeleted, setShowDeleted] = useState(false)

  // Use direct query to support includeDeleted param
  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: clientsKeys.list({ search: searchQuery, includeDeleted: showDeleted }),
    queryFn: () => clientsApi.getAll({ search: searchQuery, includeDeleted: showDeleted }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  // Filter clients by tab
  const filteredClients = useMemo(() => {
    if (activeTab === 'ALL') return clients
    return clients.filter(c => (c.clientType || 'INDIVIDUAL') === activeTab)
  }, [clients, activeTab])

  // Stats
  const stats = useMemo(() => {
    const all = clients.length
    const companies = clients.filter(c => c.clientType === 'COMPANY').length
    const individuals = all - companies
    const totalReservations = clients.reduce((sum, c) => sum + ((c as any)._count?.reservations || 0), 0)
    return { all, companies, individuals, totalReservations }
  }, [clients])

  const handleClientCreated = () => {
    setShowCreateForm(false)
    refetch()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Hero Header */}
        <div className={cn(
          'relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl bg-gradient-to-r',
          accent.gradient
        )}>
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Klienci</h1>
                  <p className="text-white/80 text-lg">Zarządzaj bazą klientów</p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 h-14 text-lg px-8"
            >
              {showCreateForm ? (
                <><Search className="mr-2 h-5 w-5" /> Pokaż listę</>
              ) : (
                <><UserPlus className="mr-2 h-5 w-5" /> Dodaj klienta</>
              )}
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wszyscy</p>
                  <p className="text-3xl font-bold">{stats.all}</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Osoby</p>
                  <p className="text-3xl font-bold">{stats.individuals}</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Firmy</p>
                  <p className="text-3xl font-bold">{stats.companies}</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rezerwacje</p>
                  <p className="text-3xl font-bold">{stats.totalReservations}</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm ? (
          <Card className="border-0 shadow-xl">
            <div className="p-6 md:p-8">
              <CreateClientForm
                onSuccess={handleClientCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </Card>
        ) : (
          <>
            {/* Search + Filter Tabs */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Szukaj po imieniu, nazwisku, firmie, telefonie, NIP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg rounded-2xl border-2 focus-visible:ring-2 focus-visible:ring-violet-500"
                  />
                </div>
                {/* Show Deleted Toggle */}
                <Button
                  variant={showDeleted ? 'default' : 'outline'}
                  onClick={() => setShowDeleted(!showDeleted)}
                  className={cn(
                    'h-14 px-5 rounded-2xl border-2 font-semibold transition-all shrink-0',
                    showDeleted
                      ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'
                  )}
                >
                  {showDeleted ? (
                    <><EyeOff className="mr-2 h-4 w-4" /> Ukryj usuniętych</>
                  ) : (
                    <><Eye className="mr-2 h-4 w-4" /> Pokaż usuniętych</>
                  )}
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
                {FILTER_TABS.map(tab => {
                  const Icon = tab.icon
                  const count = tab.value === 'ALL' 
                    ? stats.all 
                    : tab.value === 'COMPANY' 
                      ? stats.companies 
                      : stats.individuals
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.value
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.value
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Client List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Wczytywanie klientów...</p>
                </div>
              </div>
            ) : (
              <ClientsList
                clients={filteredClients}
                searchQuery={searchQuery}
                onUpdate={() => refetch()}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
