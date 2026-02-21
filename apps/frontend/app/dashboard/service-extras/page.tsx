'use client';

import { useState, useMemo } from 'react';
import { Gift, FolderOpen, Package, Plus, Search, Eye, EyeOff, TrendingUp, Sparkles } from 'lucide-react';
import { useServiceCategories } from '@/hooks/use-service-extras';
import { ServiceCategoryList } from '@/components/service-extras/ServiceCategoryList';
import { ServiceCategoryForm } from '@/components/service-extras/ServiceCategoryForm';
import { ServiceItemForm } from '@/components/service-extras/ServiceItemForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';
import type { ServiceCategory, ServiceItem } from '@/types/service-extra.types';

export default function ServiceExtrasPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: categories, isLoading } = useServiceCategories(!showInactive);
  const accent = moduleAccents.serviceExtras;

  // ── Computed stats ────────────────────────────────────
  const stats = useMemo(() => {
    if (!categories) return { total: 0, items: 0, active: 0, free: 0 };
    const allItems = categories.flatMap((c) => c.items || []);
    return {
      total: categories.length,
      items: allItems.length,
      active: allItems.filter((i) => i.isActive).length,
      free: allItems.filter((i) => i.priceType === 'FREE').length,
    };
  }, [categories]);

  // ── Filtered categories ───────────────────────────────
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => {
        const nameMatch = cat.name.toLowerCase().includes(q);
        const matchingItems = cat.items?.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        );
        if (nameMatch) return cat;
        if (matchingItems && matchingItems.length > 0) {
          return { ...cat, items: matchingItems };
        }
        return null;
      })
      .filter(Boolean) as ServiceCategory[];
  }, [categories, search]);

  const totalFilteredItems = filteredCategories.flatMap((c) => c.items || []).length;

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
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Usługi Dodatkowe"
        subtitle="Zarządzanie usługami — tort, muzyka, wystrój, fotografia i inne"
        icon={Gift}
        action={
          <div className="flex gap-2">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90 shadow-xl"
              onClick={handleCreateCategory}
            >
              <Plus className="mr-2 h-5 w-5" />
              Nowa Kategoria
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
              onClick={() => handleCreateItem()}
            >
              <Plus className="mr-2 h-5 w-5" />
              Nowa Pozycja
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Kategorie"
          value={stats.total}
          subtitle="W systemie"
          icon={FolderOpen}
          iconGradient="from-purple-500 to-fuchsia-500"
          delay={0.1}
        />
        <StatCard
          label="Pozycje"
          value={stats.items}
          subtitle="Łącznie usług"
          icon={Package}
          iconGradient="from-violet-500 to-purple-500"
          delay={0.2}
        />
        <StatCard
          label="Aktywne"
          value={stats.active}
          subtitle="Dostępne do wyboru"
          icon={TrendingUp}
          iconGradient="from-emerald-500 to-teal-500"
          delay={0.3}
        />
        <StatCard
          label="Gratis"
          value={stats.free}
          subtitle="Bezpłatne pozycje"
          icon={Sparkles}
          iconGradient="from-amber-500 to-orange-500"
          delay={0.4}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <Input
                placeholder="Szukaj kategorii lub pozycji..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className={showInactive
                ? `bg-gradient-to-r ${accent.gradient} text-white border-transparent shadow-lg`
                : ''
              }
            >
              {showInactive ? (
                <><EyeOff className="mr-2 h-5 w-5" />Wszystkie</>  
              ) : (
                <><Eye className="mr-2 h-5 w-5" />Tylko Aktywne</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="categories" className="flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4" />
              Kategorie
              {filteredCategories.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {filteredCategories.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Wszystkie pozycje
              {totalFilteredItems > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {totalFilteredItems}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Kategorie */}
        <TabsContent value="categories" className="mt-4">
          {isLoading ? (
            <LoadingState variant="skeleton" rows={6} />
          ) : filteredCategories.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Znaleziono{' '}
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {filteredCategories.length}
                  </span>{' '}
                  {filteredCategories.length === 1
                    ? 'kategorię'
                    : filteredCategories.length < 5
                    ? 'kategorie'
                    : 'kategorii'}
                </p>
              </div>
              <ServiceCategoryList
                categories={filteredCategories}
                onEditCategory={handleEditCategory}
                onCreateItem={handleCreateItem}
                onEditItem={handleEditItem}
              />
            </>
          ) : (
            <EmptyState
              icon={Gift}
              title={search ? 'Nie znaleziono kategorii' : 'Brak kategorii'}
              description={
                search
                  ? 'Spróbuj użyć innego wyszukiwania'
                  : 'Utwórz pierwszą kategorię usług dodatkowych'
              }
              actionLabel={search ? undefined : 'Nowa Kategoria'}
              onAction={search ? undefined : handleCreateCategory}
            />
          )}
        </TabsContent>

        {/* Tab: Pozycje (flat list) */}
        <TabsContent value="items" className="mt-4">
          {isLoading ? (
            <LoadingState variant="skeleton" rows={6} />
          ) : filteredCategories.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Znaleziono{' '}
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {totalFilteredItems}
                  </span>{' '}
                  {totalFilteredItems === 1
                    ? 'pozycję'
                    : totalFilteredItems < 5
                    ? 'pozycje'
                    : 'pozycji'}
                </p>
              </div>
              <ServiceCategoryList
                categories={filteredCategories}
                onEditCategory={handleEditCategory}
                onCreateItem={handleCreateItem}
                onEditItem={handleEditItem}
                flatItemView
              />
            </>
          ) : (
            <EmptyState
              icon={Package}
              title={search ? 'Nie znaleziono pozycji' : 'Brak pozycji'}
              description={
                search
                  ? 'Spróbuj użyć innego wyszukiwania'
                  : 'Najpierw utwórz kategorię, potem dodaj pozycje'
              }
            />
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
    </PageLayout>
  );
}
