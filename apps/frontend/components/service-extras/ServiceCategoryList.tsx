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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeleteCategory,
  useDeleteItem,
  useReorderCategories,
} from '@/hooks/use-service-extras';
import { toast } from 'sonner'
import type { ServiceCategoryListProps } from './category-list/category-list-config';
import { FlatItemView } from './category-list/FlatItemView';
import { SortableCategoryRows } from './category-list/SortableCategoryRows';
import { MobileCategoryCard } from './category-list/MobileCategoryCard';
import { DeleteConfirmDialog } from './category-list/DeleteConfirmDialog';

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
      toast.error('Nie udało się zmienić kolejności');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await deleteCategory.mutateAsync(deleteTarget.id);
        toast.success('Kategoria usunięta: ' + deleteTarget.name);
      } else {
        await deleteItem.mutateAsync(deleteTarget.id);
        toast.success('Pozycja usunięta: ' + deleteTarget.name);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie można usunąć');
    }
    setDeleteTarget(null);
  };

  // === FLAT ITEM VIEW (Table) ===
  if (flatItemView) {
    return (
      <>
        <FlatItemView
          categories={categories}
          onEditItem={onEditItem}
          onDeleteItem={(item) => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
        />

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
