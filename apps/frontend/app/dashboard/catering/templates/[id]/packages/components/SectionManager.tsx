// apps/frontend/app/dashboard/catering/templates/[id]/packages/components/SectionManager.tsx
'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeleteCateringSection } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectionForm } from './SectionForm';
import { OptionManager } from './OptionManager';
import type { CateringPackage, CateringPackageSection } from '@/types/catering.types';

interface Props { pkg: CateringPackage; templateId: string; }

export function SectionManager({ pkg, templateId }: Props) {
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CateringPackageSection | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const deleteSection = useDeleteCateringSection(templateId);

  const sections = [...(pkg.sections ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const toggleSection = (id: string) =>
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleEditSection = (section: CateringPackageSection) => {
    setEditingSection(section); setSectionFormOpen(true);
  };
  const handleCloseForm = () => { setSectionFormOpen(false); setEditingSection(null); };
  const handleDeleteSection = () => {
    if (!deleteSectionId) return;
    deleteSection.mutate(deleteSectionId, { onSuccess: () => setDeleteSectionId(null) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sekcje dań
          {sections.length > 0 && (
            <span className="ml-1.5 font-bold text-foreground">({sections.length})</span>
          )}
        </p>
        <Button variant="outline" size="sm"
          onClick={() => { setEditingSection(null); setSectionFormOpen(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />Dodaj sekcję
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
          <Layers className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-medium">Brak sekcji</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sekcje organizują dania według kategorii (np. Zupy, Dania główne)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => {
            const isExpanded = expandedSections.includes(section.id);
            return (
              <div key={section.id}
                className={['rounded-lg border transition-colors',
                  isExpanded ? 'border-primary/30 bg-muted/20' : 'bg-muted/30 hover:border-muted-foreground/30',
                ].join(' ')}>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <button onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className="text-sm font-medium truncate">
                      {section.name ?? section.category?.name ?? 'Sekcja'}
                    </span>
                    {section.category && section.name && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">({section.category.name})</span>
                    )}
                    <div className="flex items-center gap-1.5 ml-1 shrink-0">
                      {section.isRequired && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Wymagana</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{section.options?.length ?? 0} dań</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleEditSection(section)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteSectionId(section.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="overflow-hidden">
                      <div className="border-t px-3 pb-3 pt-2">
                        <OptionManager section={section} templateId={templateId} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={sectionFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edytuj sekcję' : 'Nowa sekcja dań'}</DialogTitle>
          </DialogHeader>
          <SectionForm packageId={pkg.id} templateId={templateId} section={editingSection} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSectionId} onOpenChange={() => setDeleteSectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń sekcję?</AlertDialogTitle>
            <AlertDialogDescription>
              Usunięcie sekcji spowoduje usunięcie wszystkich powiązanych dań. Operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
