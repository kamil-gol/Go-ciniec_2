// apps/frontend/src/app/dashboard/catering/orders/components/ChangeStatusDialog.tsx
'use client';

import { useState } from 'react';
import { useChangeCateringOrderStatus } from '@/hooks/use-catering-orders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { CateringOrderStatus } from '@/types/catering-order.types';
import { ORDER_STATUS_LABEL } from '@/types/catering-order.types';

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as CateringOrderStatus[];

interface Props {
  orderId: string;
  currentStatus: CateringOrderStatus;
  open: boolean;
  onClose: () => void;
}

export function ChangeStatusDialog({ orderId, currentStatus, open, onClose }: Props) {
  const [status, setStatus] = useState<CateringOrderStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const mutation = useChangeCateringOrderStatus(orderId);

  const handleSubmit = async () => {
    await mutation.mutateAsync({ status, reason: reason.trim() || null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Zmień status zamówienia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nowy status</label>
            <Select value={status} onValueChange={v => setStatus(v as CateringOrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Powód zmiany (opcjonalnie)</label>
            <Textarea
              placeholder="Wpisz powód..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || status === currentStatus}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
