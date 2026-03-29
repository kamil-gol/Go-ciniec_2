'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewOrderWizard } from '../components/NewOrderWizard';
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function NewCateringOrderPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/catering/orders')}
          aria-label="Wróć do listy zamówień"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nowe zamówienie cateringowe</h1>
          <p className="text-sm text-muted-foreground">Wypełnij formularz krok po kroku</p>
        </div>
      </div>
      <NewOrderWizard onSuccess={(id) => router.push(`/dashboard/catering/orders/${id}`)} />
    </div>
  );
}
