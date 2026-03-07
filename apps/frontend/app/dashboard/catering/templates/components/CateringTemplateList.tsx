// apps/frontend/app/dashboard/catering/templates/components/CateringTemplateList.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Pencil,
  Trash2,
  Package,
  Settings2,
  BadgeCheck,
  BadgeX,
  Star,
} from 'lucide-react';
import { useDeleteCateringTemplate } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { CateringTemplate } from '@/types/catering.types';

interface Props {
  templates: CateringTemplate[];
  onEdit: (template: CateringTemplate) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 360,
      damping: 28,
      delay: i * 0.05,
    },
  }),
};

export function CateringTemplateList({ templates, onEdit }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteCateringTemplate();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((template, i) => {
          const packages = template.packages ?? [];
          const previewPkgs = packages.slice(0, 3);
          const remaining = packages.length - previewPkgs.length;

          return (
            <motion.div
              key={template.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="group relative rounded-xl border-2 bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:shadow-md"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base truncate">
                      {template.name}
                    </span>
                    {template.isActive ? (
                      <BadgeCheck className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <BadgeX className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    /{template.slug}
                  </p>
                </div>
                <Badge
                  variant={template.isActive ? 'default' : 'secondary'}
                  className="shrink-0 text-xs"
                >
                  {template.isActive ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
              </div>

              {/* Description */}
              {template.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              {/* Packages preview */}
              <div className="space-y-1.5 mb-4 min-h-[2rem]">
                {previewPkgs.length > 0 ? (
                  <>
                    {previewPkgs.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium truncate">{pkg.name}</span>
                          {pkg.isPopular && (
                            <Star className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                          {pkg.badgeText && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0"
                            >
                              {pkg.badgeText}
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold text-primary shrink-0 ml-2">
                          {pkg.basePrice.toFixed(2)} zł
                          <span className="text-muted-foreground font-normal ml-1">
                            / {CATERING_PRICE_TYPE_LABELS[pkg.priceType]}
                          </span>
                        </span>
                      </div>
                    ))}
                    {remaining > 0 && (
                      <p className="text-xs text-muted-foreground pl-1">
                        +{remaining} więcej pakiet{remaining === 1 ? '' : 'ów'}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
                    <Package className="h-3.5 w-3.5" />
                    <span>Brak pakietów</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() =>
                    router.push(
                      `/dashboard/catering/templates/${template.id}/packages`,
                    )
                  }
                >
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                  Pakiety
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => onEdit(template)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteId(template.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń szablon?</AlertDialogTitle>
            <AlertDialogDescription>
              Spowoduje to usunięcie szablonu wraz ze wszystkimi pakietami i
              sekcjami. Tej operacji nie można cofnąć.
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
