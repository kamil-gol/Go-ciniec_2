// apps/frontend/src/app/dashboard/service-extras/page.tsx
'use client';

import { useState } from 'react';
import { Gift, FolderOpen, Package, Plus, Loader2 } from 'lucide-react';
import { useServiceCategories } from '@/hooks/use-service-extras';
import { ServiceCategoryList } from '@/components/service-extras/ServiceCategoryList';
import { ServiceCategoryForm } from '@/components/service-extras/ServiceCategoryForm';
import { ServiceItemForm } from '@/components/service-extras/ServiceItemForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ServiceCategory, ServiceItem } from '@/types/service-extra.types';

export default function ServiceExtrasPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | null>(null);

  const { data: categories, isLoading } = useServiceCategories();

  // ── Category actions ──────────────────────────────────
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleCategoryFormClose = () => {
    setCategoryFormOpen(false);
    setEditingCategory(null);
  };

  // ── Item actions ───────────────────────────────────────
  const handleCreateItem = (categoryId?: string) => {
    setEditingItem(null);
    setPreselectedCategoryId(categoryId || null);
    setItemFormOpen(true);
  };

  const handleEditItem = (item: ServiceItem) => {
    setEditingItem(item);
    setPreselectedCategoryId(item.categoryId);
    setItemFormOpen(true);
  };

  const handleItemFormClose = () => {
    setItemFormOpen(false);
    setEditingItem(null);
    setPreselectedCategoryId(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Usługi dodatkowe
          </h1>
          <p className="text-muted-foreground">
            Zarządzanie usługami dodatkowymi — tort, muzyka, wystrój, fotografia i inne
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="categories" className="flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4" />
              Kategorie
              {categories && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {categories.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Wszystkie pozycje
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === 'categories' && (
              <Button onClick={handleCreateCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Nowa kategoria
              </Button>
            )}
            {activeTab === 'items' && (
              <Button onClick={() => handleCreateItem()}>
                <Plus className="mr-2 h-4 w-4" />
                Nowa pozycja
              </Button>
            )}
          </div>
        </div>

        {/* Tab: Kategorie */}
        <TabsContent value="categories" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories && categories.length > 0 ? (
            <ServiceCategoryList
              categories={categories}
              onEditCategory={handleEditCategory}
              onCreateItem={handleCreateItem}
              onEditItem={handleEditItem}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Gift className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Brak kategorii</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Utwórz pierwszą kategorię usług dodatkowych
              </p>
              <Button onClick={handleCreateCategory} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Nowa kategoria
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab: Pozycje (flat list) */}
        <TabsContent value="items" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories && categories.length > 0 ? (
            <ServiceCategoryList
              categories={categories}
              onEditCategory={handleEditCategory}
              onCreateItem={handleCreateItem}
              onEditItem={handleEditItem}
              flatItemView
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Brak pozycji</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Najpierw utwórz kategorię, potem dodaj pozycje
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Category Form */}
      <Dialog open={categoryFormOpen} onOpenChange={handleCategoryFormClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edytuj kategorię' : 'Nowa kategoria usług'}
            </DialogTitle>
          </DialogHeader>
          <ServiceCategoryForm
            category={editingCategory}
            onClose={handleCategoryFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Item Form */}
      <Dialog open={itemFormOpen} onOpenChange={handleItemFormClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edytuj pozycję' : 'Nowa pozycja usługi'}
            </DialogTitle>
          </DialogHeader>
          <ServiceItemForm
            item={editingItem}
            preselectedCategoryId={preselectedCategoryId}
            onClose={handleItemFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
