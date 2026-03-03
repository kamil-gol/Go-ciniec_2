// apps/frontend/src/app/dashboard/catering/templates/page.tsx
'use client';

import { useState } from 'react';
import { UtensilsCrossed, Plus, Loader2 } from 'lucide-react';
import { useCateringTemplates } from '@/hooks/use-catering';
import { CateringTemplateList } from './components/CateringTemplateList';
import { CateringTemplateForm } from './components/CateringTemplateForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CateringTemplate } from '@/types/catering.types';

export default function CateringTemplatesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CateringTemplate | null>(null);

  const { data: templates, isLoading } = useCateringTemplates(true);

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" />
            Szablony cateringu
          </h1>
          <p className="text-muted-foreground">
            Zarządzanie szablonami i pakietami cateringowymi
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy szablon
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates && templates.length > 0 ? (
        <CateringTemplateList
          templates={templates}
          onEdit={handleEdit}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Brak szablonów</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Utwórz pierwszy szablon cateringowy
          </p>
          <Button onClick={handleCreate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Nowy szablon
          </Button>
        </div>
      )}

      {/* Dialog: Template Form */}
      <Dialog open={formOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edytuj szablon' : 'Nowy szablon cateringu'}
            </DialogTitle>
          </DialogHeader>
          <CateringTemplateForm
            template={editingTemplate}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
