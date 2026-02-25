// apps/frontend/components/document-templates/TemplateEditor.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Eye,
  Code,
  Loader2,
  Tag,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import {
  useDocumentTemplate,
  useUpdateTemplate,
  usePreviewTemplate,
} from '@/hooks/use-document-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { toast } from '@/lib/toast';

// ── Props ───────────────────────────────────────────────

interface TemplateEditorProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

// ── Sample variable values for preview ───────────────────

const SAMPLE_VARS: Record<string, string> = {
  hallName: 'Sala Złota',
  eventDate: '2026-06-15',
  guestCount: '120',
  depositAmount: '5 000',
  depositDueDate: '2026-03-15',
  companyName: 'Gościniec Rodzinny',
  generatedDate: '2026-02-25',
  clientName: 'Jan Kowalski',
  clientEmail: 'jan@example.com',
  clientPhone: '+48 600 123 456',
  eventType: 'Wesele',
  totalPrice: '25 000',
  menuName: 'Pakiet Premium',
  cateringDate: '2026-06-15',
  servingCount: '120',
  cancellationDays: '30',
  cancellationFee: '50%',
};

// ── Component ───────────────────────────────────────────

export function TemplateEditor({ slug, open, onClose }: TemplateEditorProps) {
  const { data: template, isLoading } = useDocumentTemplate(slug);
  const updateMutation = useUpdateTemplate();
  const previewMutation = usePreviewTemplate();

  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Load template content
  useEffect(() => {
    if (template) {
      setContent(template.content);
      setHasChanges(false);
    }
  }, [template]);

  // Track changes
  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      setHasChanges(value !== template?.content);
    },
    [template?.content]
  );

  // Save
  const handleSave = async () => {
    if (!template) return;
    await updateMutation.mutateAsync({
      slug: template.slug,
      data: { content },
    });
    setHasChanges(false);
  };

  // Preview
  const handlePreview = async () => {
    if (!template) return;
    setActiveTab('preview');
    await previewMutation.mutateAsync({
      slug: template.slug,
      variables: SAMPLE_VARS,
    });
  };

  // Insert variable at cursor
  const insertVariable = (varName: string) => {
    const tag = `{{${varName}}}`;
    setContent((prev) => prev + tag);
    setHasChanges(true);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  // Close with unsaved warning
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : template ? (
          <>
            {/* Header */}
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                {template.name}
                <Badge variant="secondary">v{template.version}</Badge>
                {hasChanges && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Niezapisane
                  </Badge>
                )}
              </SheetTitle>
              {template.description && (
                <SheetDescription>{template.description}</SheetDescription>
              )}
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                size="sm"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Zapisz
              </Button>
              <Button
                onClick={handlePreview}
                variant="outline"
                size="sm"
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                )}
                Podgląd
              </Button>
            </div>

            <Separator className="mb-4" />

            {/* Available variables */}
            {template.availableVars && template.availableVars.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Dostępne zmienne
                  <span className="text-muted-foreground">
                    (kliknij aby wstawić)
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {template.availableVars.map((v) => (
                    <button
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-mono hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                      title={`Wstaw {{${v}}}`}
                    >
                      {copiedVar === v ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editor / Preview tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}
            >
              <TabsList className="mb-3">
                <TabsTrigger value="edit" className="gap-1.5">
                  <Code className="h-3.5 w-3.5" />
                  Edycja
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Podgląd
                </TabsTrigger>
              </TabsList>

              {/* Edit tab */}
              <TabsContent value="edit">
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full min-h-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  placeholder="Treść szablonu..."
                  spellCheck={false}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Używaj {'{{nazwaZmiennej}}'} do wstawiania dynamicznych wartości.
                  Formatowanie Markdown jest obsługiwane.
                </p>
              </TabsContent>

              {/* Preview tab */}
              <TabsContent value="preview">
                {previewMutation.isPending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : previewMutation.data ? (
                  <div className="space-y-4">
                    {/* Unfilled vars warning */}
                    {previewMutation.data.unfilledVars.length > 0 && (
                      <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Niewypełnione zmienne
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {previewMutation.data.unfilledVars.map((v) => (
                              <code
                                key={v}
                                className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-mono text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              >
                                {`{{${v}}}`}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rendered content */}
                    <div className="rounded-md border bg-white p-4 dark:bg-zinc-950">
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                        {previewMutation.data.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Eye className="h-8 w-8 mb-2" />
                    <p className="text-sm">Kliknij "Podgląd" aby wyrenderować szablon</p>
                    <p className="text-xs mt-1">
                      Zmienne zostaną podstawione przykładowymi danymi
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer info */}
            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Slug: <code className="font-mono">{template.slug}</code></span>
              <Separator orientation="vertical" className="h-3" />
              <span>
                Ostatnia zmiana:{' '}
                {new Date(template.updatedAt).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Nie znaleziono szablonu
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
