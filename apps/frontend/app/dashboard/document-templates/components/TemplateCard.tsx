'use client';

import {
  ShieldCheck,
  ShieldAlert,
  Pencil,
  History,
  Tag,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EntityCard } from '@/components/shared';
import type { DocumentTemplate, TemplateCategory } from '@/types/document-template.types';
import { CATEGORY_CONFIG } from './template-config';

interface TemplateCardProps {
  template: DocumentTemplate;
  catConfig: (typeof CATEGORY_CONFIG)[TemplateCategory];
  onEdit: () => void;
  onHistory: () => void;
  onDelete: () => void;
}

export function TemplateCard({ template, catConfig, onEdit, onHistory, onDelete }: TemplateCardProps) {
  const varCount = template.availableVars?.length || 0;

  return (
    <EntityCard accentGradient={catConfig.gradient}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-neutral-100">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          {template.isRequired ? (
            <Badge variant="destructive" className="text-[10px] gap-1 flex-shrink-0">
              <ShieldAlert className="h-3 w-3" />
              Wymagany
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-1 flex-shrink-0">
              <ShieldCheck className="h-3 w-3" />
              Opcjonalny
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-3">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge className={`${catConfig.badgeBg} ${catConfig.badgeText} text-[10px] border-0`}>
            v{template.version}
          </Badge>
          {varCount > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {varCount} {varCount === 1 ? 'zmienna' : varCount < 5 ? 'zmienne' : 'zmiennych'}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground/60 truncate">
            {template.slug}
          </span>
        </div>

        {/* Variables preview */}
        {varCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.availableVars.slice(0, 4).map((v) => (
              <code
                key={v}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono"
              >
                {`{{${v}}}`}
              </code>
            ))}
            {varCount > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{varCount - 4} więcej
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={onEdit}
            className="flex-1 h-9"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edytuj
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onHistory}
            className="h-9"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            Historia
          </Button>
          {!template.isRequired && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </EntityCard>
  );
}
