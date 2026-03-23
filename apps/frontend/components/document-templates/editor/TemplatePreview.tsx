'use client';

import { Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SAMPLE_VARS } from './constants';

interface TemplatePreviewProps {
  content: string;
  localPreview: string;
  isHtml: boolean;
  isJson: boolean;
  isMarkdown: boolean;
  jsonError: string | null;
}

export function TemplatePreview({
  content,
  localPreview,
  isHtml,
  isJson,
  isMarkdown,
  jsonError,
}: TemplatePreviewProps) {
  return (
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
  );
}
