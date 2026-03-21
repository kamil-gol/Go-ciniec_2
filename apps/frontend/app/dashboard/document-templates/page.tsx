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
  Plus,
  Trash2,
  LayoutTemplate,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useDocumentTemplates,
  useCreateTemplate,
  useDeleteTemplate,
} from '@/hooks/use-document-templates';
import { TemplateEditor } from '@/components/document-templates/TemplateEditor';
import { TemplateHistory } from '@/components/document-templates/TemplateHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  EMAIL_LAYOUT: {
    icon: LayoutTemplate,
    emoji: '🎨',
    gradient: 'from-rose-500 to-pink-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  PDF_LAYOUT_CONFIG: {
    icon: SlidersHorizontal,
    emoji: '⚙️',
    gradient: 'from-slate-500 to-gray-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/30',
    badgeText: 'text-slate-700 dark:text-slate-300',
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

// ── Slug helper ──────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąĄ]/g, 'a')
    .replace(/[ćĆ]/g, 'c')
    .replace(/[ęĘ]/g, 'e')
    .replace(/[łŁ]/g, 'l')
    .replace(/[ńŃ]/g, 'n')
    .replace(/[óÓ]/g, 'o')
    .replace(/[śŚ]/g, 's')
    .replace(/[źŹżŻ]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// ── Page Component ──────────────────────────────────

export default function DocumentTemplatesPage() {
  const { data: templates, isLoading } = useDocumentTemplates();
  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate();
  const accent = moduleAccents.documentTemplates;

  // State
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TemplateCategory>('RESERVATION_PDF');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Delete dialog state
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleteTemplateName, setDeleteTemplateName] = useState('');

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

  // Handlers
  const openCreateDialog = () => {
    setNewName('');
    setNewSlug('');
    setNewDescription('');
    setNewCategory(activeFilter !== 'all' ? activeFilter : 'RESERVATION_PDF');
    setSlugManuallyEdited(false);
    setShowCreateDialog(true);
  };

  const handleNameChange = (value: string) => {
    setNewName(value);
    if (!slugManuallyEdited) {
      setNewSlug(toSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setNewSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    await createMutation.mutateAsync({
      slug: newSlug,
      name: newName,
      description: newDescription || undefined,
      category: newCategory,
      content: `# ${newName}\n\nTreść szablonu...`,
    });
    setShowCreateDialog(false);
  };

  const handleDelete = async () => {
    if (!deleteSlug) return;
    await deleteMutation.mutateAsync(deleteSlug);
    setDeleteSlug(null);
  };

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
            {/* Row 1: Title + Search + Create */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg`}>
                  <ScrollText className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Katalog Szablonów</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Szukaj szablonów..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9 text-sm w-full"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={openCreateDialog}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm h-9 gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Dodaj nowy blok tekstu</span>
                  <span className="sm:hidden">Dodaj</span>
                </Button>
              </div>
            </div>

            {/* Row 2: Filter tabs */}
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
              description="Uruchom seed aby utworzyć domyślne szablony lub dodaj nowy szablon"
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
                          onDelete={() => {
                            setDeleteSlug(template.slug);
                            setDeleteTemplateName(template.name);
                          }}
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

      {/* ── Create Template Dialog ── */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-600" />
              Nowy blok tekstu
            </AlertDialogTitle>
            <AlertDialogDescription>
              Utwórz nowy szablon dokumentu. Będzie dostępny do edycji po utworzeniu.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="new-name">Nazwa szablonu *</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="np. Informacje o parkingu"
                className="mt-1.5"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="new-slug">
                Slug <span className="text-muted-foreground font-normal">(identyfikator)</span>
              </Label>
              <Input
                id="new-slug"
                value={newSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="np. informacje-o-parkingu"
                className="mt-1.5 font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Używany w kodzie. Tylko małe litery, cyfry i myślniki.
              </p>
            </div>

            <div>
              <Label htmlFor="new-desc">
                Opis <span className="text-muted-foreground font-normal">(opcjonalny)</span>
              </Label>
              <Input
                id="new-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="np. Wyświetlany w PDF rezerwacji pod warunkami"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="new-category">Kategoria *</Label>
              <select
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TemplateCategory)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TEMPLATE_CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {TEMPLATE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreate}
              disabled={!newName.trim() || !newSlug.trim() || createMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Utwórz szablon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteSlug} onOpenChange={() => setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Usuń szablon
            </AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć szablon <strong>„{deleteTemplateName}”</strong>?
              Ta operacja jest nieodwracalna — zostaną usunięte także wszystkie wersje historyczne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Usuń szablon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

// ── Template Card ───────────────────────────────────

interface TemplateCardProps {
  template: DocumentTemplate;
  catConfig: (typeof CATEGORY_CONFIG)[TemplateCategory];
  onEdit: () => void;
  onHistory: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, catConfig, onEdit, onHistory, onDelete }: TemplateCardProps) {
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
          {!template.isRequired && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
