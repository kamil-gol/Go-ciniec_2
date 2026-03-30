'use client';

import { useState, useMemo } from 'react';
import {
  Gift,
  FolderOpen,
  Package,
  Plus,
  Search,
  Eye,
  EyeOff,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useServiceCategories } from '@/hooks/use-service-extras';
import { ServiceCategoryList } from '@/components/service-extras/ServiceCategoryList';
import { ServiceCategoryForm } from '@/components/service-extras/ServiceCategoryForm';
import { ServiceItemForm } from '@/components/service-extras/ServiceItemForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PageLayout,
  PageHero,
  StatCard,
  LoadingState,
  EmptyState,
} from '@/components/shared';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens';
import type { ServiceCategory, ServiceItem } from '@/types/service-extra.types';
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type ViewMode = 'categories' | 'items';

export default function ServiceExtrasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: categories, isLoading } = useServiceCategories(!showInactive);
  const accent = moduleAccents.serviceExtras;

  // Computed stats
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

  // Filtered categories
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

  // Category actions
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

  // Item actions
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

  // Filter buttons
  const viewButtons: { label: string; value: ViewMode; count: number; icon: React.ElementType }[] = [
    { label: 'Kategorie', value: 'categories', count: filteredCategories.length, icon: FolderOpen },
    { label: 'Wszystkie pozycje', value: 'items', count: totalFilteredItems, icon: Package },
  ];

  return (
    <PageLayout>
      <Breadcrumb />
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
              className="bg-white/20 text-white hover:bg-white/30 shadow-xl border border-white/40 backdrop-blur-sm"
              onClick={() => handleCreateItem()}
            >
              <Plus className="mr-2 h-5 w-5" />
              Nowa Pozycja
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className={layout.statGrid}>
        <StatCard
          label="Kategorie"
          value={stats.total}
          subtitle="W systemie"
          icon={FolderOpen}
          iconGradient={statGradients.info}
          delay={0.1}
        />
        <StatCard
          label="Pozycje"
          value={stats.items}
          subtitle="Łącznie usług"
          icon={Package}
          iconGradient={statGradients.count}
          delay={0.2}
        />
        <StatCard
          label="Aktywne"
          value={stats.active}
          subtitle="Dostępne do wyboru"
          icon={TrendingUp}
          iconGradient={statGradients.success}
          delay={0.3}
        />
        <StatCard
          label="Gratis"
          value={stats.free}
          subtitle="Bezpłatne pozycje"
          icon={Sparkles}
          iconGradient={statGradients.financial}
          delay={0.4}
        />
      </div>

      {/* Main Card — Deposits-style */}
      <Card className="overflow-hidden">
        <CardHeader className={`border-b bg-gradient-to-r ${accent.gradientSubtle}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                <Gift className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Katalog Usług</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* View mode tabs */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <FilterTabs
                  tabs={viewButtons.map((btn) => ({
                    key: btn.value,
                    label: btn.label,
                    count: btn.count,
                  }))}
                  activeKey={viewMode}
                  onChange={(key) => setViewMode(key as ViewMode)}
                />
                {/* Active/All toggle */}
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    showInactive
                      ? 'bg-purple-100 text-purple-700 shadow-sm dark:bg-purple-900/30 dark:text-purple-300'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {showInactive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showInactive ? 'Wszystkie' : 'Aktywne'}
                </button>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Szukaj..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-sm w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 sm:p-6">
              <LoadingState variant="skeleton" rows={6} message="Ładowanie usług..." />
            </div>
          ) : filteredCategories.length === 0 && search ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Gift}
                title="Nie znaleziono"
                description="Żadna usługa ani kategoria nie pasuje do wyszukiwania. Spróbuj użyć innej frazy."
              />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Gift}
                title="Brak kategorii"
                description="Nie masz jeszcze żadnych kategorii usług dodatkowych. Utwórz pierwszą kategorię, aby zacząć dodawać usługi takie jak tort, muzyka czy dekoracje."
                actionLabel="Nowa Kategoria"
                onAction={handleCreateCategory}
              />
            </div>
          ) : (
            <ServiceCategoryList
              categories={filteredCategories}
              onEditCategory={handleEditCategory}
              onCreateItem={handleCreateItem}
              onEditItem={handleEditItem}
              flatItemView={viewMode === 'items'}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog: Category Form */}
      <Dialog open={categoryFormOpen} onOpenChange={handleCategoryFormClose}>
        <DialogContent className="sm:max-w-lg">
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
        <DialogContent className="sm:max-w-xl">
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
