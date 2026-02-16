// apps/frontend/app/dashboard/audit-log/page.tsx
'use client';

import { FileText, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout, PageHero } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';
import Link from 'next/link';

export default function AuditLogPage() {
  const accent = moduleAccents.auditLog;

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Dziennik Audytu"
        subtitle="Historia wszystkich zmian w systemie"
        icon={FileText}
      />

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="p-4 bg-gradient-to-br from-zinc-100 to-slate-100 dark:from-zinc-800 dark:to-slate-800 rounded-2xl mb-6">
            <Clock className="h-12 w-12 text-zinc-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
            W przygotowaniu
          </h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Dziennik audytu jest obecnie w trakcie implementacji (US-9.6 / US-9.7).
            Wkrótce będziesz mógł przeglądać pełną historię zmian w systemie.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Wróć do dashboardu
            </Button>
          </Link>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
