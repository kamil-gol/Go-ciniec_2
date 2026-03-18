'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateReservation } from '@/lib/api/reservations';
import { usePackage } from '@/hooks/use-menu-packages';
import { useToast } from '@/hooks/use-toast';
import CategoryExtrasSelector from './CategoryExtrasSelector';
import type { CategoryExtraSelection } from './CategoryExtrasSelector';

interface CategoryExtrasAddButtonProps {
  reservationId: string;
  menuPackageId: string;
  readOnly?: boolean;
  onAdded?: () => void;
}

/**
 * #216: Button + modal for adding category extras to a reservation that doesn't have any yet.
 * Fetches package's category settings to show available extras.
 */
export default function CategoryExtrasAddButton({
  reservationId,
  menuPackageId,
  readOnly = false,
  onAdded,
}: CategoryExtrasAddButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<CategoryExtraSelection[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: pkg } = usePackage(showModal ? menuPackageId : undefined);
  const updateReservation = useUpdateReservation();
  const { toast } = useToast();

  // Check if package has any categories supporting extras
  const extrasCategories = (pkg?.categorySettings || []).filter(
    (cs: any) => cs.isEnabled !== false && cs.extraItemPrice != null
  );

  // Don't show button if package has no extras-capable categories
  if (!showModal && readOnly) return null;

  async function handleSave() {
    const filtered = selectedExtras.filter((e) => e.quantity > 0);
    if (filtered.length === 0) return;

    setSaving(true);
    try {
      await updateReservation.mutateAsync({
        id: reservationId,
        input: {
          categoryExtras: filtered.map((e) => ({
            packageCategoryId: e.packageCategoryId,
            quantity: e.quantity,
          })),
          reason: 'Dodanie dodatkowych pozycji kategorii',
        },
      });

      toast({
        title: 'Zapisano',
        description: 'Dodatkowe pozycje zostały dodane.',
      });
      setShowModal(false);
      setSelectedExtras([]);
      onAdded?.();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.message || 'Nie udało się zapisać zmian.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {!readOnly && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Dodatkowo płatne pozycje
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Brak — możesz dodać pozycje ponad limit pakietu
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj
            </Button>
          </div>
        </Card>
      )}

      {showModal && (
        <Dialog open onOpenChange={(open) => !open && setShowModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                Dodaj dodatkowo płatne pozycje
              </DialogTitle>
            </DialogHeader>

            {extrasCategories.length > 0 ? (
              <>
                <div className="mt-2">
                  <CategoryExtrasSelector
                    categorySettings={pkg?.categorySettings || []}
                    selectedExtras={selectedExtras}
                    onExtrasChange={setSelectedExtras}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                    Anuluj
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || selectedExtras.filter((e) => e.quantity > 0).length === 0}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Zapisz
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4 text-center">
                {pkg ? 'Ten pakiet nie ma kategorii z dodatkowo płatnymi pozycjami.' : 'Ładowanie...'}
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
