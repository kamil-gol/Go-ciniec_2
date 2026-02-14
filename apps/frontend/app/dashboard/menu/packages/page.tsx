'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAllActivePackages, getPackagesByTemplate, deletePackage } from '@/lib/api/menu-packages-api';
import type { MenuPackage } from '@/lib/api/menu-packages-api';
import { Package, Edit, Trash2, TrendingUp, Star, Users, Baby, DollarSign, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PackagesListPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, [templateId]);

  async function loadPackages() {
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
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Czy na pewno chcesz usunąć pakiet "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deletePackage(id);
      await loadPackages();
    } catch (error: any) {
      console.error('Failed to delete package:', error);
      alert(`Błąd: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-white/60 backdrop-blur-sm rounded-2xl w-1/3 shadow-sm"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Pakiety Menu
                </h1>
              </div>
              <p className="text-slate-600 text-lg ml-16 flex items-center gap-2">
                {templateId ? (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Pakiety dla wybranego szablonu
                  </>
                ) : (
                  'Zarządzaj wszystkimi pakietami menu'
                )}
              </p>
            </div>
            <Link
              href="/dashboard/menu/packages/new"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/50 hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Package className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Nowy Pakiet</span>
            </Link>
          </div>

          {/* Premium Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Wszystkie pakiety</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {packages.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Polecane</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {packages.filter((p) => p.isRecommended).length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Popularne</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {packages.filter((p) => p.isPopular).length}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Packages Grid */}
        <AnimatePresence mode="wait">
          {packages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-20 text-center"
            >
              <div className="max-w-md mx-auto">
                <motion.div 
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="inline-flex p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-6 shadow-lg"
                >
                  <Package className="w-16 h-16 text-blue-600" />
                </motion.div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">
                  Brak pakietów
                </h3>
                <p className="text-slate-600 text-lg mb-8">
                  Utwórz pierwszy pakiet menu, aby rozpocząć zarządzanie ofertą dla gości.
                </p>
                <Link
                  href="/dashboard/menu/packages/new"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <Package className="w-5 h-5" />
                  Utwórz pierwszy pakiet
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Border Top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    style={{ 
                      background: `linear-gradient(90deg, #${pkg.color || '3b82f6'}, #${pkg.color || '8b5cf6'})` 
                    }}
                  />

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500"></div>

                  {/* Card Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {pkg.name}
                          </h3>
                          {pkg.shortDescription && (
                            <p className="text-sm text-slate-600 line-clamp-2">{pkg.shortDescription}</p>
                          )}
                        </div>
                        {pkg.icon && (
                          <motion.div 
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl ml-3" 
                            title={pkg.name}
                          >
                            {pkg.icon}
                          </motion.div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pkg.isRecommended && (
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            Polecany
                          </motion.span>
                        )}
                        {pkg.isPopular && (
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 shadow-sm"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            Popularny
                          </motion.span>
                        )}
                        {pkg.badgeText && (
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-sm"
                          >
                            {pkg.badgeText}
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Premium Pricing Section */}
                    <div className="px-6 py-5 bg-gradient-to-br from-slate-50/80 to-blue-50/30 backdrop-blur-sm border-y border-slate-100/50">
                      <div className="grid grid-cols-3 gap-3">
                        {/* Dorośli */}
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                              <Users className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Dorośli</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {pkg.pricePerAdult}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">zł</span>
                          </div>
                        </motion.div>

                        {/* Dzieci */}
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                              <Users className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Dzieci</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              {pkg.pricePerChild}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">zł</span>
                          </div>
                        </motion.div>

                        {/* Maluchy - NAPRAWIONE! */}
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                              <Baby className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Maluchy</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {pkg.pricePerToddler}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">zł</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          {(pkg as any).categorySettings?.filter((cs: any) => cs.isEnabled).length || 0} kategorii
                        </span>
                        {pkg.menuTemplate && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            {pkg.menuTemplate.name}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {pkg.description && (
                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-slate-50/50 backdrop-blur-sm flex items-center gap-3">
                      <Link
                        href={`/dashboard/menu/packages/${pkg.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                        Edytuj
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        disabled={deletingId === pkg.id}
                        className="p-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl font-medium hover:from-red-100 hover:to-pink-100 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Usuń pakiet"
                      >
                        {deletingId === pkg.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
