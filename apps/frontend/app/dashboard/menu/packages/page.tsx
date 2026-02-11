'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPackages, deletePackage } from '@/lib/api/menu-packages';
import type { MenuPackage } from '@/types/menu';
import { Package, Edit, Trash2, TrendingUp, Star, Users, DollarSign } from 'lucide-react';

export default function PackagesListPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, [templateId]);

  async function loadPackages() {
    try {
      setLoading(true);
      const data = await getPackages(templateId || undefined);
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Czy na pewno chcesz usunąć pakiet "${name}"?`)) {
      return;
    }

    try {
      await deletePackage(id);
      loadPackages();
    } catch (error: any) {
      console.error('Failed to delete package:', error);
      alert(`Błąd: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/60 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-white/60 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                Pakiety Menu
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                {templateId
                  ? 'Pakiety dla wybranego szablonu'
                  : 'Zarządzaj wszystkimi pakietami menu'}
              </p>
            </div>
            <Link
              href="/dashboard/menu/packages/new"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              <span>Nowy Pakiet</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Wszystkie pakiety</p>
                  <p className="text-2xl font-bold text-slate-900">{packages.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Polecane</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {packages.filter((p) => p.isRecommended).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Popularne</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {packages.filter((p) => p.isPopular).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-blue-50 rounded-full mb-6">
                <Package className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Brak pakietów
              </h3>
              <p className="text-slate-600 mb-6">
                Utwórz pierwszy pakiet menu, aby rozpocząć zarządzanie ofertą dla gości.
              </p>
              <Link
                href="/dashboard/menu/packages/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <Package className="w-5 h-5" />
                Utwórz pierwszy pakiet
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                style={{ borderTopColor: `#${pkg.color || '3b82f6'}`, borderTopWidth: '4px' }}
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {pkg.name}
                      </h3>
                      {pkg.shortDescription && (
                        <p className="text-sm text-slate-600">{pkg.shortDescription}</p>
                      )}
                    </div>
                    {pkg.icon && (
                      <div className="text-3xl" title={pkg.name}>
                        {pkg.icon}
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.isRecommended && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        <Star className="w-3 h-3" />
                        Polecany
                      </span>
                    )}
                    {pkg.isPopular && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                        <TrendingUp className="w-3 h-3" />
                        Popularny
                      </span>
                    )}
                    {pkg.badgeText && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {pkg.badgeText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="px-6 py-4 bg-slate-50/80 border-y border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <Users className="w-3 h-3" />
                        Dorośli
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">
                          {pkg.pricePerAdult}
                        </span>
                        <span className="text-sm text-slate-600">zł</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <Users className="w-3 h-3" />
                        Dzieci
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">
                          {pkg.pricePerChild}
                        </span>
                        <span className="text-sm text-slate-600">zł</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                    <span>
                      {pkg.categorySettings?.filter((cs) => cs.isEnabled).length || 0} kategorii
                    </span>
                    {pkg.menuTemplate && (
                      <span className="text-blue-600 font-medium">
                        {pkg.menuTemplate.name}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {pkg.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-slate-50/50 flex items-center gap-2">
                  <Link
                    href={`/dashboard/menu/packages/${pkg.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edytuj
                  </Link>
                  <button
                    onClick={() => handleDelete(pkg.id, pkg.name)}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    title="Usuń pakiet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
