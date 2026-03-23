// apps/frontend/components/document-templates/TemplateEditor.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  useDocumentTemplate,
  useUpdateTemplate,
  usePreviewTemplate,
} from '@/hooks/use-document-templates';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import {
  EditorHeader,
  VariablePicker,
  EditorToolbar,
  TemplatePreview,
  SaveDialog,
  CloseDialog,
  SAMPLE_VARS,
  MD_TOOLBAR,
} from './editor';
import type { ToolbarAction, EditorMode } from './editor';

// ── Props ───────────────────────────────────────────────

interface TemplateEditorProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

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

  // Detect template format
  const templateFormat = template?.format || (
    template?.category === 'EMAIL_LAYOUT' ? 'HTML' :
    template?.category === 'PDF_LAYOUT_CONFIG' ? 'JSON' : 'MARKDOWN'
  );
  const isMarkdown = templateFormat === 'MARKDOWN';
  const isHtml = templateFormat === 'HTML';
  const isJson = templateFormat === 'JSON';

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

  // Local preview (client-side variable substitution for instant feedback)
  const localPreview = useMemo(() => {
    let result = content;
    for (const [key, value] of Object.entries(SAMPLE_VARS)) {
      result = result.split(`{{${key}}}`).join(value);
    }
    return result;
  }, [content]);

  // Open save dialog (with change reason)
  const handleSaveClick = useCallback(() => {
    // Block save if JSON is invalid
    if (isJson && jsonError) return;
    setChangeReason('');
    setShowSaveDialog(true);
  }, [isJson, jsonError]);

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
  }, [open, hasChanges, applyToolbarAction, handleSaveClick]);

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
              <EditorHeader
                templateName={template.name}
                templateSlug={template.slug}
                templateDescription={template.description}
                templateVersion={template.version}
                hasChanges={hasChanges}
                isJson={isJson}
                jsonError={jsonError}
                isSaving={updateMutation.isPending}
                editorMode={editorMode}
                onEditorModeChange={setEditorMode}
                onSaveClick={handleSaveClick}
              />

              {/* ── Variables bar ── */}
              <VariablePicker
                availableVars={template.availableVars || []}
                insertedVar={insertedVar}
                onInsert={insertVariable}
              />

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
                      <EditorToolbar
                        editorMode={editorMode}
                        isMarkdown={isMarkdown}
                        isHtml={isHtml}
                        isJson={isJson}
                        templateFormat={templateFormat}
                        onToolbarAction={applyToolbarAction}
                      />
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
                    <TemplatePreview
                      content={content}
                      localPreview={localPreview}
                      isHtml={isHtml}
                      isJson={isJson}
                      isMarkdown={isMarkdown}
                      jsonError={jsonError}
                    />
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
      <SaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        changeReason={changeReason}
        onChangeReasonChange={setChangeReason}
        onConfirmSave={handleConfirmSave}
        isPending={updateMutation.isPending}
      />

      {/* ── Unsaved changes dialog ── */}
      <CloseDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirmClose={() => {
          setShowCloseDialog(false);
          setHasChanges(false);
          onClose();
        }}
      />
    </>
  );
}
