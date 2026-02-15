'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, UserPlus, TrendingUp, Mail, Phone, Sparkles, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ClientsList } from '@/components/clients/clients-list'
import { CreateClientForm } from '@/components/clients/create-client-form'
import { getClients } from '@/lib/api/clients'
import { batchCheckRodo } from '@/lib/api/attachments'
import { useToast } from '@/hooks/use-toast'
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function ClientsPage() {
  const { toast } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rodoMap, setRodoMap] = useState<Record<string, boolean>>({})
  const accent = moduleAccents.clients

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await getClients()
      setClients(data)

      // Batch check RODO status for all clients
      if (data.length > 0) {
        try {
          const clientIds = data.map((c: any) => c.id)
          const rodoResult = await batchCheckRodo(clientIds)
          setRodoMap(rodoResult)
        } catch (e) {
          console.error('Failed to check RODO status:', e)
        }
      }
    } catch (error: any) {
      console.error('Error loading clients:', error)
      toast({
        title: 'B\u0142\u0105d',
        description: 'Nie uda\u0142o si\u0119 za\u0142adowa\u0107 klient\u00f3w',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

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
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Klienci"
        subtitle="Zarz\u0105dzaj baz\u0105 klient\u00f3w"
        icon={Users}
        action={
          <Button
            size="lg"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-white text-violet-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Dodaj Klienta
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Wszyscy" value={stats.total} subtitle="\u0141\u0105cznie klient\u00f3w" icon={Users} iconGradient="from-violet-500 to-purple-500" delay={0.1} />
        <StatCard label="Z emailem" value={stats.withEmail} subtitle="Dane kontaktowe" icon={Mail} iconGradient="from-blue-500 to-cyan-500" delay={0.2} />
        <StatCard label="Z telefonem" value={stats.withPhone} subtitle="Numer telefonu" icon={Phone} iconGradient="from-emerald-500 to-teal-500" delay={0.3} />
        <StatCard label="Ten miesi\u0105c" value={stats.thisMonth} subtitle="Nowych klient\u00f3w" icon={TrendingUp} iconGradient="from-rose-500 to-pink-500" delay={0.4} />
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className={`bg-gradient-to-br ${accent.gradientSubtle} p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg shadow-lg`}>
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dodaj Nowego Klienta</h2>
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
      <Card>
        <CardHeader className={`border-b bg-gradient-to-r ${accent.gradientSubtle}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Lista Klient\u00f3w</CardTitle>
            </div>
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <Input
                placeholder="Szukaj klient\u00f3w..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <LoadingState variant="skeleton" rows={4} message="\u0141adowanie klient\u00f3w..." />
          ) : filteredClients.length === 0 && searchQuery ? (
            <EmptyState
              icon={Users}
              title="Nie znaleziono klient\u00f3w"
              description="Spr\u00f3buj innych kryteri\u00f3w wyszukiwania"
            />
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Brak klient\u00f3w"
              description="Dodaj pierwszego klienta aby zacz\u0105\u0107"
              actionLabel="Dodaj Klienta"
              onAction={() => setShowCreateForm(true)}
            />
          ) : (
            <ClientsList
              clients={filteredClients}
              rodoMap={rodoMap}
              onUpdate={loadClients}
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}
