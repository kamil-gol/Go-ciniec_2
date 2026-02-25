// apps/frontend/src/app/dashboard/document-templates/page.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Pencil,
  Eye,
  History,
  Loader2,
  Tag,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/use-document-templates';
import { TemplateEditor } from '@/components/document-templates/TemplateEditor';
import { TemplateHistory } from '@/components/document-templates/TemplateHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type DocumentTemplate,
  type TemplateCategory,
} from '@/types/document-template.types';

// ── Category icon mapping ───────────────────────────────

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  RESERVATION_PDF: '📄',
  CATERING_PDF: '🍽️',
  EMAIL: '✉️',
  POLICY: '📋',
};

// ── Page Component ──────────────────────────────────────

export default function DocumentTemplatesPage() {
  const { data: templates, isLoading } = useDocumentTemplates();

  // Dialog state
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Group templates by category
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

  // Filtered templates based on active tab
  const filteredCategories = useMemo(() => {
    if (activeTab === 'all') return TEMPLATE_CATEGORY_ORDER;
    return [activeTab as TemplateCategory];
  }, [activeTab]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Szablony dokumentów
        </h1>
        <p className="text-muted-foreground">
          Zarządzanie treścią szablonów PDF, e-mail i regulaminów
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            Wszystkie
            {templates && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {templates.length}
              </span>
            )}
          </TabsTrigger>
          {TEMPLATE_CATEGORY_ORDER.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="flex items-center gap-1.5"
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              {TEMPLATE_CATEGORY_LABELS[cat]}
              {grouped[cat] && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {grouped[cat]!.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-8">
              {filteredCategories.map((cat) => {
                const catTemplates = grouped[cat];
                if (!catTemplates || catTemplates.length === 0) return null;

                return (
                  <div key={cat}>
                    {/* Category header (only in 'all' view) */}
                    {activeTab === 'all' && (
                      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <span>{CATEGORY_ICONS[cat]}</span>
                        {TEMPLATE_CATEGORY_LABELS[cat]}
                        <Badge variant="secondary" className="text-xs">
                          {catTemplates.length}
                        </Badge>
                      </h2>
                    )}

                    {/* Template cards grid */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {catTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onEdit={() => setEditorSlug(template.slug)}
                          onHistory={() => setHistorySlug(template.slug)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Brak szablonów</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Uruchom seed aby utworzyć domyślne szablony
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Editor Dialog */}
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
    </div>
  );
}

// ── Template Card ───────────────────────────────────────

interface TemplateCardProps {
  template: DocumentTemplate;
  onEdit: () => void;
  onHistory: () => void;
}

function TemplateCard({ template, onEdit, onHistory }: TemplateCardProps) {
  const varCount = template.availableVars?.length || 0;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {template.isRequired ? (
              <Badge variant="destructive" className="text-xs gap-1">
                <ShieldAlert className="h-3 w-3" />
                Wymagany
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1">
                <ShieldCheck className="h-3 w-3" />
                Opcjonalny
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Meta info */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            v{template.version}
          </Badge>
          {varCount > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {varCount} {varCount === 1 ? 'zmienna' : varCount < 5 ? 'zmienne' : 'zmiennych'}
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground/70">
            {template.slug}
          </span>
        </div>

        {/* Available variables */}
        {varCount > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {template.availableVars.slice(0, 5).map((v) => (
              <code
                key={v}
                className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
              >
                {`{{${v}}}`}
              </code>
            ))}
            {varCount > 5 && (
              <span className="text-xs text-muted-foreground">
                +{varCount - 5} więcej
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={onEdit} className="flex-1">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edytuj
          </Button>
          <Button size="sm" variant="outline" onClick={onHistory}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            Historia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
