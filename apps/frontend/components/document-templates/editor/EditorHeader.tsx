'use client';

import {
  Save,
  Loader2,
  AlertTriangle,
  ScrollText,
  Code,
  SplitSquareVertical,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { EditorMode } from './types';

interface EditorHeaderProps {
  templateName: string;
  templateSlug: string;
  templateDescription?: string;
  templateVersion: number;
  hasChanges: boolean;
  isJson: boolean;
  jsonError: string | null;
  isSaving: boolean;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  onSaveClick: () => void;
}

export function EditorHeader({
  templateName,
  templateSlug,
  templateDescription,
  templateVersion,
  hasChanges,
  isJson,
  jsonError,
  isSaving,
  editorMode,
  onEditorModeChange,
  onSaveClick,
}: EditorHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                <ScrollText className="h-4 w-4 text-white" />
              </div>
              {templateName}
              <Badge variant="secondary" className="text-xs">
                v{templateVersion}
              </Badge>
              {hasChanges && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs gap-1 border-0">
                  <AlertTriangle className="h-3 w-3" />
                  Niezapisane
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className={cn('text-sm', !templateDescription && 'sr-only')}>
              {templateDescription || 'Edycja szablonu dokumentu'}
            </SheetDescription>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            onClick={onSaveClick}
            disabled={!hasChanges || isSaving || (isJson && !!jsonError)}
            size="sm"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm"
          >
            {isSaving ? (
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
              onClick={() => onEditorModeChange('edit')}
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
              onClick={() => onEditorModeChange('split')}
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
              onClick={() => onEditorModeChange('preview')}
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
            {templateSlug}
          </span>
        </div>
      </div>
    </div>
  );
}
