// apps/frontend/src/app/dashboard/catering/templates/[id]/packages/components/SectionManager.tsx
'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useDeleteCateringSection } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SectionForm } from './SectionForm';
import { OptionManager } from './OptionManager';
import type { CateringPackage, CateringPackageSection } from '@/types/catering.types';

interface Props {
  pkg: CateringPackage;
  templateId: string;
}

export function SectionManager({ pkg, templateId }: Props) {
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] =
    useState<CateringPackageSection | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const deleteSection = useDeleteCateringSection(templateId);

  const sections = [...(pkg.sections ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const toggleSection = (id: string) =>
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleEditSection = (section: CateringPackageSection) => {
    setEditingSection(section);
    setSectionFormOpen(true);
  };

  const handleCloseForm = () => {
    setSectionFormOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    await deleteSection.mutateAsync(deleteSectionId);
    setDeleteSectionId(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sekcje dań
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingSection(null);
            setSectionFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Dodaj sekcję
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-2 rounded-md border border-dashed">
          <Layers className="h-4 w-4 shrink-0" />
          Brak sekcji — dodaj pierwszą sekcję dań do pakietu
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.id} className="rounded-md border bg-muted/30">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                  {expandedSections.includes(section.id) ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium">
                    {section.name ?? section.category?.name ?? 'Sekcja'}
                  </span>
                  {section.category && section.name && (
                    <span className="text-xs text-muted-foreground">
                      ({section.category.name})
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 ml-2">
                    {section.isRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Wymagana
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      min {section.minSelect}
                      {section.maxSelect != null
                        ? ` – max ${section.maxSelect}`
                        : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {section.options?.length ?? 0} dań
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEditSection(section)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteSectionId(section.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Options */}
              {expandedSections.includes(section.id) && (
                <div className="border-t px-3 pb-3 pt-2">
                  <OptionManager section={section} templateId={templateId} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section Form Dialog */}
      <Dialog open={sectionFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edytuj sekcję' : 'Nowa sekcja dań'}
            </DialogTitle>
          </DialogHeader>
          <SectionForm
            packageId={pkg.id}
            templateId={templateId}
            section={editingSection}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete section confirm */}
      <AlertDialog
        open={!!deleteSectionId}
        onOpenChange={() => setDeleteSectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń sekcję?</AlertDialogTitle>
            <AlertDialogDescription>
              Usunięcie sekcji spowoduje usunięcie wszystkich powiązanych dań.
              Operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
