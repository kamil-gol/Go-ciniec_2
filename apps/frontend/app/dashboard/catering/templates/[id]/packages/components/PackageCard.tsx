// apps/frontend/app/dashboard/catering/templates/[id]/packages/components/PackageCard.tsx
import { formatCurrency } from '@/lib/utils'
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Pencil, Trash2,
  BadgeCheck, BadgeX, Star,
} from 'lucide-react';
import { useDeleteCateringPackage } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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

  // Prisma Decimal serializuje się jako string przez JSON - zabezpieczenie
  const basePrice = Number(pkg.basePrice);

  const handleDelete = () => {
    deleteMutation.mutate(pkg.id, { onSuccess: () => setDeleteOpen(false) });
  };

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={[
          'rounded-xl border-2 bg-card shadow-sm transition-colors',
          expanded ? 'border-primary/50' : 'border-border hover:border-primary/30',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <button onClick={() => setExpanded((v) => !v)} className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{pkg.name}</span>
              {pkg.isPopular && (
                <Badge className="text-xs gap-1 py-0">
                  <Star className="h-2.5 w-2.5" />Popularny
                </Badge>
              )}
              {pkg.badgeText && (
                <Badge variant="secondary" className="text-xs py-0">{pkg.badgeText}</Badge>
              )}
              {pkg.isActive
                ? <BadgeCheck className="h-4 w-4 text-green-500 shrink-0" />
                : <BadgeX className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
            {pkg.shortDescription && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{pkg.shortDescription}</p>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-3 text-sm shrink-0">
            <span className="text-xs text-muted-foreground">{CATERING_PRICE_TYPE_LABELS[pkg.priceType]}</span>
            <span className="font-bold text-primary text-base">{formatCurrency(basePrice)}</span>
            {(pkg.minGuests != null || pkg.maxGuests != null) && (
              <span className="text-xs text-muted-foreground">
                {pkg.minGuests ?? '–'}–{pkg.maxGuests ?? '∞'} os.
              </span>
            )}
            <span className="text-xs text-muted-foreground">{pkg.sections?.length ?? 0} sekcji</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(pkg)} aria-label="Edytuj pakiet">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
              aria-label="Usuń pakiet"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Mobile row */}
        <div className="sm:hidden flex items-center gap-3 px-4 pb-3 text-sm">
          <span className="text-xs text-muted-foreground">{CATERING_PRICE_TYPE_LABELS[pkg.priceType]}</span>
          <span className="font-bold text-primary">{formatCurrency(basePrice)}</span>
          <span className="text-xs text-muted-foreground">{pkg.sections?.length ?? 0} sekcji</span>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="border-t px-4 pb-4 pt-3">
                <SectionManager pkg={pkg} templateId={templateId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń pakiet &quot;{pkg.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Usunięcie pakietu spowoduje usunięcie wszystkich sekcji i opcji dań. Operacji nie można cofnąć.
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
