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
  Filter,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DepositsList } from '@/components/deposits/deposits-list'
import { CreateDepositForm } from '@/components/deposits/create-deposit-form'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, DepositStats, DepositStatus } from '@/lib/api/deposits'
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import { toast } from 'sonner'

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
      toast.error('Nie uda\u0142o si\u0119 za\u0142adowa\u0107 zaliczek')
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
    { label: 'Oczekuj\u0105ce', value: 'PENDING', count: stats?.counts.pending },
    { label: 'Op\u0142acone', value: 'PAID', count: stats?.counts.paid },
    { label: 'Przetermin.', value: 'OVERDUE', count: stats?.counts.overdue },
    { label: 'Anulowane', value: 'CANCELLED', count: stats?.counts.cancelled },
  ]

  const percentPaid = stats && stats.amounts.total > 0
    ? Math.round((stats.amounts.paid / stats.amounts.total) * 100)
    : 0

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Zaliczki"
        subtitle="Zarz\u0105dzaj zaliczkami i p\u0142atno\u015bciami"
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

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Oczekuj\u0105ce"
            value={stats.counts.pending}
            subtitle={`${stats.amounts.pending.toLocaleString('pl-PL')} z\u0142 do zap\u0142aty`}
            icon={Clock}
            iconGradient="from-amber-500 to-orange-500"
            delay={0.1}
          />
          <StatCard
            label="Op\u0142acone"
            value={stats.counts.paid}
            subtitle={`${stats.amounts.paid.toLocaleString('pl-PL')} z\u0142 wp\u0142acono`}
            icon={CheckCircle2}
            iconGradient="from-emerald-500 to-teal-500"
            delay={0.2}
          />
          <StatCard
            label="Przetermin."
            value={stats.counts.overdue}
            subtitle={`${stats.amounts.overdue.toLocaleString('pl-PL')} z\u0142 zaleg\u0142o\u015bci`}
            icon={AlertTriangle}
            iconGradient="from-red-500 to-rose-500"
            delay={0.3}
          />
          {/* #deposits-fix (5/5): totalAllCount includes CANCELLED so the subtitle */}
          {/* matches the actual "Wszystkie" filter row count. */}
          <StatCard
            label="\u0141\u0105cznie"
            value={`${stats.amounts.total.toLocaleString('pl-PL')} z\u0142`}
            subtitle={`${percentPaid}% wp\u0142acono \u00b7 ${totalAllCount} zaliczek`}
            icon={TrendingUp}
            iconGradient="from-rose-500 to-pink-500"
            delay={0.4}
          />
        </div>
      )}

      {showCreateForm && (
        <Card className="overflow-hidden animate-in slide-in-from-top-4 duration-300">
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
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm overflow-x-auto">
                <Filter className="h-4 w-4 text-neutral-400 ml-2 flex-shrink-0" />
                {filterButtons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setStatusFilter(btn.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      statusFilter === btn.value
                        ? 'bg-rose-100 text-rose-700 shadow-sm dark:bg-rose-900/30 dark:text-rose-300'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {btn.label}
                    {btn.count !== undefined && btn.count > 0 && (
                      <span className="ml-1 text-[10px] opacity-70">({btn.count})</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
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
            <div className="p-4 sm:p-6">
              <LoadingState variant="skeleton" rows={5} message="\u0141adowanie zaliczek..." />
            </div>
          ) : filteredDeposits.length === 0 && (searchQuery || statusFilter !== 'ALL') ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={DollarSign}
                title="Nie znaleziono zaliczek"
                description="Spr\u00f3buj innych kryteri\u00f3w wyszukiwania lub filtru"
              />
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={DollarSign}
                title="Brak zaliczek"
                description="Utw\u00f3rz pierwsz\u0105 zaliczk\u0119 aby zacz\u0105\u0107 \u015bledzi\u0107 p\u0142atno\u015bci"
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
