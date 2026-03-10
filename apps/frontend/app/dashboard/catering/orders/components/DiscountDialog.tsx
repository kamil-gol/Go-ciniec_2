'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateCateringOrder } from '@/hooks/use-catering-orders';
import type { CateringDiscountType } from '@/types/catering-order.types';
import { Loader2, Percent, Banknote } from 'lucide-react';

interface Props {
  orderId: string;
  current?: {
    discountType?: CateringDiscountType | null;
    discountValue?: number | null;
    discountReason?: string | null;
  };
  open: boolean;
  onClose: () => void;
}

export function DiscountDialog({ orderId, current, open, onClose }: Props) {
  const [type, setType] = useState<CateringDiscountType>(
    current?.discountType ?? 'PERCENTAGE',
  );
  const [value, setValue] = useState(String(current?.discountValue ?? ''));
  const [reason, setReason] = useState(current?.discountReason ?? '');

  const update = useUpdateCateringOrder(orderId);

  const handleSubmit = async () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;
    await update.mutateAsync({
      discountType: type,
      discountValue: numValue,
      discountReason: reason || null,
    });
    onClose();
  };

  const handleRemove = async () => {
    await update.mutateAsync({
      discountType: null,
      discountValue: null,
      discountReason: null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {current?.discountType ? 'Edytuj rabat' : 'Dodaj rabat'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Typ rabatu</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CateringDiscountType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">
                  <span className="flex items-center gap-2">
                    <Percent className="w-4 h-4" /> Procentowy
                  </span>
                </SelectItem>
                <SelectItem value="AMOUNT">
                  <span className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" /> Kwotowy (PLN)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Wartość {type === 'PERCENTAGE' ? '(%)' : '(PLN)'}</Label>
            <Input
              type="number"
              min={0}
              max={type === 'PERCENTAGE' ? 100 : undefined}
              step={type === 'PERCENTAGE' ? 1 : 0.01}
              placeholder={type === 'PERCENTAGE' ? 'np. 10' : 'np. 150.00'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Powód rabatu{' '}
              <span className="text-neutral-400 font-normal">(opcjonalnie)</span>
            </Label>
            <Textarea
              placeholder="np. Stały klient, upust specjalny..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {current?.discountType && (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive mr-auto"
              onClick={handleRemove}
              disabled={update.isPending}
            >
              Usuń rabat
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={update.isPending}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={update.isPending || !value}
          >
            {update.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
