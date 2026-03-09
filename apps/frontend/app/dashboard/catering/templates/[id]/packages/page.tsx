// apps/frontend/app/dashboard/catering/templates/[id]/packages/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, Plus, BadgeCheck, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCateringTemplate } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PageLayout,
  PageHero,
  StatCard,
  LoadingState,
  EmptyState,
} from '@/components/shared';
import { PackageCard } from './components/PackageCard';
import { PackageForm } from './components/PackageForm';
import type { CateringPackage, ModuleAccent } from '@/types/catering.types';
import type { ModuleAccent as DesignModuleAccent } from '@/lib/design-tokens';

const CATERING_ACCENT: DesignModuleAccent = {
  name: 'Catering',
  gradient: 'from-orange-600 via-orange-500 to-amber-600',
  gradientSubtle: 'from-orange-500/5 via-amber-500/5 to-orange-500/5',
  iconBg: 'from-orange-500 to-amber-500',
  text: 'text-orange-600',
  textDark: 'dark:text-orange-400',
  ring: 'ring-orange-500/20',
  badge: 'bg-orange-100 dark:bg-orange-900/30',
  badgeText: 'text-orange-700 dark:text-orange-300',
};

export default function PackagesPage() {
  const params = useParams<{ id: string }>();
  const templateId = params.id;

  const [formOpen, setFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);

  const { data: template, isLoading } = useCateringTemplate(templateId);

  const handleCreate = () => { setEditingPackage(null); setFormOpen(true); };
  const handleEdit = (pkg: CateringPackage) => { setEditingPackage(pkg); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditingPackage(null); };

  const packages = [...(template?.packages ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const stats = {
    total: packages.length,
    active: packages.filter((p) => p.isActive).length,
    sections: packages.reduce((sum, p) => sum + (p.sections?.length ?? 0), 0),
  };

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={CATERING_ACCENT}
        title={template ? `Pakiety — ${template.name}` : 'Pakiety cateringowe'}
        subtitle="Zarządzaj pakietami, cenami i sekcjami dań"
        icon={Package}
        backHref="/dashboard/catering/templates"
        backLabel="Powrót do Szablonów"
        action={
          <Button
            size="lg"
            onClick={handleCreate}
            className="bg-white text-orange-600 hover:bg-white/90 shadow-xl"
            disabled={isLoading}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowy pakiet
          </Button>
        }
      />

      {/* StatCards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          label="Pakiety"
          value={stats.total}
          subtitle="Wszystkich pakietów"
          icon={Package}
          iconGradient="from-orange-500 to-amber-500"
          delay={0.1}
        />
        <StatCard
          label="Aktywne"
          value={stats.active}
          subtitle="Gotowe do użycia"
          icon={BadgeCheck}
          iconGradient="from-emerald-500 to-teal-500"
          delay={0.2}
        />
        <StatCard
          label="Sekcje"
          value={stats.sections}
          subtitle="Sekcji dań łącznie"
          icon={Layers}
          iconGradient="from-violet-500 to-purple-500"
          delay={0.3}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState variant="skeleton" rows={4} message="Wczytywanie pakietów..." />
      ) : packages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Brak pakietów"
          description={template ? `Utwórz pierwszy pakiet dla szablonu \u201e${template.name}\u201c` : 'Utwórz pierwszy pakiet cateringowy'}
          actionLabel="Nowy pakiet"
          onAction={handleCreate}
        />
      ) : (
        <div className="space-y-4">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28, delay: i * 0.05 }}
            >
              <PackageCard pkg={pkg} templateId={templateId} onEdit={handleEdit} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog create/edit */}
      <Dialog open={formOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edytuj pakiet' : 'Nowy pakiet cateringowy'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? `Edytujesz pakiet \u201e${editingPackage.name}\u201c`
                : 'Skonfiguruj nazwę, cenę i ustawienia nowego pakietu'}
            </DialogDescription>
          </DialogHeader>
          <PackageForm templateId={templateId} pkg={editingPackage} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
