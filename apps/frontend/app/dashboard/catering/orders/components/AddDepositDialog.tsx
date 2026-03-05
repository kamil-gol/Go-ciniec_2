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
import { useCreateCateringDeposit } from '@/hooks/use-catering-orders';
import { Loader2 } from 'lucide-react';

interface Props {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

export function AddDepositDialog({ orderId, open, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const create = useCreateCateringDeposit(orderId);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !dueDate) return;
    await create.mutateAsync({
      amount: num,
      dueDate,
      title: title || null,
      description: description || null,
    });
    setTitle('');
    setAmount('');
    setDueDate('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj zaliczkę</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Tytuł{' '}
              <span className="text-neutral-400 font-normal">(opcjonalnie)</span>
            </Label>
            <Input
              placeholder="np. Zaliczka 30%, Zadatek"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Kwota (PLN) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="np. 500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Termin płatności <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Opis{' '}
              <span className="text-neutral-400 font-normal">(opcjonalnie)</span>
            </Label>
            <Textarea
              placeholder="Dodatkowe informacje..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={create.isPending}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || !amount || !dueDate}
          >
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Dodaj zaliczkę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
