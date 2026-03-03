// apps/frontend/src/app/dashboard/catering/templates/components/CateringTemplateList.tsx
'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Package, BadgeCheck, BadgeX, ChevronDown, ChevronRight } from 'lucide-react';
import { useDeleteCateringTemplate } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { CATERING_PRICE_TYPE_LABELS } from '@/types/catering.types';
import type { CateringTemplate, CateringPackage } from '@/types/catering.types';

interface Props {
  templates: CateringTemplate[];
  onEdit: (template: CateringTemplate) => void;
}

export function CateringTemplateList({ templates, onEdit }: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteCateringTemplate();

  const toggle = (id: string) =>
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <>
      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border bg-card shadow-sm"
          >
            {/* Template header */}
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => toggle(template.id)}
                className="flex items-center gap-3 text-left flex-1"
              >
                {expanded.includes(template.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{template.name}</span>
                    {template.isActive ? (
                      <BadgeCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <BadgeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                      /{template.slug}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="ml-auto mr-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {template.packages?.length ?? 0}{' '}
                    {template.packages?.length === 1 ? 'pakiet' : 'pakiety/ów'}
                  </span>
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Packages */}
            {expanded.includes(template.id) && (
              <div className="border-t px-4 pb-4 pt-3">
                {template.packages && template.packages.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Pakiety
                    </p>
                    {template.packages.map((pkg) => (
                      <PackageRow key={pkg.id} pkg={pkg} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Package className="h-4 w-4" />
                    Brak pakietów — dodaj pierwszy pakiet w widoku szczegółów
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń szablon?</AlertDialogTitle>
            <AlertDialogDescription>
              Spowoduje to usunięcie szablonu wraz ze wszystkimi pakietami i sekcjami.
              Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PackageRow({ pkg }: { pkg: CateringPackage }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{pkg.name}</span>
        {pkg.badgeText && (
          <Badge variant="secondary" className="text-xs">{pkg.badgeText}</Badge>
        )}
        {pkg.isPopular && (
          <Badge className="text-xs">Popularny</Badge>
        )}
        {!pkg.isActive && (
          <Badge variant="outline" className="text-xs text-muted-foreground">Nieaktywny</Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>{CATERING_PRICE_TYPE_LABELS[pkg.priceType]}</span>
        <span className="font-medium text-foreground">
          {pkg.basePrice.toFixed(2)} zł
        </span>
        <span className="text-xs">
          {pkg.sections?.length ?? 0} sekcji
        </span>
      </div>
    </div>
  );
}
