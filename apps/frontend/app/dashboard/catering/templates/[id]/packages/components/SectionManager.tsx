// apps/frontend/app/dashboard/catering/templates/[id]/packages/components/SectionManager.tsx
'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers, CheckCircle2, Circle, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDeleteCateringSection, useReorderCateringSections } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SectionForm } from './SectionForm';
import { OptionManager } from './OptionManager';
import type { CateringPackage, CateringPackageSection } from '@/types/catering.types';

const SECTION_COLORS = [
  'from-primary-500 to-primary-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

/** Formatuje zakres wyboru: "1–2", "1+" (bez limitu), "1" */
function formatSelectRange(min: unknown, max: unknown): string {
  const minVal = Number(min);
  const maxVal = max != null && Number(max) > 0 ? Number(max) : null;
  if (maxVal === null) return `${minVal}+`;
  if (minVal === maxVal) return String(minVal);
  return `${minVal}\u2013${maxVal}`;
}

/**
 * Buduje klucz do porównania stanu sekcji z serwera.
 * Uwzględnia: ID, kolejność, limity wyboru ORAZ opcje (dania) —
 * dzięki temu każda zmiana opcji triggeruje re-sync localSections.
 */
function buildServerKey(sections: CateringPackageSection[]): string {
  return JSON.stringify(
    sections.map((s) => ({
      id: s.id,
      min: s.minSelect,
      max: s.maxSelect,
      order: s.displayOrder,
      options: (s.options ?? []).map((o) => o.id).sort().join(','),
    })),
  );
}

// ─── Sortable row ──────────────────────────────────────────────────────────────────────
interface SortableRowProps {
  section: CateringPackageSection;
  idx: number;
  isExpanded: boolean;
  isDragging: boolean;
  templateId: string;
  onToggle: (id: string) => void;
  onEdit: (s: CateringPackageSection) => void;
  onDelete: (id: string) => void;
}

function SortableSectionRow({
  section,
  idx,
  isExpanded,
  isDragging,
  templateId,
  onToggle,
  onEdit,
  onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.3 : 1,
  };

  const colorGradient = SECTION_COLORS[idx % SECTION_COLORS.length];
  const dishCount = section.options?.length ?? 0;
  const selectLabel = formatSelectRange(section.minSelect, section.maxSelect);

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        className={[
          'overflow-hidden rounded-xl border-2 bg-card shadow-sm transition-all duration-200',
          isExpanded
            ? 'border-primary/40 shadow-md'
            : 'border-border hover:border-primary/25 hover:shadow-md',
          isDragging ? 'ring-2 ring-primary/50' : '',
        ].join(' ')}
      >
        {/* Section header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
          onClick={() => onToggle(section.id)}
        >
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
            onClick={(e) => e.stopPropagation()}
            title="Przeciągnij, aby zmienić kolejność"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colorGradient} text-white text-xs font-bold shadow-sm`}>
            {idx + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold leading-none">
                {section.name ?? section.category?.name ?? 'Sekcja'}
              </span>
              {section.name && section.category && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {section.category.name}
                </span>
              )}
              {section.isRequired ? (
                <Badge className="gap-1 py-0 text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Wymagana
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 py-0 text-[10px] text-muted-foreground">
                  <Circle className="h-2.5 w-2.5" />
                  Opcjonalna
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">
                {dishCount === 0
                  ? 'Brak dań'
                  : `${dishCount} ${dishCount === 1 ? 'danie' : dishCount < 5 ? 'dania' : 'dań'}`}
              </span>
              <span className="text-xs text-muted-foreground">
                Wybór: {selectLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(section)}
              aria-label="Edytuj sekcję"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(section.id)}
              aria-label="Usuń sekcję"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="text-muted-foreground shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="border-t bg-muted/20 px-4 pb-4 pt-3">
                <OptionManager section={section} templateId={templateId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Drag overlay ──────────────────────────────────────────────────────────────────────
function SectionDragOverlay({ section, idx }: { section: CateringPackageSection; idx: number }) {
  const colorGradient = SECTION_COLORS[idx % SECTION_COLORS.length];
  return (
    <div className="rounded-xl border-2 border-primary/60 bg-card shadow-2xl px-4 py-3 flex items-center gap-3 rotate-1 opacity-95">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colorGradient} text-white text-xs font-bold shadow-sm`}>
        {idx + 1}
      </div>
      <span className="text-sm font-semibold">
        {section.name ?? section.category?.name ?? 'Sekcja'}
      </span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────────────
interface Props { pkg: CateringPackage; templateId: string; }

export function SectionManager({ pkg, templateId }: Props) {
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CateringPackageSection | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const deleteSection = useDeleteCateringSection(templateId);
  const reorderSections = useReorderCateringSections(templateId);

  const sortedFromServer = [...(pkg.sections ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const [localSections, setLocalSections] = useState<CateringPackageSection[]>(
    () => sortedFromServer,
  );

  // Re-sync lokalny stan za każdym razem gdy serwer zwraca nowe dane
  // (zmiana sekcji, edycja limitów, dodanie/usunięcie opcji/dan)
  const serverKey = buildServerKey(sortedFromServer);
  // biome-ignore lint: intentional derived-state sync
  const [prevServerKey, setPrevServerKey] = useState(serverKey);
  if (serverKey !== prevServerKey) {
    setLocalSections(sortedFromServer);
    setPrevServerKey(serverKey);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeSectionIdx = activeDragId
    ? localSections.findIndex((s) => s.id === activeDragId)
    : -1;
  const activeSection = activeDragId ? localSections[activeSectionIdx] : null;

  const handleDragStart = ({ active }: DragStartEvent) => setActiveDragId(String(active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = localSections.findIndex((s) => s.id === active.id);
    const newIdx = localSections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(localSections, oldIdx, newIdx);
    setLocalSections(reordered);
    reordered.forEach((section, i) => {
      if (section.displayOrder !== i + 1) {
        reorderSections.mutate({ sectionId: section.id, displayOrder: i + 1 });
      }
    });
  };

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
  const handleDeleteSection = () => {
    if (!deleteSectionId) return;
    deleteSection.mutate(deleteSectionId, { onSuccess: () => setDeleteSectionId(null) });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Sekcje dań</span>
          {localSections.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary">
              {localSections.length}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => { setEditingSection(null); setSectionFormOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Dodaj sekcję
        </Button>
      </div>

      {/* Empty state */}
      {localSections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Layers className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="mt-3 text-sm font-semibold">Brak sekcji dań</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Sekcje organizują dania według kategorii, np. Zupy, Dania główne, Desery
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            onClick={() => { setEditingSection(null); setSectionFormOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Dodaj pierwszą sekcję
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {localSections.map((section, idx) => (
                <SortableSectionRow
                  key={section.id}
                  section={section}
                  idx={idx}
                  isExpanded={expandedSections.includes(section.id)}
                  isDragging={activeDragId !== null}
                  templateId={templateId}
                  onToggle={toggleSection}
                  onEdit={handleEditSection}
                  onDelete={setDeleteSectionId}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeSection ? (
              <SectionDragOverlay section={activeSection} idx={activeSectionIdx} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Section form dialog */}
      <Dialog open={sectionFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edytuj sekcję' : 'Nowa sekcja dań'}
            </DialogTitle>
            <DialogDescription>
              {editingSection
                ? 'Zaktualizuj ustawienia sekcji dań'
                : 'Dodaj nową sekcję do pakietu — np. Zupy, Dania główne, Desery'}
            </DialogDescription>
          </DialogHeader>
          <SectionForm
            packageId={pkg.id}
            templateId={templateId}
            section={editingSection}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
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
