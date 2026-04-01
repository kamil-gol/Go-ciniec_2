'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { PageLayout } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader'
import { moduleAccents } from '@/lib/design-tokens'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function NewReservationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accent = moduleAccents.reservations
  const defaultHallId = searchParams.get('hallId') || undefined

  return (
    <PageLayout narrowContent>
      <Breadcrumb />
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/reservations/list')}
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do listy
      </Button>

      {/* Hero */}
      <PageHeader
        title="Nowa Rezerwacja"
        subtitle="Wypełnij formularz krok po kroku aby utworzyć nową rezerwację"
        icon={Calendar}
      />

      {/* Full-page form */}
      <CreateReservationForm
        onSuccess={() => {
          router.push('/dashboard/reservations/list')
        }}
        onCancel={() => router.push('/dashboard/reservations/list')}
        defaultHallId={defaultHallId}
      />
    </PageLayout>
  )
}
