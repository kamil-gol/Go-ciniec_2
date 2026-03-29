'use client'

import { useState, useMemo } from 'react'
import { Users, Search, UserPlus, Building2, User, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { PageHero, StatCard, LoadingState } from '@/components/shared'
import { FilterTabs } from '@/components/shared/FilterTabs'
import { ClientsList } from '@/components/clients/clients-list'
import { CreateClientForm } from '@/components/clients/create-client-form'
import { clientsApi, clientsKeys } from '@/lib/api/clients'
import { useQuery } from '@tanstack/react-query'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

const accent = moduleAccents.clients

type ClientFilter = 'ALL' | 'INDIVIDUAL' | 'COMPANY'

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState<ClientFilter>('ALL')
  const [showDeleted, setShowDeleted] = useState(false)

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: clientsKeys.list({ search: searchQuery, includeDeleted: showDeleted }),
    queryFn: () => clientsApi.getAll({ search: searchQuery, includeDeleted: showDeleted }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const filteredClients = useMemo(() => {
    if (activeTab === 'ALL') return clients
    return clients.filter(c => (c.clientType || 'INDIVIDUAL') === activeTab)
  }, [clients, activeTab])

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
    <div className="container mx-auto py-6 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8">
      <Breadcrumb />
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Klienci"
        subtitle="Zarządzaj bazą klientów"
        icon={Users}
        action={
          <Button
            size="lg"
            className="bg-white text-violet-600 hover:bg-white/90 shadow-xl"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? (
              <><Search className="mr-2 h-5 w-5" /> Pokaż listę</>
            ) : (
              <><UserPlus className="mr-2 h-5 w-5" /> Dodaj klienta</>
            )}
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className={layout.statGrid}>
        <StatCard label="Wszyscy" value={stats.all} icon={Users} iconGradient={statGradients.count} />
        <StatCard label="Osoby prywatne" value={stats.individuals} icon={User} iconGradient={statGradients.count} />
        <StatCard label="Firmy" value={stats.companies} icon={Building2} iconGradient={statGradients.count} />
        <StatCard label="Rezerwacje" value={stats.totalReservations} icon={TrendingUp} iconGradient={statGradients.count} />
      </div>

      {showCreateForm ? (
        <Card className="overflow-hidden">
          <div className={cn('bg-gradient-to-br p-4 sm:p-8', accent.gradientSubtle)}>
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
                  className="pl-12 h-12 text-base rounded-xl"
                />
              </div>
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                onClick={() => setShowDeleted(!showDeleted)}
                className={cn(
                  'h-12 px-4 rounded-xl shrink-0',
                  showDeleted
                    ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50'
                    : ''
                )}
              >
                {showDeleted ? (
                  <><EyeOff className="mr-2 h-4 w-4" /> Ukryj usuniętych</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" /> Pokaż usuniętych</>
                )}
              </Button>
            </div>

            <FilterTabs
              tabs={[
                { key: 'ALL', label: 'Wszyscy', count: stats.all },
                { key: 'INDIVIDUAL', label: 'Osoby prywatne', count: stats.individuals },
                { key: 'COMPANY', label: 'Firmy', count: stats.companies },
              ]}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as ClientFilter)}
            />
          </div>

          {/* Client List */}
          {isLoading ? (
            <LoadingState variant="skeleton" rows={5} message="Wczytywanie klientów..." />
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
  )
}
