'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  BadgeCheck,
  BadgeX,
  Star,
} from 'lucide-react';
import { useDeleteCateringPackage } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { CATERING_PRICE_TYPE_LABELS } from '@/types/catering.types';
import type { CateringPackage } from '@/types/catering.types';
import { SectionManager } from './SectionManager';

interface Props {
  pkg: CateringPackage;
  templateId: string;
  onEdit: (pkg: CateringPackage) => void;
}

export function PackageCard({ pkg, templateId, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteCateringPackage(templateId);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(pkg.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-3 text-left flex-1 min-w-0"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{pkg.name}</span>
                {pkg.badgeText && (
                  <Badge variant="secondary" className="text-xs">
                    {pkg.badgeText}
                  </Badge>
                )}
                {pkg.isPopular && (
                  <Badge className="text-xs gap-1">
                    <Star className="h-3 w-3" />
                    Popularny
                  </Badge>
                )}
                {pkg.isActive ? (
                  <BadgeCheck className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <BadgeX className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
              {pkg.shortDescription && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {pkg.shortDescription}
                </p>
              )}
            </div>
            <div className="ml-auto mr-3 flex items-center gap-3 text-sm text-muted-foreground shrink-0">
              <span>{CATERING_PRICE_TYPE_LABELS[pkg.priceType]}</span>
              <span className="font-medium text-foreground">
                {pkg.basePrice.toFixed(2)} zł
              </span>
              {(pkg.minGuests != null || pkg.maxGuests != null) && (
                <span className="text-xs">
                  {pkg.minGuests ?? '–'}–{pkg.maxGuests ?? '∞'} os.
                </span>
              )}
              <span className="text-xs">
                {pkg.sections?.length ?? 0}{' '}
                {(pkg.sections?.length ?? 0) === 1 ? 'sekcja' : 'sekcji'}
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
              <DropdownMenuItem onClick={() => onEdit(pkg)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edytuj pakiet
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń pakiet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {expanded && (
          <div className="border-t px-4 pb-4 pt-3">
            <SectionManager pkg={pkg} templateId={templateId} />
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Usuń pakiet &quot;{pkg.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Usunięcie pakietu spowoduje usunięcie wszystkich sekcji i opcji
              dań. Operacji nie można cofnąć.
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
