// apps/frontend/components/document-templates/TemplateHistory.tsx
'use client';

import { useState } from 'react';
import {
  History,
  Loader2,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  FileText,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  useDocumentTemplate,
  useTemplateHistory,
} from '@/hooks/use-document-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { DocumentTemplateHistory } from '@/types/document-template.types';

// ── Props ───────────────────────────────────────────────

interface TemplateHistoryProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────

export function TemplateHistory({ slug, open, onClose }: TemplateHistoryProps) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: template } = useDocumentTemplate(slug);
  const { data: historyData, isLoading } = useTemplateHistory(slug, page, 10);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historia zmian
          </DialogTitle>
          {template && (
            <DialogDescription>
              {template.name}
              <Badge variant="secondary" className="ml-2">
                Aktualna: v{template.version}
              </Badge>
            </DialogDescription>
          )}
        </DialogHeader>

        <Separator />

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : historyData && historyData.items.length > 0 ? (
          <div className="space-y-2">
            {/* Current version indicator */}
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
              <Badge className="bg-primary text-primary-foreground">
                v{template?.version}
              </Badge>
              <span className="text-sm font-medium">Aktualna wersja</span>
              <span className="text-xs text-muted-foreground">
                (edytuj w zakładce Edycja)
              </span>
            </div>

            {/* History entries */}
            {historyData.items.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => toggleExpand(entry.id)}
              />
            ))}

            {/* Pagination */}
            {historyData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
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
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
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
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(historyData.totalPages)}
                    disabled={page === historyData.totalPages}
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">Brak historii zmian</p>
            <p className="text-xs mt-1">
              Historia pojawi się po pierwszej edycji szablonu
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── History Entry ───────────────────────────────────────

interface HistoryEntryProps {
  entry: DocumentTemplateHistory;
  isExpanded: boolean;
  onToggle: () => void;
}

function HistoryEntry({ entry, isExpanded, onToggle }: HistoryEntryProps) {
  const date = new Date(entry.createdAt);

  return (
    <div className="rounded-md border">
      {/* Header — clickable */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <Badge variant="outline" className="shrink-0">
          v{entry.version}
        </Badge>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">
              {entry.changedBy.firstName} {entry.changedBy.lastName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
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
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t">
          {entry.changeReason && (
            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
              📝 {entry.changeReason}
            </div>
          )}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              Treść wersji {entry.version}
            </div>
            <pre className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap">
              {entry.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
