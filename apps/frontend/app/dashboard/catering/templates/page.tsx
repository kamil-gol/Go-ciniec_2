// apps/frontend/app/dashboard/catering/templates/page.tsx
'use client';

import { useState } from 'react';
import { LayoutTemplate, Plus, Eye, EyeOff } from 'lucide-react';
import { useCateringTemplates } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PageLayout,
  PageHero,
  StatCard,
  LoadingState,
  EmptyState,
} from '@/components/shared';
import { CateringTemplateList } from './components/CateringTemplateList';
import { CateringTemplateForm } from './components/CateringTemplateForm';
import type { CateringTemplate } from '@/types/catering.types';
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens';
import { Breadcrumb } from '@/components/shared/Breadcrumb'

const CATERING_ACCENT = moduleAccents.catering;

export default function CateringTemplatesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CateringTemplate | null>(null);

  const { data: templates, isLoading } = useCateringTemplates(true);

  const stats = {
    total: templates?.length ?? 0,
    active: templates?.filter((t) => t.isActive).length ?? 0,
    inactive: templates?.filter((t) => !t.isActive).length ?? 0,
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template: CateringTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingTemplate(null);
  };

  return (
    <PageLayout>
      <Breadcrumb />
      {/* Hero */}
      <PageHero
        accent={CATERING_ACCENT}
        title="Szablony cateringowe"
        subtitle="Konfiguruj szablony pakietów i dań dla oferty cateringu"
        icon={LayoutTemplate}
        backHref="/dashboard/catering"
        backLabel="Powrót do Cateringu"
        action={
          <Button
            size="lg"
            onClick={handleCreate}
            className="bg-white text-orange-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowy szablon
          </Button>
        }
      />

      {/* StatCards */}
      <div className={layout.statGrid3}>
        <StatCard
          label="Wszystkie"
          value={stats.total}
          subtitle="Szablony w systemie"
          icon={LayoutTemplate}
          iconGradient={statGradients.count}
          delay={0.1}
        />
        <StatCard
          label="Aktywne"
          value={stats.active}
          subtitle="Gotowe do użycia"
          icon={Eye}
          iconGradient={statGradients.success}
          delay={0.2}
        />
        <StatCard
          label="Nieaktywne"
          value={stats.inactive}
          subtitle="Wyłączone"
          icon={EyeOff}
          iconGradient={statGradients.neutral}
          delay={0.3}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState variant="skeleton" rows={6} message="Wczytywanie szablonów..." />
      ) : !templates || templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Brak szablonów"
          description="Utwórz pierwszy szablon cateringowy"
          actionLabel="Nowy szablon"
          onAction={handleCreate}
        />
      ) : (
        <CateringTemplateList
          templates={templates}
          onEdit={handleEdit}
        />
      )}

      {/* Dialog create/edit */}
      <Dialog open={formOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edytuj szablon cateringowy' : 'Nowy szablon cateringowy'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Zaktualizuj informacje o szablonie cateringowym'
                : 'Utwórz nowy szablon cateringowy'}
            </DialogDescription>
          </DialogHeader>
          <CateringTemplateForm template={editingTemplate} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
