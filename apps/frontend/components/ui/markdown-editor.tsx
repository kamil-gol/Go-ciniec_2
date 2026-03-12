// components/ui/markdown-editor.tsx
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = 'Wpisz opis w formacie Markdown…',
  rows = 6,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <div className={cn('rounded-lg border bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <Button
          type="button"
          variant={tab === 'write' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => setTab('write')}
        >
          <Pencil className="h-3 w-3" />
          Edytuj
        </Button>
        <Button
          type="button"
          variant={tab === 'preview' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => setTab('preview')}
        >
          <Eye className="h-3 w-3" />
          Podgląd
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">Markdown</span>
      </div>

      {/* Write tab */}
      {tab === 'write' && (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="rounded-none rounded-b-lg border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}

      {/* Preview tab */}
      {tab === 'preview' && (
        <div
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none px-3 py-2',
            'min-h-[120px]',
          )}
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic text-sm">Brak treści do podglądu.</p>
          )}
        </div>
      )}
    </div>
  );
}
