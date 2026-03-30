'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DepositsList } from '@/components/deposits/deposits-list'
import { CreateDepositForm } from '@/components/deposits/create-deposit-form'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, DepositStats, DepositStatus } from '@/lib/api/deposits'
import { PageLayout, PageHero, StatCard, EmptyState } from '@/components/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterTabs } from '@/components/shared/FilterTabs'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type FilterStatus = 'ALL' | DepositStatus

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [stats, setStats] = useState<DepositStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const accent = moduleAccents.deposits

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [depositsData, statsData] = await Promise.all([
        depositsApi.getAll(),
        depositsApi.getStats(),
      ])
      setDeposits(depositsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading deposits:', error)
      toast.error('Nie udało się załadować zaliczek')
    } finally {
      setLoading(false)
    }
  }

  const filteredDeposits = deposits.filter((deposit) => {
    if (statusFilter !== 'ALL' && deposit.status !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const clientName = deposit.reservation?.client
        ? `${deposit.reservation.client.firstName} ${deposit.reservation.client.lastName}`.toLowerCase()
        : ''
      const hallName = deposit.reservation?.hall?.name?.toLowerCase() || ''
      const eventType = deposit.reservation?.eventType?.name?.toLowerCase() || ''
      // #deposits-fix (5/5): include deposit title in search
      const title = deposit.title?.toLowerCase() || ''
      return (
        clientName.includes(query) ||
        hallName.includes(query) ||
        eventType.includes(query) ||
        deposit.amount.toString().includes(query) ||
        title.includes(query)
      )
    }
    return true
  })

  // #deposits-fix (3/5): "Wszystkie" count must include CANCELLED deposits.
  // stats.counts.total only covers PENDING+PAID+OVERDUE+PARTIALLY_PAID,
  // but the ALL filter shows every deposit including CANCELLED rows.
  const totalAllCount = (stats?.counts.total ?? 0) + (stats?.counts.cancelled ?? 0)

  const filterButtons: { label: string; value: FilterStatus; count?: number }[] = [
    { label: 'Wszystkie', value: 'ALL', count: totalAllCount },
    { label: 'Oczekujące', value: 'PENDING', count: stats?.counts.pending },
    { label: 'Opłacone', value: 'PAID', count: stats?.counts.paid },
    { label: 'Przetermin.', value: 'OVERDUE', count: stats?.counts.overdue },
    { label: 'Anulowane', value: 'CANCELLED', count: stats?.counts.cancelled },
  ]

  const percentPaid = stats && stats.amounts.total > 0
    ? Math.round((stats.amounts.paid / stats.amounts.total) * 100)
    : 0

  return (
    <PageLayout>
      <Breadcrumb />
      <PageHero
        accent={accent}
        title="Zaliczki"
        subtitle="Zarządzaj zaliczkami i płatnościami"
        icon={DollarSign}
        action={
          <Button
            size="lg"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-white text-rose-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowa Zaliczka
          </Button>
        }
      />

      {loading && !stats && (
        <div className={layout.statGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {stats && (
        <div className={layout.statGrid}>
          <StatCard
            label="Oczekujące"
            value={stats.counts.pending}
            subtitle={`${stats.amounts.pending.toLocaleString('pl-PL')} zł do zapłaty`}
            icon={Clock}
            iconGradient={statGradients.alert}
            delay={0.1}
          />
          <StatCard
            label="Opłacone"
            value={stats.counts.paid}
            subtitle={`${stats.amounts.paid.toLocaleString('pl-PL')} zł wpłacono`}
            icon={CheckCircle2}
            iconGradient={statGradients.success}
            delay={0.2}
          />
          <StatCard
            label="Przetermin."
            value={stats.counts.overdue}
            subtitle={`${stats.amounts.overdue.toLocaleString('pl-PL')} zł zaległości`}
            icon={AlertTriangle}
            iconGradient={statGradients.alert}
            delay={0.3}
          />
          {/* #deposits-fix (5/5): totalAllCount includes CANCELLED so the subtitle */}
          {/* matches the actual "Wszystkie" filter row count. */}
          <StatCard
            label="Łącznie"
            value={`${stats.amounts.total.toLocaleString('pl-PL')} zł`}
            subtitle={`${percentPaid}% wpłacono \u00b7 ${totalAllCount} zaliczek`}
            icon={TrendingUp}
            iconGradient={statGradients.financial}
            delay={0.4}
          />
        </div>
      )}

      {showCreateForm && (
        <Card className="overflow-hidden mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className={`bg-gradient-to-br ${accent.gradientSubtle} p-4 sm:p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg shadow-lg`}>
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Nowa Zaliczka
              </h2>
            </div>
            <CreateDepositForm
              onSuccess={() => {
                setShowCreateForm(false)
                loadData()
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader className={`border-b bg-gradient-to-r ${accent.gradientSubtle}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Lista Zaliczek</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <FilterTabs
                tabs={filterButtons.map((btn) => ({
                  key: btn.value,
                  label: btn.label,
                  count: btn.count,
                }))}
                activeKey={statusFilter}
                onChange={(key) => setStatusFilter(key as FilterStatus)}
              />
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Szukaj..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-sm w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div data-testid="loading-state" className="p-4 sm:p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : filteredDeposits.length === 0 && (searchQuery || statusFilter !== 'ALL') ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={DollarSign}
                title="Nie znaleziono zaliczek"
                description="Żadna zaliczka nie pasuje do wybranych kryteriów. Spróbuj zmienić filtr statusu lub wyszukiwanie."
              />
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={DollarSign}
                title="Brak zaliczek"
                description="Nie masz jeszcze żadnych zaliczek. Utwórz pierwszą zaliczkę, aby rozpocząć śledzenie płatności za rezerwacje."
                actionLabel="Nowa Zaliczka"
                onAction={() => setShowCreateForm(true)}
              />
            </div>
          ) : (
            <DepositsList deposits={filteredDeposits} onUpdate={loadData} />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}
