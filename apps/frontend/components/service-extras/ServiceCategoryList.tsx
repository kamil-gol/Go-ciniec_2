'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Package,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  useDeleteCategory,
  useDeleteItem,
  useReorderCategories,
} from '@/hooks/use-service-extras';
import { useToast } from '@/hooks/use-toast';
import type {
  ServiceCategory,
  ServiceItem,
} from '@/types/service-extra.types';

// Constants

const PRICE_LABELS: Record<string, string> = {
  FLAT: 'Kwota stała',
  PER_PERSON: 'Za osobę',
  FREE: 'Gratis',
};

const PRICE_TYPE_STYLES: Record<string, string> = {
  FLAT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  PER_PERSON: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  FREE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

// Props

interface ServiceCategoryListProps {
  categories: ServiceCategory[];
  onEditCategory: (category: ServiceCategory) => void;
  onCreateItem: (categoryId?: string) => void;
  onEditItem: (item: ServiceItem) => void;
  flatItemView?: boolean;
}

// Main Component

export function ServiceCategoryList({
  categories,
  onEditCategory,
  onCreateItem,
  onEditItem,
  flatItemView = false,
}: ServiceCategoryListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'item';
    id: string;
    name: string;
  } | null>(null);

  const deleteCategory = useDeleteCategory();
  const deleteItem = useDeleteItem();
  const reorderCategories = useReorderCategories();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categoryIds.indexOf(active.id as string);
    const newIndex = categoryIds.indexOf(over.id as string);
    const newOrder = arrayMove(categoryIds, oldIndex, newIndex);
    try {
      await reorderCategories.mutateAsync(newOrder);
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się zmienić kolejności', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await deleteCategory.mutateAsync(deleteTarget.id);
        toast({ title: 'Kategoria usunięta', description: deleteTarget.name });
      } else {
        await deleteItem.mutateAsync(deleteTarget.id);
        toast({ title: 'Pozycja usunięta', description: deleteTarget.name });
      }
    } catch (error: any) {
      toast({
        title: 'Błąd usuwania',
        description: error?.response?.data?.message || 'Nie można usunąć',
        variant: 'destructive',
      });
    }
    setDeleteTarget(null);
  };

  // === FLAT ITEM VIEW (Table) ===
  if (flatItemView) {
    const allItems = categories.flatMap(
      (cat) => cat.items?.map((item) => ({ ...item, category: cat })) || []
    );

    return (
      <>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
          {allItems.map((item) => (
            <div key={item.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{item.icon || '\uD83D\uDCE6'}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.category?.color || '#94a3b8' }}
                      />
                      {item.category?.name}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {item.priceType !== 'FREE' ? (
                    <p className="font-bold text-sm tabular-nums">
                      {Number(item.basePrice).toLocaleString('pl-PL')} zł
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-600 font-medium">Gratis</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${PRICE_TYPE_STYLES[item.priceType]}`}>
                    {PRICE_LABELS[item.priceType]}
                  </span>
                  {!item.isActive && <Badge variant="secondary" className="text-[10px]">Nieaktywna</Badge>}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/50 dark:bg-neutral-800/50">
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Pozycja</TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Kategoria</TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Typ ceny</TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400 text-right">Cena</TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map((item) => (
                <TableRow key={item.id} className="group hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon || '\uD83D\uDCE6'}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-neutral-500 truncate max-w-[200px]">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                        style={{ backgroundColor: item.category?.color || '#94a3b8' }}
                      />
                      <span className="text-sm">{item.category?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${PRICE_TYPE_STYLES[item.priceType]}`}>
                      {PRICE_LABELS[item.priceType]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.priceType !== 'FREE' ? (
                      <span className="font-semibold tabular-nums text-sm">
                        {Number(item.basePrice).toLocaleString('pl-PL')} zł
                        {item.priceType === 'PER_PERSON' && <span className="text-xs text-neutral-400 ml-0.5">/os.</span>}
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-300 dark:text-neutral-600">\u2014</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Aktywna
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                        Nieaktywna
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DeleteConfirmDialog
          target={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteCategory.isPending || deleteItem.isPending}
        />
      </>
    );
  }

  // === CATEGORIES VIEW (DnD Table) ===
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
          {categories.map((category) => (
            <MobileCategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedIds.has(category.id)}
              onToggleExpand={toggleExpand}
              onEditCategory={onEditCategory}
              onCreateItem={onCreateItem}
              onEditItem={onEditItem}
              onDeleteCategory={(cat) => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
              onDeleteItem={(item) => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
            />
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/50 dark:bg-neutral-800/50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Kategoria</TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400 text-center">Pozycji</TableHead>
                <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Status</TableHead>
                <TableHead className="w-36"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <SortableCategoryRows
                  key={category.id}
                  category={category}
                  isExpanded={expandedIds.has(category.id)}
                  onToggleExpand={toggleExpand}
                  onEditCategory={onEditCategory}
                  onCreateItem={onCreateItem}
                  onEditItem={onEditItem}
                  onDeleteCategory={(cat) => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
                  onDeleteItem={(item) => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </SortableContext>

      <DeleteConfirmDialog
        target={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteCategory.isPending || deleteItem.isPending}
      />
    </DndContext>
  );
}

// Sortable Category Row (Desktop)

interface CategoryRowProps {
  category: ServiceCategory;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEditCategory: (cat: ServiceCategory) => void;
  onCreateItem: (categoryId?: string) => void;
  onEditItem: (item: ServiceItem) => void;
  onDeleteCategory: (cat: ServiceCategory) => void;
  onDeleteItem: (item: ServiceItem) => void;
}

function SortableCategoryRows({
  category,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onCreateItem,
  onEditItem,
  onDeleteCategory,
  onDeleteItem,
}: CategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemCount = category._count?.items ?? category.items?.length ?? 0;

  return (
    <>
      {/* Category header row */}
      <TableRow
        ref={setNodeRef}
        style={style}
        className={`group hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors cursor-pointer ${
          isDragging ? 'bg-purple-50 dark:bg-purple-900/20 shadow-lg z-50 ring-2 ring-purple-400/30' : ''
        } ${!category.isActive ? 'opacity-60' : ''}`}
        onClick={() => onToggleExpand(category.id)}
      >
        {/* Drag handle */}
        <TableCell className="w-10 pr-0">
          <button
            className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-neutral-400" />
          </button>
        </TableCell>

        {/* Category name */}
        <TableCell>
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            )}
            <span
              className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
              style={{ backgroundColor: category.color || '#94a3b8' }}
            />
            <span className="text-lg flex-shrink-0">{category.icon || '\uD83D\uDCC1'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">{category.name}</p>
                {category.isExclusive && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    Wyłączna
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-neutral-500 truncate max-w-[250px]">{category.description}</p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Item count */}
        <TableCell className="text-center">
          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {itemCount}
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          {category.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Aktywna
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Nieaktywna
            </span>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onCreateItem(category.id)}>
              <Plus className="mr-1 h-3.5 w-3.5" />Dodaj
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditCategory(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteCategory(category)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded items */}
      {isExpanded && category.items && category.items.length > 0 && category.items.map((item) => (
        <TableRow
          key={item.id}
          className="group hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors bg-neutral-50/30 dark:bg-neutral-800/20"
        >
          <TableCell></TableCell>
          <TableCell>
            <div className="flex items-center gap-3 pl-8">
              <span className="text-base">{item.icon || '\uD83D\uDCE6'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.requiresNote && (
                    <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300">
                      Notatka
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium border mr-1 ${PRICE_TYPE_STYLES[item.priceType]}`}>
                    {PRICE_LABELS[item.priceType]}
                  </span>
                  {item.priceType !== 'FREE' && (
                    <span className="font-medium tabular-nums">
                      {Number(item.basePrice).toLocaleString('pl-PL')} zł
                      {item.priceType === 'PER_PERSON' && '/os.'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell></TableCell>
          <TableCell>
            {item.isActive ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">\u2713</span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                Nieaktywna
              </span>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteItem(item)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}

      {/* Empty state for expanded category */}
      {isExpanded && (!category.items || category.items.length === 0) && (
        <TableRow className="bg-neutral-50/30 dark:bg-neutral-800/20">
          <TableCell></TableCell>
          <TableCell colSpan={4}>
            <div className="flex items-center gap-2 py-3 pl-8 text-sm text-neutral-400">
              <Package className="h-4 w-4" />
              Brak pozycji
              <Button variant="link" size="sm" className="h-auto p-0 text-purple-600" onClick={() => onCreateItem(category.id)}>
                \u2014 dodaj pierwszą
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Mobile Category Card

function MobileCategoryCard({
  category,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onCreateItem,
  onEditItem,
  onDeleteCategory,
  onDeleteItem,
}: CategoryRowProps) {
  const itemCount = category._count?.items ?? category.items?.length ?? 0;

  return (
    <div className={`${!category.isActive ? 'opacity-60' : ''}`}>
      {/* Category header */}
      <div className="p-4 flex items-center justify-between" onClick={() => onToggleExpand(category.id)}>
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || '#94a3b8' }}
          />
          <span className="text-lg flex-shrink-0">{category.icon || '\uD83D\uDCC1'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate">{category.name}</p>
              {category.isExclusive && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  Wył.
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">{itemCount} pozycji</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCreateItem(category.id)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditCategory(category)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteCategory(category)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expanded items */}
      {isExpanded && category.items && category.items.map((item) => (
        <div key={item.id} className="px-4 py-2.5 pl-14 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span>{item.icon || '\uD83D\uDCE6'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-neutral-500">
                {PRICE_LABELS[item.priceType]}
                {item.priceType !== 'FREE' && ` \u00b7 ${Number(item.basePrice).toLocaleString('pl-PL')} zł`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteItem(item)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Delete Confirm Dialog

function DeleteConfirmDialog({
  target,
  onConfirm,
  onCancel,
  isLoading,
}: {
  target: { type: string; id: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={() => onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Potwierdź usunięcie
          </AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć <strong>{target?.name}</strong>?
            {target?.type === 'category' && (
              <span className="block mt-1 text-destructive">
                Uwaga: usunięcie kategorii usunie również wszystkie pozycje w niej.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Usuwanie...' : 'Usuń'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
