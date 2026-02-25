// apps/frontend/components/document-templates/TemplateEditor.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Save,
  Eye,
  Code,
  Loader2,
  Tag,
  AlertTriangle,
  Check,
  ScrollText,
  Sparkles,
  SplitSquareVertical,
} from 'lucide-react';
import {
  useDocumentTemplate,
  useUpdateTemplate,
  usePreviewTemplate,
} from '@/hooks/use-document-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';

// ── Props ───────────────────────────────────────────────

interface TemplateEditorProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

// ── Human-readable variable labels ─────────────────────

const VAR_LABELS: Record<string, string> = {
  hallName: 'Nazwa sali',
  eventDate: 'Data wydarzenia',
  guestCount: 'Liczba gości',
  depositAmount: 'Kwota zaliczki',
  depositDueDate: 'Termin zaliczki',
  companyName: 'Nazwa firmy',
  generatedDate: 'Data wygenerowania',
  clientName: 'Imię i nazwisko klienta',
  clientEmail: 'E-mail klienta',
  clientPhone: 'Telefon klienta',
  eventType: 'Typ wydarzenia',
  totalPrice: 'Cena całkowita',
  menuName: 'Nazwa menu',
  cateringDate: 'Data cateringu',
  servingCount: 'Liczba porcji',
  cancellationDays: 'Dni na anulowanie',
  cancellationFee: 'Opłata za anulowanie',
  companyAddress: 'Adres firmy',
  companyNIP: 'NIP firmy',
  companyPhone: 'Telefon firmy',
  companyEmail: 'E-mail firmy',
  companyBankName: 'Nazwa banku',
  companyBankAccount: 'Numer konta',
  remainingAmount: 'Pozostała kwota',
  effectiveDate: 'Data obowiązywania',
};

// ── Sample variable values for preview ─────────────────

const SAMPLE_VARS: Record<string, string> = {
  hallName: 'Sala Złota',
  eventDate: '15 czerwca 2026',
  guestCount: '120',
  depositAmount: '5 000 zł',
  depositDueDate: '15 marca 2026',
  companyName: 'Gościniec Rodzinny',
  generatedDate: '25 lutego 2026',
  clientName: 'Jan Kowalski',
  clientEmail: 'jan@example.com',
  clientPhone: '+48 600 123 456',
  eventType: 'Wesele',
  totalPrice: '25 000 zł',
  menuName: 'Pakiet Premium',
  cateringDate: '15 czerwca 2026',
  servingCount: '120',
  cancellationDays: '30',
  cancellationFee: '50%',
  companyAddress: 'ul. Weselna 12, 00-001 Warszawa',
  companyNIP: '123-456-78-90',
  companyPhone: '+48 22 123 45 67',
  companyEmail: 'kontakt@gosciniec.pl',
  companyBankName: 'Bank PKO BP',
  companyBankAccount: '12 3456 7890 1234 5678 9012 3456',
  remainingAmount: '20 000 zł',
  effectiveDate: '1 marca 2026',
};

type EditorMode = 'edit' | 'split' | 'preview';

// ── Component ─────────────────────────────────────────

export function TemplateEditor({ slug, open, onClose }: TemplateEditorProps) {
  const { data: template, isLoading } = useDocumentTemplate(slug);
  const updateMutation = useUpdateTemplate();
  const previewMutation = usePreviewTemplate();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('split');
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [insertedVar, setInsertedVar] = useState<string | null>(null);

  // Load template content
  useEffect(() => {
    if (template) {
      setContent(template.content);
      setHasChanges(false);
    }
  }, [template]);

  // Auto-preview when content changes (debounced)
  useEffect(() => {
    if (!template || editorMode === 'edit') return;
    const timer = setTimeout(() => {
      previewMutation.mutate({
        slug: template.slug,
        variables: SAMPLE_VARS,
      });
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editorMode, template?.slug]);

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

  // Insert variable at cursor position
  const insertVariable = useCallback(
    (varName: string) => {
      const textarea = textareaRef.current;
      const tag = `{{${varName}}}`;

      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = content.substring(0, start);
        const after = content.substring(end);
        const newContent = before + tag + after;

        setContent(newContent);
        setHasChanges(newContent !== template?.content);

        // Restore cursor after tag
        requestAnimationFrame(() => {
          textarea.focus();
          const newPos = start + tag.length;
          textarea.setSelectionRange(newPos, newPos);
        });
      } else {
        setContent((prev) => prev + tag);
        setHasChanges(true);
      }

      setInsertedVar(varName);
      setTimeout(() => setInsertedVar(null), 1200);
    },
    [content, template?.content]
  );

  // Close with unsaved warning
  const handleClose = () => {
    if (hasChanges) {
      setShowCloseDialog(true);
    } else {
      onClose();
    }
  };

  // Local preview (client-side variable substitution for instant feedback)
  const localPreview = useMemo(() => {
    let result = content;
    for (const [key, value] of Object.entries(SAMPLE_VARS)) {
      result = result.replaceAll(`{{${key}}}`, value);
    }
    return result;
  }, [content]);

  // ── Render ───────────────────────────────────────

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-5xl p-0 flex flex-col overflow-hidden"
          aria-describedby={template?.description ? undefined : undefined}
        >
          {/* ── A11y: always render title + description for Radix/screen readers ── */}
          {!template && (
            <>
              <SheetTitle className="sr-only">
                {isLoading ? 'Ładowanie szablonu...' : 'Edytor szablonu'}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {isLoading ? 'Trwa ładowanie danych szablonu' : 'Nie znaleziono szablonu'}
              </SheetDescription>
            </>
          )}

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : template ? (
            <>
              {/* ── Header ── */}
              <div className="flex-shrink-0 border-b bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5">
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <SheetTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                          <ScrollText className="h-4 w-4 text-white" />
                        </div>
                        {template.name}
                        <Badge variant="secondary" className="text-xs">
                          v{template.version}
                        </Badge>
                        {hasChanges && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs gap-1 border-0">
                            <AlertTriangle className="h-3 w-3" />
                            Niezapisane
                          </Badge>
                        )}
                      </SheetTitle>
                      <SheetDescription className={cn('text-sm', !template.description && 'sr-only')}>
                        {template.description || 'Edycja szablonu dokumentu'}
                      </SheetDescription>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || updateMutation.isPending}
                      size="sm"
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Zapisz
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                      <button
                        onClick={() => setEditorMode('edit')}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                          editorMode === 'edit'
                            ? 'bg-white dark:bg-neutral-800 shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Code className="h-3.5 w-3.5" />
                        Edycja
                      </button>
                      <button
                        onClick={() => setEditorMode('split')}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                          editorMode === 'split'
                            ? 'bg-white dark:bg-neutral-800 shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <SplitSquareVertical className="h-3.5 w-3.5" />
                        Podzielony
                      </button>
                      <button
                        onClick={() => setEditorMode('preview')}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                          editorMode === 'preview'
                            ? 'bg-white dark:bg-neutral-800 shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Podgląd
                      </button>
                    </div>

                    <div className="flex-1" />

                    {/* Slug */}
                    <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                      {template.slug}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Variables bar ── */}
              {template.availableVars && template.availableVars.length > 0 && (
                <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-3">
                  <p className="mb-2 text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Dostępne zmienne
                    <span className="text-muted-foreground/60">
                      — kliknij aby wstawić w pozycji kursora
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.availableVars.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                          'text-xs transition-all duration-200 cursor-pointer',
                          'border border-neutral-200 dark:border-neutral-700',
                          'hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700',
                          'dark:hover:border-cyan-700 dark:hover:bg-cyan-950 dark:hover:text-cyan-300',
                          insertedVar === v
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-neutral-800 text-foreground'
                        )}
                        title={VAR_LABELS[v] || v}
                      >
                        {insertedVar === v ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Tag className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-medium">{VAR_LABELS[v] || v}</span>
                        <code className="text-[10px] text-muted-foreground/60 font-mono">
                          {`{{${v}}}`}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Editor / Preview area ── */}
              <div className="flex-1 overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    editorMode === 'split'
                      ? 'grid grid-cols-1 md:grid-cols-2'
                      : 'flex flex-col'
                  )}
                >
                  {/* Editor panel */}
                  {(editorMode === 'edit' || editorMode === 'split') && (
                    <div
                      className={cn(
                        'flex flex-col overflow-hidden flex-1 min-h-0',
                        editorMode === 'split' && 'border-r'
                      )}
                    >
                      {editorMode === 'split' && (
                        <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Code className="h-3 w-3" />
                            Edycja treści
                          </p>
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden min-h-0">
                        <textarea
                          ref={textareaRef}
                          value={content}
                          onChange={(e) => handleContentChange(e.target.value)}
                          className="w-full h-full resize-none border-0 bg-background px-6 py-4 text-sm font-mono leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none"
                          placeholder="Treść szablonu..."
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview panel */}
                  {(editorMode === 'preview' || editorMode === 'split') && (
                    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
                      <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Eye className="h-3 w-3" />
                          Podgląd z przykładowymi danymi
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <div className="p-4 sm:p-6">
                          <div className="rounded-xl border bg-white dark:bg-neutral-950 p-6 shadow-sm">
                            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                              {localPreview}
                            </pre>
                          </div>
                          {/* Unfilled variables warning */}
                          {content.match(/\{\{\w+\}\}/g)?.some(
                            (match) => {
                              const varName = match.slice(2, -2);
                              return !SAMPLE_VARS[varName];
                            }
                          ) && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                  Niektóre zmienne nie mają przykładowych danych
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {content.match(/\{\{\w+\}\}/g)
                                    ?.filter((match) => !SAMPLE_VARS[match.slice(2, -2)])
                                    .filter((v, i, a) => a.indexOf(v) === i)
                                    .map((match) => (
                                      <code
                                        key={match}
                                        className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-mono text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                      >
                                        {match}
                                      </code>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex-shrink-0 border-t bg-muted/20 px-6 py-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Ostatnia zmiana:{' '}
                  {new Date(template.updatedAt).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Używaj <code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{zmienna}}`}</code> do wstawiania dynamicznych wartości
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Nie znaleziono szablonu
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Unsaved changes dialog ── */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Niezapisane zmiany</AlertDialogTitle>
            <AlertDialogDescription>
              Masz niezapisane zmiany w szablonie. Czy na pewno chcesz zamknąć
              edytor? Zmiany zostaną utracone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Wróć do edycji</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCloseDialog(false);
                setHasChanges(false);
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Zamknij bez zapisu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
