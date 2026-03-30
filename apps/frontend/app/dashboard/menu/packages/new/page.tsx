'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PackageForm from '@/components/menu/PackageForm';
import { getMenuTemplates, type MenuTemplate } from '@/lib/api/menu-templates-api';
import { Package, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageLayout, LoadingState, EmptyState } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export default function NewPackagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('templateId');

  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMenuTemplates({ isActive: true });
      setTemplates(data);
      
      // If templateId in URL, find and select it
      if (templateId) {
        const template = data.find((t) => t.id === templateId);
        if (template) {
          setSelectedTemplate(template);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // If template is selected, show the form
  if (selectedTemplate) {
    return (
      <PageLayout narrowContent>
        <Breadcrumb />

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">Nowy pakiet menu</h1>
              <p className="text-neutral-600 dark:text-neutral-300">Szablon: {selectedTemplate.name}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Zmień szablon
          </button>
        </div>

        {/* Form */}
        <PackageForm
          menuTemplateId={selectedTemplate.id}
          onSuccess={() => {
            router.push(`/dashboard/menu/packages?templateId=${selectedTemplate.id}`);
          }}
        />
      </PageLayout>
    );
  }

  // Template selection view
  if (loading) {
    return (
      <PageLayout narrowContent>
        <LoadingState variant="skeleton" count={2} />
      </PageLayout>
    );
  }

  return (
    <PageLayout narrowContent>
      <Breadcrumb />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              Wybierz szablon menu
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-lg mt-1">
              Wybierz szablon, dla którego chcesz utworzyć nowy pakiet
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Brak aktywnych szablonów"
          description="Przed utworzeniem pakietu musisz utworzyć szablon menu."
          actionLabel="Utwórz szablon menu"
          actionHref="/dashboard/menu/templates/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={cn(
                'group bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg',
                'border border-neutral-200/60 dark:border-neutral-700/50',
                'hover:shadow-2xl hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-600',
                'transition-all duration-300 p-4 sm:p-6 text-left'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Template Info */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700/50">
                {template.eventType && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.eventType.color || '#3b82f6' }}
                    ></div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">
                      {template.eventType.name}
                    </span>
                  </div>
                )}
                {template._count && (
                  <span className="text-sm text-neutral-500 dark:text-neutral-300">
                    {template._count.packages} pakietów
                  </span>
                )}
                <span className="ml-auto text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                  Wybierz →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
