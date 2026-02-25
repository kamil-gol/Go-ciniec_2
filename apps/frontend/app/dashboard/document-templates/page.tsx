'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  FileText,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Pencil,
  History,
  Loader2,
  Tag,
  Search,
  Filter,
  UtensilsCrossed,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/use-document-templates';
import { TemplateEditor } from '@/components/document-templates/TemplateEditor';
import { TemplateHistory } from '@/components/document-templates/TemplateHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PageLayout,
  PageHero,
  StatCard,
  LoadingState,
  EmptyState,
} from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type DocumentTemplate,
  type TemplateCategory,
} from '@/types/document-template.types';

// ── Category config ──────────────────────────────────

const CATEGORY_CONFIG: Record<TemplateCategory, {
  icon: typeof FileText;
  emoji: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
}> = {
  RESERVATION_PDF: {
    icon: FileText,
    emoji: '📄',
    gradient: 'from-blue-500 to-cyan-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  CATERING_PDF: {
    icon: UtensilsCrossed,
    emoji: '🍽️',
    gradient: 'from-emerald-500 to-teal-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  EMAIL: {
    icon: Mail,
    emoji: '✉️',
    gradient: 'from-violet-500 to-purple-500',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/30',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  POLICY: {
    icon: BookOpen,
    emoji: '📋',
    gradient: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
};

type FilterValue = 'all' | TemplateCategory;

// ── Page Component ──────────────────────────────────

export default function DocumentTemplatesPage() {
  const { data: templates, isLoading } = useDocumentTemplates();
  const accent = moduleAccents.documentTemplates;

  // State
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  // Stats
  const stats = useMemo(() => {
    if (!templates) return { total: 0, pdf: 0, email: 0, policy: 0 };
    return {
      total: templates.length,
      pdf: templates.filter((t) => t.category === 'RESERVATION_PDF' || t.category === 'CATERING_PDF').length,
      email: templates.filter((t) => t.category === 'EMAIL').length,
      policy: templates.filter((t) => t.category === 'POLICY').length,
    };
  }, [templates]);

  // Group by category
  const grouped = useMemo(() => {
    if (!templates) return {};
    const map: Partial<Record<TemplateCategory, DocumentTemplate[]>> = {};
    for (const t of templates) {
      const cat = t.category as TemplateCategory;
      if (!map[cat]) map[cat] = [];
      map[cat]!.push(t);
    }
    return map;
  }, [templates]);

  // Filtered + searched templates
  const filteredCategories = useMemo(() => {
    const cats = activeFilter === 'all' ? TEMPLATE_CATEGORY_ORDER : [activeFilter];
    if (!search.trim()) return cats;
    const q = search.toLowerCase();
    return cats.filter((cat) => {
      const catTemplates = grouped[cat];
      if (!catTemplates) return false;
      return catTemplates.some(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
      );
    });
  }, [activeFilter, search, grouped]);

  const getFilteredTemplates = (cat: TemplateCategory) => {
    const catTemplates = grouped[cat] || [];
    if (!search.trim()) return catTemplates;
    const q = search.toLowerCase();
    return catTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
    );
  };

  // Filter buttons config
  const filterButtons: { label: string; value: FilterValue; count: number; icon: typeof FileText }[] = [
    { label: 'Wszystkie', value: 'all', count: stats.total, icon: Layers },
    ...TEMPLATE_CATEGORY_ORDER.map((cat) => ({
      label: TEMPLATE_CATEGORY_LABELS[cat],
      value: cat as FilterValue,
      count: grouped[cat]?.length || 0,
      icon: CATEGORY_CONFIG[cat].icon,
    })),
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Szablony Dokumentów"
        subtitle="Zarządzanie treścią szablonów PDF, e-mail i regulaminów"
        icon={ScrollText}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Wszystkie szablony"
          value={stats.total}
          subtitle="W systemie"
          icon={ScrollText}
          iconGradient="from-cyan-500 to-blue-500"
          delay={0.1}
        />
        <StatCard
          label="Dokumenty PDF"
          value={stats.pdf}
          subtitle="Rezerwacje i catering"
          icon={FileText}
          iconGradient="from-blue-500 to-indigo-500"
          delay={0.2}
        />
        <StatCard
          label="Szablony e-mail"
          value={stats.email}
          subtitle="Wiadomości"
          icon={Mail}
          iconGradient="from-violet-500 to-purple-500"
          delay={0.3}
        />
        <StatCard
          label="Regulaminy"
          value={stats.policy}
          subtitle="Dokumenty prawne"
          icon={BookOpen}
          iconGradient="from-amber-500 to-orange-500"
          delay={0.4}
        />
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        <CardHeader className={`border-b bg-gradient-to-r ${accent.gradientSubtle}`}>
          <div className="space-y-3">
            {/* Row 1: Title + Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                  <ScrollText className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Katalog Szablonów</CardTitle>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Szukaj szablonów..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-sm w-full"
                />
              </div>
            </div>

            {/* Row 2: Filter tabs — full width, always visible */}
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm flex-wrap">
              <Filter className="h-4 w-4 text-neutral-400 ml-2 flex-shrink-0" />
              {filterButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.value}
                    onClick={() => setActiveFilter(btn.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeFilter === btn.value
                        ? 'bg-cyan-100 text-cyan-700 shadow-sm dark:bg-cyan-900/30 dark:text-cyan-300'
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <LoadingState variant="skeleton" rows={6} message="Ładowanie szablonów..." />
          ) : !templates || templates.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Brak szablonów"
              description="Uruchom seed aby utworzyć domyślne szablony"
            />
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nie znaleziono"
              description="Spróbuj użyć innego wyszukiwania"
            />
          ) : (
            <div className="space-y-8">
              {filteredCategories.map((cat) => {
                const catConfig = CATEGORY_CONFIG[cat];
                const catTemplates = getFilteredTemplates(cat);
                if (!catTemplates || catTemplates.length === 0) return null;

                return (
                  <div key={cat}>
                    {/* Category header */}
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className={`p-1.5 bg-gradient-to-br ${catConfig.gradient} rounded-lg`}>
                        <catConfig.icon className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {TEMPLATE_CATEGORY_LABELS[cat]}
                      </h2>
                      <Badge variant="secondary" className="text-xs">
                        {catTemplates.length}
                      </Badge>
                    </div>

                    {/* Template cards */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {catTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          catConfig={catConfig}
                          onEdit={() => setEditorSlug(template.slug)}
                          onHistory={() => setHistorySlug(template.slug)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Sheet */}
      {editorSlug && (
        <TemplateEditor
          slug={editorSlug}
          open={!!editorSlug}
          onClose={() => setEditorSlug(null)}
        />
      )}

      {/* History Dialog */}
      {historySlug && (
        <TemplateHistory
          slug={historySlug}
          open={!!historySlug}
          onClose={() => setHistorySlug(null)}
        />
      )}
    </PageLayout>
  );
}

// ── Template Card ─────────────────────────────────────

interface TemplateCardProps {
  template: DocumentTemplate;
  catConfig: (typeof CATEGORY_CONFIG)[TemplateCategory];
  onEdit: () => void;
  onHistory: () => void;
}

function TemplateCard({ template, catConfig, onEdit, onHistory }: TemplateCardProps) {
  const varCount = template.availableVars?.length || 0;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-neutral-100 dark:border-neutral-700/50">
      {/* Colored top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${catConfig.gradient}`} />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="text-sm line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </div>
          {template.isRequired ? (
            <Badge variant="destructive" className="text-[10px] gap-1 flex-shrink-0">
              <ShieldAlert className="h-3 w-3" />
              Wymagany
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-1 flex-shrink-0">
              <ShieldCheck className="h-3 w-3" />
              Opcjonalny
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge className={`${catConfig.badgeBg} ${catConfig.badgeText} text-[10px] border-0`}>
            v{template.version}
          </Badge>
          {varCount > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {varCount} {varCount === 1 ? 'zmienna' : varCount < 5 ? 'zmienne' : 'zmiennych'}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground/60 truncate">
            {template.slug}
          </span>
        </div>

        {/* Variables preview */}
        {varCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.availableVars.slice(0, 4).map((v) => (
              <code
                key={v}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono"
              >
                {`{{${v}}}`}
              </code>
            ))}
            {varCount > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{varCount - 4} więcej
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={onEdit}
            className="flex-1 h-9"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edytuj
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onHistory}
            className="h-9"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            Historia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
