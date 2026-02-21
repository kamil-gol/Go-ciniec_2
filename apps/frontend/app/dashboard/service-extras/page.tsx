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
  Filter,
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
import { moduleAccents } from '@/lib/design-tokens';
import type { ServiceCategory, ServiceItem } from '@/types/service-extra.types';

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

  // \u2500\u2500 Computed stats \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Filtered categories \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Category actions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Item actions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Filter buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const viewButtons: { label: string; value: ViewMode; count: number; icon: React.ElementType }[] = [
    { label: 'Kategorie', value: 'categories', count: filteredCategories.length, icon: FolderOpen },
    { label: 'Wszystkie pozycje', value: 'items', count: totalFilteredItems, icon: Package },
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Us\u0142ugi Dodatkowe"
        subtitle="Zarz\u0105dzanie us\u0142ugami \u2014 tort, muzyka, wystr\u00f3j, fotografia i inne"
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
          subtitle="\u0141\u0105cznie us\u0142ug"
          icon={Package}
          iconGradient="from-violet-500 to-purple-500"
          delay={0.2}
        />
        <StatCard
          label="Aktywne"
          value={stats.active}
          subtitle="Dost\u0119pne do wyboru"
          icon={TrendingUp}
          iconGradient="from-emerald-500 to-teal-500"
          delay={0.3}
        />
        <StatCard
          label="Gratis"
          value={stats.free}
          subtitle="Bezp\u0142atne pozycje"
          icon={Sparkles}
          iconGradient="from-amber-500 to-orange-500"
          delay={0.4}
        />
      </div>

      {/* Main Card \u2014 Deposits-style */}
      <Card className="overflow-hidden">
        <CardHeader className={`border-b bg-gradient-to-r ${accent.gradientSubtle}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                <Gift className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Katalog Us\u0142ug</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* View mode tabs */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm overflow-x-auto">
                <Filter className="h-4 w-4 text-neutral-400 ml-2 flex-shrink-0" />
                {viewButtons.map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <button
                      key={btn.value}
                      onClick={() => setViewMode(btn.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        viewMode === btn.value
                          ? 'bg-purple-100 text-purple-700 shadow-sm dark:bg-purple-900/30 dark:text-purple-300'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {btn.label}
                      {btn.count > 0 && (
                        <span className="ml-0.5 text-[10px] opacity-70">({btn.count})</span>
                      )}
                    </button>
                  );
                })}
                {/* Active/All toggle */}
                <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    showInactive
                      ? 'bg-purple-100 text-purple-700 shadow-sm dark:bg-purple-900/30 dark:text-purple-300'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  {showInactive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showInactive ? 'Wszystkie' : 'Aktywne'}
                </button>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
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
              <LoadingState variant="skeleton" rows={6} message="\u0141adowanie us\u0142ug..." />
            </div>
          ) : filteredCategories.length === 0 && search ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Gift}
                title="Nie znaleziono"
                description="Spr\u00f3buj u\u017cy\u0107 innego wyszukiwania"
              />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Gift}
                title="Brak kategorii"
                description="Utw\u00f3rz pierwsz\u0105 kategori\u0119 us\u0142ug dodatkowych"
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edytuj kategori\u0119' : 'Nowa kategoria us\u0142ug'}
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
              {editingItem ? 'Edytuj pozycj\u0119' : 'Nowa pozycja us\u0142ugi'}
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
