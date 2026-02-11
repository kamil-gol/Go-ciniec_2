'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PackageForm from '@/components/menu/PackageForm';
import { getMenuTemplates, type MenuTemplate } from '@/lib/api/menu-templates-api';
import { Package, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function NewPackagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('templateId');

  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
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
  }

  // If template is selected, show the form
  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/dashboard/menu" className="hover:text-blue-600 transition-colors">
              Menu
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href="/dashboard/menu/packages"
              className="hover:text-blue-600 transition-colors"
            >
              Pakiety
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Nowy pakiet</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Nowy pakiet menu</h1>
                <p className="text-slate-600">Szablon: {selectedTemplate.name}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
        </div>
      </div>
    );
  }

  // Template selection view
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/60 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-white/60 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-8">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/menu" className="hover:text-blue-600 transition-colors">
            Menu
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href="/dashboard/menu/packages"
            className="hover:text-blue-600 transition-colors"
          >
            Pakiety
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Wybierz szablon</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Wybierz szablon menu
              </h1>
              <p className="text-slate-600 text-lg mt-1">
                Wybierz szablon, dla którego chcesz utworzyć nowy pakiet
              </p>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-blue-50 rounded-full mb-6">
                <Calendar className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Brak aktywnych szablonów
              </h3>
              <p className="text-slate-600 mb-6">
                Przed utworzeniem pakietu musisz utworzyć szablon menu.
              </p>
              <Link
                href="/dashboard/menu/templates/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <Calendar className="w-5 h-5" />
                Utwórz szablon menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-2xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 p-6 text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Template Info */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  {template.eventType && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.eventType.color || '#3b82f6' }}
                      ></div>
                      <span className="text-sm text-slate-600">
                        {template.eventType.name}
                      </span>
                    </div>
                  )}
                  {template._count && (
                    <span className="text-sm text-slate-500">
                      {template._count.packages} pakietów
                    </span>
                  )}
                  <span className="ml-auto text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                    Wybierz →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
