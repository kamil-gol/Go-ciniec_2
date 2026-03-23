'use client';

import { Code } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MD_TOOLBAR } from './constants';
import type { ToolbarAction, EditorMode } from './types';

interface EditorToolbarProps {
  editorMode: EditorMode;
  isMarkdown: boolean;
  isHtml: boolean;
  isJson: boolean;
  templateFormat: string;
  onToolbarAction: (action: ToolbarAction) => void;
}

export function EditorToolbar({
  editorMode,
  isMarkdown,
  isHtml,
  isJson,
  templateFormat,
  onToolbarAction,
}: EditorToolbarProps) {
  return (
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
                    onClick={() => onToolbarAction(item)}
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
  );
}
