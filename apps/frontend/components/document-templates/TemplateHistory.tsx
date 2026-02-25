// apps/frontend/components/document-templates/TemplateHistory.tsx
'use client';

import { useState } from 'react';
import {
  History,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ScrollText,
  Crown,
  Eye,
  RotateCcw,
} from 'lucide-react';
import {
  useDocumentTemplate,
  useTemplateHistory,
  useRestoreTemplate,
} from '@/hooks/use-document-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import type { DocumentTemplateHistory } from '@/types/document-template.types';

// ── Props ───────────────────────────────────────────

interface TemplateHistoryProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────

export function TemplateHistory({ slug, open, onClose }: TemplateHistoryProps) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);

  const { data: template } = useDocumentTemplate(slug);
  const { data: historyData, isLoading } = useTemplateHistory(slug, page, 10);
  const restoreMutation = useRestoreTemplate();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRestore = async () => {
    if (restoreVersion === null) return;
    await restoreMutation.mutateAsync({ slug, version: restoreVersion });
    setRestoreVersion(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
          {/* Gradient header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5 border-b">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <History className="h-4 w-4 text-white" />
                </div>
                Historia zmian
              </DialogTitle>
              <DialogDescription
                className={cn(
                  'flex items-center gap-2 mt-1',
                  !template && 'sr-only'
                )}
              >
                {template ? (
                  <>
                    <ScrollText className="h-3.5 w-3.5" />
                    {template.name}
                    <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-[10px] border-0">
                      Aktualna: v{template.version}
                    </Badge>
                  </>
                ) : (
                  'Historia zmian szablonu dokumentu'
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-3" />
                <p className="text-sm text-muted-foreground">Ładowanie historii...</p>
              </div>
            ) : historyData && historyData.items.length > 0 ? (
              <div className="space-y-3">
                {/* Current version badge */}
                <div className="flex items-center gap-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 p-4">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-sm">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Wersja {template?.version} — aktualna
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Edytuj w zakładce Edycja aby utworzyć nową wersję
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[23px] top-4 bottom-4 w-px bg-neutral-200 dark:bg-neutral-700" />

                  <div className="space-y-2">
                    {historyData.items.map((entry, index) => (
                      <HistoryEntry
                        key={entry.id}
                        entry={entry}
                        isExpanded={expandedId === entry.id}
                        onToggle={() => toggleExpand(entry.id)}
                        onRestore={() => setRestoreVersion(entry.version)}
                        isFirst={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {historyData.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Strona {historyData.page} z {historyData.totalPages}
                      {' • '}
                      {historyData.total} wpisów
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPage((p) =>
                            Math.min(historyData.totalPages, p + 1)
                          )
                        }
                        disabled={page === historyData.totalPages}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage(historyData.totalPages)}
                        disabled={page === historyData.totalPages}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronsRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-2xl mb-4">
                  <History className="h-10 w-10 opacity-50" />
                </div>
                <p className="text-sm font-medium">Brak historii zmian</p>
                <p className="text-xs mt-1 text-center max-w-xs">
                  Historia pojawi się automatycznie po pierwszej edycji szablonu.
                  Każdy zapis tworzy nową wersję.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Restore Confirmation Dialog ── */}
      <AlertDialog
        open={restoreVersion !== null}
        onOpenChange={() => setRestoreVersion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-cyan-600" />
              Przywróć wersję {restoreVersion}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Aktualna treść szablonu zostanie zarchiwizowana w historii, a następnie
              zastąpiona treścią z wersji <strong>v{restoreVersion}</strong>.
              Numer wersji zostanie zwiększony. Żadne dane nie zostaną utracone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              {restoreMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Przywróć wersję
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── History Entry ─────────────────────────────────

interface HistoryEntryProps {
  entry: DocumentTemplateHistory;
  isExpanded: boolean;
  onToggle: () => void;
  onRestore: () => void;
  isFirst: boolean;
}

function HistoryEntry({ entry, isExpanded, onToggle, onRestore, isFirst }: HistoryEntryProps) {
  const date = new Date(entry.createdAt);
  const initials = `${entry.changedBy.firstName?.[0] || ''}${entry.changedBy.lastName?.[0] || ''}`;

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-[15px] top-4 z-10 h-[18px] w-[18px] rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center',
          isFirst
            ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
            : 'bg-neutral-200 dark:bg-neutral-700'
        )}
      >
        {isFirst && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>

      <div
        className={cn(
          'rounded-xl border transition-all duration-200',
          isExpanded
            ? 'border-cyan-200 dark:border-cyan-800 shadow-sm'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
        )}
      >
        {/* Header — clickable */}
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 p-3.5 text-left rounded-xl hover:bg-muted/30 transition-colors"
        >
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase">
              {initials}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] shrink-0',
                  isFirst && 'border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300'
                )}
              >
                v{entry.version}
              </Badge>
              <span className="text-sm font-medium truncate">
                {entry.changedBy.firstName} {entry.changedBy.lastName}
              </span>
            </div>
            {entry.changeReason && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                📝 {entry.changeReason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {', '}
              {date.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Treść wersji {entry.version}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="h-7 gap-1.5 text-xs text-cyan-700 border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 dark:hover:bg-cyan-950"
                >
                  <RotateCcw className="h-3 w-3" />
                  Przywróć tę wersję
                </Button>
              </div>
              <div className="rounded-lg border bg-muted/20 overflow-hidden">
                <pre className="max-h-72 overflow-y-auto p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                  {entry.content}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
