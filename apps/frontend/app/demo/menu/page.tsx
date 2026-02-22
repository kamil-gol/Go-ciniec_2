/**
 * Menu Components Demo Page
 * 
 * Showcase of all menu system components
 * 
 * URL: /demo/menu
 */

'use client';

import { useState } from 'react';
import { 
  MenuCard,
  PackageCard,
  PriceBreakdown,
  MenuSelectionFlow,
  MenuSummary
} from '@/components/menu';
import { 
  useMenuTemplates, 
  useMenuPackages, 
} from '@/hooks/use-menu';
import { toast } from 'sonner';

export default function MenuDemoPage() {
  const [activeTab, setActiveTab] = useState<'components' | 'flow'>('components');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();

  const { data: templates, isLoading: templatesLoading } = useMenuTemplates({ isActive: true });
  const { data: packages } = useMenuPackages(selectedTemplateId);

  const samplePriceBreakdown = {
    packageCost: {
      adults: { count: 50, priceEach: 300, total: 15000 },
      children: { count: 10, priceEach: 150, total: 1500 },
      toddlers: { count: 5, priceEach: 0, total: 0 },
      subtotal: 16500,
    },
    optionsCost: [
      { option: 'Bar Open', priceType: 'PER_PERSON', priceEach: 50, quantity: 65, total: 3250 },
      { option: 'DJ + Taniec', priceType: 'FLAT', priceEach: 800, quantity: 1, total: 800 },
    ],
    optionsSubtotal: 4050,
    totalMenuPrice: 20550,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            \uD83C\uDFA8 Menu Components Demo
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Interactive showcase of all menu system components
          </p>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('components')}
              className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
                activeTab === 'components'
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              Components Gallery
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
                activeTab === 'flow'
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              Selection Flow
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {activeTab === 'components' ? (
          <div className="space-y-16">
            {/* MenuCard Section */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  1. MenuCard
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Display menu templates with event type and validity
                </p>
              </div>
              {templatesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
                  <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
                  <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates?.slice(0, 3).map(template => (
                    <MenuCard
                      key={template.id}
                      template={template}
                      onSelect={(t) => {
                        setSelectedTemplateId(t.id);
                        toast.success(`Wybrano: ${t.name}`);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* PackageCard Section */}
            {selectedTemplateId && packages && packages.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    2. PackageCard
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Display pricing packages with included items
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.slice(0, 3).map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      onSelect={(p) => toast.success(`Wybrano: ${p.name}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* PriceBreakdown Section */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  3. PriceBreakdown
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Display detailed price calculation
                </p>
              </div>
              <div className="max-w-2xl">
                <PriceBreakdown breakdown={samplePriceBreakdown as any} />
              </div>
            </section>
          </div>
        ) : (
          /* Selection Flow */
          <div className="mx-auto max-w-6xl">
            <MenuSelectionFlow
              adults={50}
              children={10}
              toddlers={5}
              onComplete={(selection) => {
                console.log('Selection completed:', selection);
                toast.success('\u2705 Wyb\u00f3r menu zako\u0144czony!', {
                  description: `Template: ${selection.templateId}, Package: ${selection.packageId}`,
                });
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-neutral-200 bg-white py-8 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container mx-auto px-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            \uD83D\uDCDA Documentation:{' '}
            <a
              href="https://github.com/kamil-gol/Go-ciniec_2/blob/main/apps/frontend/components/menu/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 hover:underline"
            >
              Menu Components README
            </a>
          </p>
          <p className="mt-2">
            \uD83D\uDE80 API Status: Connected to <code>http://localhost:3001/api</code>
          </p>
        </div>
      </div>
    </div>
  );
}
