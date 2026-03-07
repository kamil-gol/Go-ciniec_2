// apps/frontend/src/app/dashboard/catering/templates/page.tsx
'use client';

import { useState } from 'react';
import { LayoutTemplate, Plus, Loader2 } from 'lucide-react';
import { useCateringTemplates } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CateringTemplateList } from './components/CateringTemplateList';
import { CateringTemplateForm } from './components/CateringTemplateForm';
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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
            Szablony cateringowe
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Zarządzaj szablonami — {templates?.length ?? 0} łącznie
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nowy szablon
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CateringTemplateList
          templates={templates ?? []}
          onEdit={handleEdit}
        />
      )}

      {/* Dialog */}
      <Dialog open={formOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edytuj szablon' : 'Nowy szablon'}
            </DialogTitle>
          </DialogHeader>
          <CateringTemplateForm template={editingTemplate} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
