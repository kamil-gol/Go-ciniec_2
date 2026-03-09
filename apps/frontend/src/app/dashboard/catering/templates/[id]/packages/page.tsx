// apps/frontend/src/app/dashboard/catering/templates/[id]/packages/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCateringTemplate } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PackageCard } from './components/PackageCard';
import { PackageForm } from './components/PackageForm';
import type { CateringPackage } from '@/types/catering.types';

export default function PackagesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const templateId = params.id;

  const [formOpen, setFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);

  const { data: template, isLoading } = useCateringTemplate(templateId);

  const handleCreate = () => {
    setEditingPackage(null);
    setFormOpen(true);
  };

  const handleEdit = (pkg: CateringPackage) => {
    setEditingPackage(pkg);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingPackage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Nie znaleziono szablonu.
      </div>
    );
  }

  const packages = [...(template.packages ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/catering/templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pakiety</h1>
            <Badge variant={template.isActive ? 'default' : 'secondary'}>
              {template.name}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {packages.length} pakiet{packages.length !== 1 ? 'ów' : ''}
            {' · '}
            zarządzaj sekcjami dań i opcjami
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nowy pakiet
        </Button>
      </div>

      {/* Package list */}
      {packages.length > 0 ? (
        <div className="space-y-4">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 360,
                damping: 28,
                delay: i * 0.05,
              }}
            >
              <PackageCard
                pkg={pkg}
                templateId={templateId}
                onEdit={handleEdit}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Brak pakietów</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Utwórz pierwszy pakiet dla szablonu{' '}
            <strong>{template.name}</strong>
          </p>
          <Button onClick={handleCreate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Nowy pakiet
          </Button>
        </div>
      )}

      {/* Dialog: Package Form */}
      <Dialog open={formOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edytuj pakiet' : 'Nowy pakiet'}
            </DialogTitle>
          </DialogHeader>
          <PackageForm
            templateId={templateId}
            pkg={editingPackage}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
