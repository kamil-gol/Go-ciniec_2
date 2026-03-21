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
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  MessageSquare,
} from 'lucide-react';
import {
  useDocumentTemplate,
  useUpdateTemplate,
  usePreviewTemplate,
} from '@/hooks/use-document-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

// ── Markdown toolbar definitions ──────────────────────

interface ToolbarAction {
  icon: typeof Bold;
  label: string;
  shortcut?: string;
  action: 'wrap' | 'prefix' | 'insert';
  before?: string;
  after?: string;
  prefix?: string;
  insert?: string;
}

const MD_TOOLBAR: ToolbarAction[] = [
  { icon: Bold,        label: 'Pogrubienie',      shortcut: 'Ctrl+B', action: 'wrap',   before: '**', after: '**' },
  { icon: Italic,      label: 'Kursywa',          shortcut: 'Ctrl+I', action: 'wrap',   before: '*',  after: '*' },
  { icon: Heading2,    label: 'Nagłówek H2',                          action: 'prefix', prefix: '## ' },
  { icon: Heading3,    label: 'Nagłówek H3',                          action: 'prefix', prefix: '### ' },
  { icon: List,        label: 'Lista punktowa',                       action: 'prefix', prefix: '- ' },
  { icon: ListOrdered, label: 'Lista numerowana',                     action: 'prefix', prefix: '1. ' },
  { icon: Quote,       label: 'Cytat',                                action: 'prefix', prefix: '> ' },
  { icon: Minus,       label: 'Separator',                            action: 'insert', insert: '\n---\n' },
];

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [changeReason, setChangeReason] = useState('');
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

  // Open save dialog (with change reason)
  const handleSaveClick = () => {
    // Block save if JSON is invalid
    if (isJson && jsonError) return;
    setChangeReason('');
    setShowSaveDialog(true);
  };

  // Confirm save with optional reason
  const handleConfirmSave = async () => {
    if (!template) return;
    await updateMutation.mutateAsync({
      slug: template.slug,
      data: {
        content,
        ...(changeReason.trim() ? { changeReason: changeReason.trim() } : {}),
      },
    });
    setHasChanges(false);
    setShowSaveDialog(false);
    setChangeReason('');
  };

  // ── Markdown toolbar action handler ─────────────────

  const applyToolbarAction = useCallback(
    (toolbarAction: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      let newContent = content;
      let newCursorPos = start;

      if (toolbarAction.action === 'wrap') {
        const before = toolbarAction.before || '';
        const after = toolbarAction.after || '';
        if (selectedText) {
          newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
          newCursorPos = start + before.length + selectedText.length + after.length;
        } else {
          const placeholder = toolbarAction.label.toLowerCase();
          newContent = content.substring(0, start) + before + placeholder + after + content.substring(end);
          newCursorPos = start + before.length;
          // Select the placeholder text after insert
          requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
          });
          setContent(newContent);
          setHasChanges(newContent !== template?.content);
          return;
        }
      } else if (toolbarAction.action === 'prefix') {
        const prefix = toolbarAction.prefix || '';
        // Find start of line
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
        newCursorPos = start + prefix.length;
      } else if (toolbarAction.action === 'insert') {
        const insert = toolbarAction.insert || '';
        newContent = content.substring(0, start) + insert + content.substring(end);
        newCursorPos = start + insert.length;
      }

      setContent(newContent);
      setHasChanges(newContent !== template?.content);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [content, template?.content]
  );

  // ── Keyboard shortcuts ──────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'b') {
        e.preventDefault();
        applyToolbarAction(MD_TOOLBAR[0]); // Bold
      } else if (isMod && e.key === 'i') {
        e.preventDefault();
        applyToolbarAction(MD_TOOLBAR[1]); // Italic
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        if (hasChanges) handleSaveClick();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, hasChanges, applyToolbarAction]);

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

  // Detect template format
  const templateFormat = template?.format || (
    template?.category === 'EMAIL_LAYOUT' ? 'HTML' :
    template?.category === 'PDF_LAYOUT_CONFIG' ? 'JSON' : 'MARKDOWN'
  );
  const isMarkdown = templateFormat === 'MARKDOWN';
  const isHtml = templateFormat === 'HTML';
  const isJson = templateFormat === 'JSON';

  // Local preview (client-side variable substitution for instant feedback)
  const localPreview = useMemo(() => {
    let result = content;
    for (const [key, value] of Object.entries(SAMPLE_VARS)) {
      result = result.split(`{{${key}}}`).join(value);
    }
    return result;
  }, [content]);

  // JSON validation for PDF config templates
  const jsonError = useMemo(() => {
    if (!isJson) return null;
    try {
      JSON.parse(content);
      return null;
    } catch (e: any) {
      return e.message as string;
    }
  }, [content, isJson]);

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
                      onClick={handleSaveClick}
                      disabled={!hasChanges || updateMutation.isPending || (isJson && !!jsonError)}
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
                      {/* ── Toolbar (Markdown only) / Format label ── */}
                      <div className="flex-shrink-0 px-4 py-1.5 border-b bg-muted/20 flex items-center gap-0.5">
                        {editorMode === 'split' && (
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mr-2">
                            <Code className="h-3 w-3" />
                            {isHtml ? 'Edycja HTML' : isJson ? 'Edycja JSON' : 'Edycja treści'}
                          </p>
                        )}
                        {isMarkdown && (
                          <>
                            <Separator orientation="vertical" className="h-4 mx-1" />
                            <TooltipProvider delayDuration={300}>
                              {MD_TOOLBAR.map((item, idx) => (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => applyToolbarAction(item)}
                                      className={cn(
                                        'p-1.5 rounded-md text-muted-foreground transition-colors',
                                        'hover:bg-neutral-200/60 hover:text-foreground',
                                        'dark:hover:bg-neutral-700/60 dark:hover:text-foreground'
                                      )}
                                    >
                                      <item.icon className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-xs">
                                    {item.label}
                                    {item.shortcut && (
                                      <kbd className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-muted font-mono">
                                        {item.shortcut}
                                      </kbd>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          </>
                        )}
                        {!isMarkdown && (
                          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {templateFormat}
                          </span>
                        )}
                      </div>
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
                          {isHtml ? 'Podgląd HTML' : isJson ? 'Podgląd konfiguracji' : 'Podgląd z przykładowymi danymi'}
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <div className="p-4 sm:p-6">
                          {/* HTML preview (rendered) */}
                          {isHtml && (
                            <div className="rounded-xl border bg-white dark:bg-neutral-950 shadow-sm overflow-hidden">
                              <iframe
                                srcDoc={localPreview}
                                className="w-full border-0"
                                style={{ minHeight: '500px' }}
                                title="Podgląd layoutu email"
                                sandbox=""
                              />
                            </div>
                          )}
                          {/* JSON preview (formatted + validation) */}
                          {isJson && (
                            <>
                              {jsonError && (
                                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-red-800 dark:text-red-200">
                                      Nieprawidłowy JSON
                                    </p>
                                    <code className="text-[10px] font-mono text-red-700 dark:text-red-300">
                                      {jsonError}
                                    </code>
                                  </div>
                                </div>
                              )}
                              {!jsonError && (() => {
                                try {
                                  const parsed = JSON.parse(content);
                                  return (
                                    <div className="rounded-xl border bg-white dark:bg-neutral-950 p-6 shadow-sm space-y-4">
                                      {/* Colors preview */}
                                      {parsed.colors && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Kolory</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {Object.entries(parsed.colors).map(([name, color]) => (
                                              <div key={name} className="flex items-center gap-1.5 text-xs">
                                                <div
                                                  className="w-4 h-4 rounded border"
                                                  style={{ backgroundColor: color as string }}
                                                />
                                                <span className="font-mono text-muted-foreground">{name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {/* Sections preview */}
                                      {parsed.sections && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Sekcje</h4>
                                          <div className="space-y-1">
                                            {[...parsed.sections].sort((a: any, b: any) => a.order - b.order).map((section: any) => (
                                              <div
                                                key={section.id}
                                                className={cn(
                                                  'flex items-center gap-2 px-3 py-1.5 rounded text-xs',
                                                  section.enabled
                                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : 'bg-neutral-100 text-neutral-400 line-through dark:bg-neutral-900 dark:text-neutral-600'
                                                )}
                                              >
                                                <span className="font-mono text-[10px] text-muted-foreground w-4">{section.order}.</span>
                                                <span className="font-medium">{section.id}</span>
                                                <span className="ml-auto text-[10px]">{section.enabled ? '✓' : '✗'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                } catch { return null; }
                              })()}
                            </>
                          )}
                          {/* Markdown preview (default) */}
                          {isMarkdown && (
                            <div className="rounded-xl border bg-white dark:bg-neutral-950 p-6 shadow-sm">
                              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                                {localPreview}
                              </pre>
                            </div>
                          )}
                          {/* Unfilled variables warning (markdown/HTML only) */}
                          {!isJson && content.match(/\{\{\w+\}\}/g)?.some(
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

      {/* ── Save with change reason dialog ── */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-600" />
              Zapisz zmiany
            </AlertDialogTitle>
            <AlertDialogDescription>
              Opcjonalnie opisz co zostało zmienione. Powód będzie widoczny w historii wersji.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="change-reason" className="text-sm font-medium">
              Powód zmiany <span className="text-muted-foreground font-normal">(opcjonalny)</span>
            </Label>
            <Input
              id="change-reason"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="np. Zaktualizowano warunki płatności..."
              className="mt-1.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmSave();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Zapisz wersję
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
