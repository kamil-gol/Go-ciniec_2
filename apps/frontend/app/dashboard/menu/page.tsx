/**
 * Menu Management Page
 * 
 * Main page for managing menu system
 * URL: /dashboard/menu
 */

'use client';

import { useState } from 'react';
import { 
  useMenuTemplates, 
  useMenuPackages, 
  useMenuOptions,
  useEventTypes
} from '@/hooks/use-menu';
import {
  MenuCard,
  MenuCardSkeleton,
  PackageCard,
  PackageCardSkeleton,
  OptionCard,
  OptionCardSkeleton,
} from '@/components/menu';
import { 
  Plus, 
  Search, 
  Filter,
  UtensilsCrossed,
  Package,
  Sparkles,
  Theater
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabType = 'templates' | 'packages' | 'options' | 'event-types';

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>();

  // Queries
  const { data: templates, isLoading: templatesLoading } = useMenuTemplates({ isActive: true });
  const { data: packages, isLoading: packagesLoading } = useMenuPackages(selectedTemplate);
  const { data: options, isLoading: optionsLoading } = useMenuOptions({ isActive: true });
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes();

  const tabs = [
    { id: 'templates' as TabType, label: 'Szablony Menu', icon: UtensilsCrossed, count: templates?.length },
    { id: 'packages' as TabType, label: 'Pakiety', icon: Package, count: packages?.length },
    { id: 'options' as TabType, label: 'Opcje', icon: Sparkles, count: options?.length },
    { id: 'event-types' as TabType, label: 'Typy Wydarzeń', icon: Theater, count: eventTypes?.length },
  ];

  return (
    <div className="min-h-screen space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Zarządzanie Menu
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Konfiguracja szablonów menu, pakietów i opcji dodatkowych
          </p>
        </div>
        
        <button
          onClick={() => toast.info('Funkcja dodawania w przygotowaniu')}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-violet-700"
        >
          <Plus className="h-5 w-5" />
          Dodaj Nowy
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition-colors',
                isActive
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  isActive
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Szukaj..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <button
          onClick={() => toast.info('Filtry w przygotowaniu')}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <Filter className="h-5 w-5" />
          Filtry
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            {templatesLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => <MenuCardSkeleton key={i} />)}
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates
                  .filter(t => 
                    searchQuery === '' || 
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.variant?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(template => (
                    <MenuCard
                      key={template.id}
                      template={template}
                      onSelect={(t) => {
                        setSelectedTemplate(t.id);
                        setActiveTab('packages');
                        toast.success(`Wybrano: ${t.name}`);
                      }}
                    />
                  ))
                }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-12 dark:border-neutral-700 dark:bg-neutral-800">
                <UtensilsCrossed className="h-12 w-12 text-neutral-400" />
                <p className="mt-4 text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                  Brak szablonów menu
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Dodaj pierwszy szablon menu aby rozpocząć
                </p>
                <button
                  onClick={() => toast.info('Funkcja dodawania w przygotowaniu')}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700"
                >
                  <Plus className="h-5 w-5" />
                  Dodaj Szablon
                </button>
              </div>
            )}
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div>
            {!selectedTemplate ? (
              <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
                <Package className="mx-auto h-12 w-12 text-neutral-400" />
                <p className="mt-4 text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                  Wybierz szablon menu
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Przejdź do zakładki Szablony Menu i wybierz szablon
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700"
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Przejdź do Szablonów
                </button>
              </div>
            ) : packagesLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <PackageCardSkeleton key={i} />)}
              </div>
            ) : packages && packages.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages
                  .filter(p => 
                    searchQuery === '' || 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      onSelect={(p) => toast.success(`Wybrano: ${p.name}`)}
                    />
                  ))
                }
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
                <Package className="mx-auto h-12 w-12 text-neutral-400" />
                <p className="mt-4 text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                  Brak pakietów
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Dodaj pakiety do wybranego szablonu menu
                </p>
              </div>
            )}
          </div>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <div>
            {optionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <OptionCardSkeleton key={i} />)}
              </div>
            ) : options && options.length > 0 ? (
              <div className="space-y-4">
                {options
                  .filter(o => 
                    searchQuery === '' || 
                    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    o.category.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(option => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      onQuantityChange={(id, qty) => {
                        if (qty > 0) {
                          toast.success(`Zaktualizowano: ${option.name}`);
                        }
                      }}
                    />
                  ))
                }
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
                <Sparkles className="mx-auto h-12 w-12 text-neutral-400" />
                <p className="mt-4 text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                  Brak opcji dodatkowych
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Dodaj opcje takie jak alkohol, muzyka, dekoracje
                </p>
              </div>
            )}
          </div>
        )}

        {/* Event Types Tab */}
        {activeTab === 'event-types' && (
          <div>
            {eventTypesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                ))}
              </div>
            ) : eventTypes && eventTypes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventTypes
                  .filter(et => 
                    searchQuery === '' || 
                    et.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(eventType => (
                    <div
                      key={eventType.id}
                      className="rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-12 rounded-xl"
                          style={{ backgroundColor: eventType.color || '#8b5cf6' }}
                        />
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {eventType.name}
                          </h3>
                          {eventType.description && (
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                              {eventType.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
                <Theater className="mx-auto h-12 w-12 text-neutral-400" />
                <p className="mt-4 text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                  Brak typów wydarzeń
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Dodaj typy wydarzeń (wesela, komunie, urodziny...)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
