'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils'
import { Gift, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ServiceCategory } from '@/types/service-extra.types';
import { toast } from 'sonner';
import { priceSuffix, quantityLabel } from './extras-panel.config';

interface AddExtraDialogProps {
  open: boolean;
  onClose: () => void;
  categories: ServiceCategory[] | undefined;
  onAdd: (data: {
    serviceItemId: string;
    quantity: number;
    note?: string;
    customPrice?: number;
  }) => void | Promise<void>;
  isPending: boolean;
}

export function AddExtraDialog({
  open,
  onClose,
  categories,
  onAdd,
  isPending,
}: AddExtraDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');

  // Get items for selected category
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const availableItems = selectedCategory?.items?.filter((i) => i.isActive) || [];
  const selectedItem = availableItems.find((i) => i.id === selectedItemId);

  // Calculate preview price for dialog
  const previewPrice = selectedItem
    ? selectedItem.priceType === 'FREE'
      ? 0
      : (customPrice !== '' && customPrice != null ? parseFloat(customPrice) : selectedItem.basePrice) * quantity
    : 0;

  const resetForm = () => {
    setSelectedCategoryId('');
    setSelectedItemId('');
    setQuantity(1);
    setNote('');
    setCustomPrice('');
    onClose();
  };

  const handleAdd = async () => {
    if (!selectedItemId) {
      toast.error('Wybierz pozycję');
      return;
    }

    if (selectedItem?.requiresNote && !note.trim()) {
      toast.error(`Pole "${selectedItem.noteLabel || 'Uwagi'}" jest wymagane`);
      return;
    }

    try {
      await onAdd({
        serviceItemId: selectedItemId,
        quantity: quantity,
        note: note.trim() || undefined,
        customPrice: customPrice ? parseFloat(customPrice) : undefined,
      });
      toast.success('Usługa dodana: ' + selectedItem?.name);
      resetForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie udało się dodać');
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetForm}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Gift className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            Dodaj usługę dodatkową
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category select */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Kategoria</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(v) => {
                setSelectedCategoryId(v);
                setSelectedItemId('');
                setQuantity(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item select */}
          {selectedCategoryId && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Pozycja</Label>
              <Select
                value={selectedItemId}
                onValueChange={(v) => {
                  setSelectedItemId(v);
                  setQuantity(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pozycję" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <span>{item.icon || '📦'}</span>
                        <span>{item.name}</span>
                        {item.priceType !== 'FREE' && (
                          <span className="text-muted-foreground">
                            — {formatCurrency(item.basePrice)}{priceSuffix(item.priceType)}
                          </span>
                        )}
                        {item.priceType === 'FREE' && (
                          <span className="text-green-600">— Gratis</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity stepper - show for non-FREE items */}
          {selectedItem && selectedItem.priceType !== 'FREE' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                {quantityLabel(selectedItem.priceType)}
              </Label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <button
                    type="button"
                    className="h-10 w-10 inline-flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) setQuantity(val);
                      else if (e.target.value === '') setQuantity(1);
                    }}
                    className="h-10 w-14 text-center font-semibold text-sm border-x border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:bg-violet-50 dark:focus:bg-violet-900/20 tabular-nums"
                  />
                  <button
                    type="button"
                    className="h-10 w-10 inline-flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {quantity > 1 && (
                  <span className="text-sm text-muted-foreground">
                    = <span className="font-bold text-violet-600 dark:text-violet-400">{formatCurrency(previewPrice)}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Note (if required or user wants) */}
          {selectedItem && (
            <div className="space-y-1.5">
              <Label htmlFor="extra-note" className="text-sm font-semibold">
                {selectedItem.noteLabel || 'Uwagi'}
                {selectedItem.requiresNote && ' *'}
              </Label>
              <Textarea
                id="extra-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  selectedItem.requiresNote
                    ? 'Podaj szczegóły (wymagane)'
                    : 'Opcjonalne uwagi'
                }
                rows={2}
              />
            </div>
          )}

          {/* Custom price override */}
          {selectedItem && selectedItem.priceType !== 'FREE' && (
            <div className="space-y-1.5">
              <Label htmlFor="extra-price" className="text-sm font-semibold">
                Cena indywidualna{selectedItem.priceType === 'PER_UNIT' ? ' za sztukę' : selectedItem.priceType === 'PER_PERSON' ? ' za osobę' : ''} (opcjonalnie)
              </Label>
              <Input
                id="extra-price"
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={`Domyślna: ${formatCurrency(selectedItem.basePrice)}${priceSuffix(selectedItem.priceType)}`}
              />
              <p className="text-xs text-muted-foreground">
                Pozostaw puste, aby użyć ceny domyślnej
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={resetForm}>
              Anuluj
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedItemId || isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Dodaj usługę
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
