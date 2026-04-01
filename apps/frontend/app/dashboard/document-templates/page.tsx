'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  FileText,
  Mail,
  Loader2,
  Search,
  Layers,
  BookOpen,
  Plus,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageLayout, StatCard,
  LoadingState,
  EmptyState,
 } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens';
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type DocumentTemplate,
  type TemplateCategory,
} from '@/types/document-template.types';
import { CATEGORY_CONFIG, toSlug } from './components/template-config';
import { TemplateCard } from './components/TemplateCard';
import { CreateTemplateDialog } from './components/CreateTemplateDialog';
import { DeleteTemplateDialog } from './components/DeleteTemplateDialog';
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type FilterValue = 'all' | TemplateCategory;

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
      <PageHeader
        title="Szablony Dokumentów"
        subtitle="Zarządzanie treścią szablonów PDF, e-mail i regulaminów"
        icon={ScrollText}
      />

      {/* Stats */}
      <div className={layout.statGrid}>
        <StatCard
          label="Wszystkie szablony"
          value={stats.total}
          subtitle="W systemie"
          icon={ScrollText}
          iconGradient={statGradients.count}
          delay={0.1}
        />
        <StatCard
          label="Dokumenty PDF"
          value={stats.pdf}
          subtitle="Rezerwacje i catering"
          icon={FileText}
          iconGradient={statGradients.info}
          delay={0.2}
        />
        <StatCard
          label="Szablony e-mail"
          value={stats.email}
          subtitle="Wiadomości"
          icon={Mail}
          iconGradient={statGradients.info}
          delay={0.3}
        />
        <StatCard
          label="Regulaminy"
          value={stats.policy}
          subtitle="Dokumenty prawne"
          icon={BookOpen}
          iconGradient={statGradients.neutral}
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
            <FilterTabs
              tabs={filterButtons.map((btn) => ({
                key: btn.value,
                label: btn.label,
                count: btn.count,
              }))}
              activeKey={activeFilter}
              onChange={(key) => setActiveFilter(key as FilterValue)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <LoadingState variant="skeleton" rows={6} message="Ładowanie szablonów..." />
          ) : !templates || templates.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Brak szablonów"
              description="Nie ma jeszcze żadnych szablonów dokumentów. Dodaj nowy szablon, aby rozpocząć tworzenie dokumentów PDF, e-mail i regulaminów."
              actionLabel="Dodaj nowy szablon"
              onAction={openCreateDialog}
            />
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nie znaleziono"
              description="Żaden szablon nie pasuje do wyszukiwania. Spróbuj użyć innej frazy lub zmień filtr kategorii."
            />
          ) : (
            <div className="space-y-8">
              {filteredCategories.map((cat) => {
                const catConfig = CATEGORY_CONFIG[cat];
                const catTemplates = getFilteredTemplates(cat);
                if (!catTemplates || catTemplates.length === 0) return null;

                return (
                  <div key={cat}>
                    <Breadcrumb />
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

      {/* Dialogs */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newName={newName}
        onNameChange={handleNameChange}
        newSlug={newSlug}
        onSlugChange={handleSlugChange}
        newDescription={newDescription}
        setNewDescription={setNewDescription}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onCreate={handleCreate}
        isPending={createMutation.isPending}
      />

      <DeleteTemplateDialog
        open={!!deleteSlug}
        onOpenChange={() => setDeleteSlug(null)}
        templateName={deleteTemplateName}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
