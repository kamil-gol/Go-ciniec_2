'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAllActivePackages, getPackagesByTemplate, deletePackage } from '@/lib/api/menu-packages-api';
import type { MenuPackage } from '@/lib/api/menu-packages-api';
import { toast } from 'sonner';
import { Package, Edit, Trash2, TrendingUp, Star, Users, Baby, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared';
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

export default function PackagesListPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const accent = moduleAccents.menu;
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      const data = templateId
        ? await getPackagesByTemplate(templateId)
        : await getAllActivePackages();
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  async function handleDelete(id: string, name: string) {
    const confirmed = await confirm({ title: 'Usuń pakiet', description: `Czy na pewno chcesz usunąć pakiet "${name}"?`, variant: 'destructive', confirmLabel: 'Usuń' });
    if (!confirmed) return;
    try {
      setDeletingId(id);
      await deletePackage(id);
      await loadPackages();
    } catch (error: any) {
      console.error('Failed to delete package:', error);
      toast.error(error.message || 'Nie udało się usunąć pakietu');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <LoadingState variant="skeleton" rows={6} message="Ładowanie pakietów..." />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {ConfirmDialog}
      <PageHero
        accent={accent}
        title="Pakiety Menu"
        subtitle={templateId ? 'Pakiety dla wybranego szablonu' : 'Zarządzaj wszystkimi pakietami menu'}
        icon={Package}
        backHref="/dashboard/menu"
        backLabel="Powrót do Menu"
        action={
          <Link href="/dashboard/menu/packages/new">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 shadow-xl">
              <Package className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Nowy Pakiet</span>
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className={layout.statGrid3}>
        <StatCard label="Wszystkie" value={packages.length} subtitle="Pakiety w systemie" icon={Package} iconGradient={statGradients.count} delay={0.1} />
        <StatCard label="Polecane" value={packages.filter(p => p.isRecommended).length} subtitle="Oznaczone gwiazdką" icon={Star} iconGradient={statGradients.success} delay={0.2} />
        <StatCard label="Popularne" value={packages.filter(p => p.isPopular).length} subtitle="Najczęściej wybierane" icon={TrendingUp} iconGradient={statGradients.financial} delay={0.3} />
      </div>

      {/* Packages Grid */}
      <AnimatePresence mode="wait">
        {packages.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Brak pakietów"
            description="Utwórz pierwszy pakiet menu, aby rozpocząć zarządzanie ofertą dla gości."
            actionLabel="Utwórz pierwszy pakiet"
            actionHref="/dashboard/menu/packages/new"
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/60 dark:border-neutral-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Gradient Border Top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  style={{
                    background: `linear-gradient(90deg, #${(pkg.color || '#3b82f6').replace('#', '')}, #${(pkg.color || '#8b5cf6').replace('#', '')})`
                  }}
                />

                {/* Card Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {pkg.name}
                        </h3>
                        {pkg.shortDescription && (
                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">{pkg.shortDescription}</p>
                        )}
                      </div>
                      {pkg.icon && (
                        <div className="text-2xl sm:text-4xl ml-2 sm:ml-3 flex-shrink-0">{pkg.icon}</div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      {pkg.isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-950/50 dark:to-emerald-950/50 dark:text-green-400">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" /> Polecany
                        </span>
                      )}
                      {pkg.isPopular && (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 dark:from-yellow-950/50 dark:to-orange-950/50 dark:text-yellow-400">
                          <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Popularny
                        </span>
                      )}
                      {pkg.badgeText && (
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-950/50 dark:to-indigo-950/50 dark:text-blue-400">
                          {pkg.badgeText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Section — responsive overflow fix */}
                  <div className="px-4 sm:px-6 py-3 sm:py-5 bg-neutral-50/80 dark:bg-neutral-800/50 border-y border-neutral-100 dark:border-neutral-800 overflow-hidden">
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                      <div className="min-w-0 bg-white dark:bg-neutral-900 rounded-lg sm:rounded-xl p-1.5 sm:p-3 shadow-sm">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2 overflow-hidden">
                          <div className="p-0.5 sm:p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded sm:rounded-lg flex-shrink-0">
                            <Users className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                          </div>
                          <span className="text-[9px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate">Dorośli</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-base sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{pkg.pricePerAdult}</span>
                          <span className="text-[9px] sm:text-xs text-neutral-500">zł</span>
                        </div>
                      </div>
                      <div className="min-w-0 bg-white dark:bg-neutral-900 rounded-lg sm:rounded-xl p-1.5 sm:p-3 shadow-sm">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2 overflow-hidden">
                          <div className="p-0.5 sm:p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded sm:rounded-lg flex-shrink-0">
                            <Users className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                          </div>
                          <span className="text-[9px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate">Dzieci</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-base sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{pkg.pricePerChild}</span>
                          <span className="text-[9px] sm:text-xs text-neutral-500">zł</span>
                        </div>
                      </div>
                      <div className="min-w-0 bg-white dark:bg-neutral-900 rounded-lg sm:rounded-xl p-1.5 sm:p-3 shadow-sm">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2 overflow-hidden">
                          <div className="p-0.5 sm:p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded sm:rounded-lg flex-shrink-0">
                            <Baby className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                          </div>
                          <span className="text-[9px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate">Maluchy</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-base sm:text-2xl font-bold text-green-600 dark:text-green-400">{pkg.pricePerToddler}</span>
                          <span className="text-[9px] sm:text-xs text-neutral-500">zł</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-4 sm:px-6 py-3 sm:py-5">
                    <div className="flex items-center justify-between text-sm mb-3 sm:mb-4">
                      <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 font-medium">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        {(pkg as any).categorySettings?.filter((cs: any) => cs.isEnabled).length || 0} kategorii
                      </span>
                      {pkg.menuTemplate && (
                        <span className="px-2 sm:px-2.5 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold truncate max-w-[120px]">
                          {pkg.menuTemplate.name}
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">{pkg.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center gap-2 sm:gap-3">
                    <Link
                      href={`/dashboard/menu/packages/${pkg.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg text-sm sm:text-base transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edytuj
                    </Link>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      disabled={deletingId === pkg.id}
                      className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-all disabled:opacity-50"
                      title="Usuń pakiet"
                    >
                      {deletingId === pkg.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
