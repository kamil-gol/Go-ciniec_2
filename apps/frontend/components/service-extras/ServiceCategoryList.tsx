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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { useDeleteCategory, useDeleteItem, useReorderCategories } from '@/hooks/use-service-extras';
import { useToast } from '@/hooks/use-toast';
import type {
  ServiceCategory,
  ServiceItem,
} from '@/types/service-extra.types';

const PRICE_LABELS: Record<string, string> = {
  FLAT: 'Kwota stała',
  PER_PERSON: 'Za osobę',
  FREE: 'Gratis',
};

interface ServiceCategoryListProps {
  categories: ServiceCategory[];
  onEditCategory: (category: ServiceCategory) => void;
  onCreateItem: (categoryId?: string) => void;
  onEditItem: (item: ServiceItem) => void;
  flatItemView?: boolean;
}

export function ServiceCategoryList({
  categories,
  onEditCategory,
  onCreateItem,
  onEditItem,
  flatItemView = false,
}: ServiceCategoryListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categoryIds = useMemo(
    () => categories.map((c) => c.id),
    [categories]
  );

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
      toast({
        title: 'Błąd',
        description: 'Nie udało się zmienić kolejności',
        variant: 'destructive',
      });
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

  // Flat view \u2014 all items across categories (no DnD)
  if (flatItemView) {
    const allItems = categories.flatMap(
      (cat) =>
        cat.items?.map((item) => ({ ...item, category: cat })) || []
    );

    return (
      <div className="space-y-2">
        {allItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon || '\ud83d\udce6'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.isExclusive && (
                      <Badge variant="outline" className="text-xs">
                        Wyłączna
                      </Badge>
                    )}
                    {!item.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Nieaktywna
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.category?.color || '#94a3b8' }}
                    />
                    {item.category?.name}
                    <span>\u00b7</span>
                    <span>{PRICE_LABELS[item.priceType]}</span>
                    {item.priceType !== 'FREE' && (
                      <span className="font-medium">
                        {Number(item.basePrice).toLocaleString('pl-PL')} zł
                        {item.priceType === 'PER_PERSON' && '/os.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditItem(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDeleteTarget({ type: 'item', id: item.id, name: item.name })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <DeleteConfirmDialog
          target={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteCategory.isPending || deleteItem.isPending}
        />
      </div>
    );
  }

  // Default \u2014 sortable accordion by category
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {categories.map((category) => (
            <SortableCategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedIds.has(category.id)}
              onToggleExpand={toggleExpand}
              onEditCategory={onEditCategory}
              onCreateItem={onCreateItem}
              onEditItem={onEditItem}
              onDeleteCategory={(cat) =>
                setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })
              }
              onDeleteItem={(item) =>
                setDeleteTarget({ type: 'item', id: item.id, name: item.name })
              }
            />
          ))}
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

// \u2500\u2500 Sortable Category Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface SortableCategoryCardProps {
  category: ServiceCategory;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEditCategory: (cat: ServiceCategory) => void;
  onCreateItem: (categoryId?: string) => void;
  onEditItem: (item: ServiceItem) => void;
  onDeleteCategory: (cat: ServiceCategory) => void;
  onDeleteItem: (item: ServiceItem) => void;
}

function SortableCategoryCard({
  category,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onCreateItem,
  onEditItem,
  onDeleteCategory,
  onDeleteItem,
}: SortableCategoryCardProps) {
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
    <Card
      ref={setNodeRef}
      style={style}
      className={`${
        !category.isActive ? 'opacity-60' : ''
      } ${isDragging ? 'ring-2 ring-purple-500/50 shadow-xl scale-[1.02] z-50 bg-background' : ''}`}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <button
            className="touch-none cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-muted/80 transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </button>

          <button
            className="flex items-center gap-3 text-left"
            onClick={() => onToggleExpand(category.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: category.color || '#94a3b8' }}
            />
            <span className="text-lg">{category.icon || '\ud83d\udcc1'}</span>
            <div>
              <span className="font-semibold">{category.name}</span>
              {!category.isActive && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Nieaktywna
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="ml-2">
              {itemCount} {itemCount === 1 ? 'pozycja' : 'pozycji'}
            </Badge>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateItem(category.id)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Dodaj
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditCategory(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteCategory(category)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Items list */}
      {isExpanded && (
        <CardContent className="border-t pt-2 pb-3">
          {category.items && category.items.length > 0 ? (
            <div className="space-y-1">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.icon || '\ud83d\udce6'}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.isExclusive && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Wyłączna
                          </Badge>
                        )}
                        {item.requiresNote && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Notatka
                          </Badge>
                        )}
                        {!item.isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Nieaktywna
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {PRICE_LABELS[item.priceType]}
                        {item.priceType !== 'FREE' && (
                          <span className="ml-1 font-medium">
                            {Number(item.basePrice).toLocaleString('pl-PL')} zł
                            {item.priceType === 'PER_PERSON' && '/os.'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditItem(item)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDeleteItem(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Package className="mr-2 h-4 w-4" />
              Brak pozycji w tej kategorii
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// \u2500\u2500 Delete Confirm Dialog \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

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
            Czy na pewno chcesz usunąć{' '}
            <strong>{target?.name}</strong>?
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
