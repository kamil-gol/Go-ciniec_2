'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
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
import { useDeleteCategory, useDeleteItem } from '@/hooks/use-service-extras';
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
  const { toast } = useToast();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  // Flat view — all items across categories
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
                <span className="text-lg">{item.icon || '📦'}</span>
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
                    <span>·</span>
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

  // Default — accordion by category
  return (
    <div className="space-y-3">
      {categories.map((category, index) => {
        const isExpanded = expandedIds.has(category.id);
        const itemCount = category._count?.items ?? category.items?.length ?? 0;

        return (
          <Card key={category.id} className={!category.isActive ? 'opacity-60' : ''}>
            {/* Category Header */}
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => toggleExpand(category.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground/50 w-5 text-center">
                  {index + 1}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color || '#94a3b8' }}
                />
                <span className="text-lg">{category.icon || '📁'}</span>
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
              </div>

              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
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
                  onClick={() =>
                    setDeleteTarget({
                      type: 'category',
                      id: category.id,
                      name: category.name,
                    })
                  }
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
                          <span>{item.icon || '📦'}</span>
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
                            onClick={() =>
                              setDeleteTarget({
                                type: 'item',
                                id: item.id,
                                name: item.name,
                              })
                            }
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
      })}

      <DeleteConfirmDialog
        target={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteCategory.isPending || deleteItem.isPending}
      />
    </div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────

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
