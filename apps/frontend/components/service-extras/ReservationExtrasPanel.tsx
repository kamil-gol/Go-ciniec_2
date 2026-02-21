'use client';

import { useState } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  useReservationExtras,
  useServiceCategories,
  useAssignExtra,
  useRemoveReservationExtra,
  useUpdateReservationExtra,
} from '@/hooks/use-service-extras';
import { useToast } from '@/hooks/use-toast';
import type {
  ReservationExtra,
  ServiceItem,
  ExtraStatus,
} from '@/types/service-extra.types';

const STATUS_CONFIG: Record<
  ExtraStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: { label: 'Oczekuje', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Potwierdzone', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  CANCELLED: { label: 'Anulowane', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface ReservationExtrasPanelProps {
  reservationId: string;
}

export function ReservationExtrasPanel({ reservationId }: ReservationExtrasPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [note, setNote] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');

  const {
    data: extrasData,
    isLoading: extrasLoading,
  } = useReservationExtras(reservationId);
  const { data: categories } = useServiceCategories(true);
  const assignExtra = useAssignExtra(reservationId);
  const removeExtra = useRemoveReservationExtra(reservationId);
  const updateExtra = useUpdateReservationExtra(reservationId);
  const { toast } = useToast();

  const extras = extrasData?.data || [];
  const totalPrice = extrasData?.totalExtrasPrice || 0;

  // Get items for selected category
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const availableItems = selectedCategory?.items?.filter((i) => i.isActive) || [];
  const selectedItem = availableItems.find((i) => i.id === selectedItemId);

  const handleAddExtra = async () => {
    if (!selectedItemId) {
      toast({ title: 'Wybierz pozycję', variant: 'destructive' });
      return;
    }

    if (selectedItem?.requiresNote && !note.trim()) {
      toast({
        title: `Pole "${selectedItem.noteLabel || 'Uwagi'}" jest wymagane`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await assignExtra.mutateAsync({
        serviceItemId: selectedItemId,
        note: note.trim() || undefined,
        customPrice: customPrice ? parseFloat(customPrice) : undefined,
      });
      toast({ title: 'Usługa dodana', description: selectedItem?.name });
      resetAddForm();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.message || 'Nie udało się dodać',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveExtra = async (extraId: string, name: string) => {
    try {
      await removeExtra.mutateAsync(extraId);
      toast({ title: 'Usługa usunięta', description: name });
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.message || 'Nie udało się usunąć',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (extraId: string, status: ExtraStatus) => {
    try {
      await updateExtra.mutateAsync({ extraId, data: { status } });
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.message || 'Nie udało się zaktualizować',
        variant: 'destructive',
      });
    }
  };

  const resetAddForm = () => {
    setAddDialogOpen(false);
    setSelectedCategoryId('');
    setSelectedItemId('');
    setNote('');
    setCustomPrice('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5" />
          Usługi dodatkowe
          {extras.length > 0 && (
            <Badge variant="secondary">{extras.length}</Badge>
          )}
        </CardTitle>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Dodaj
        </Button>
      </CardHeader>

      <CardContent>
        {extrasLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : extras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <Gift className="mb-2 h-8 w-8 text-muted-foreground/40" />
            Brak usług dodatkowych
          </div>
        ) : (
          <div className="space-y-2">
            {extras.map((extra) => {
              const status = STATUS_CONFIG[extra.status as ExtraStatus] || STATUS_CONFIG.PENDING;
              const StatusIcon = status.icon;

              return (
                <div
                  key={extra.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {extra.serviceItem?.icon || '📦'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {extra.serviceItem?.name || 'Nieznana pozycja'}
                        </span>
                        <Badge className={`text-[10px] ${status.color}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Number(extra.totalPrice).toLocaleString('pl-PL')} zł
                        {extra.quantity > 1 && ` (×${extra.quantity})`}
                        {extra.note && (
                          <span className="ml-2 italic">— {extra.note}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Status quick toggle */}
                    <Select
                      value={extra.status}
                      onValueChange={(v) =>
                        handleStatusChange(extra.id, v as ExtraStatus)
                      }
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Oczekuje</SelectItem>
                        <SelectItem value="CONFIRMED">Potwierdzone</SelectItem>
                        <SelectItem value="CANCELLED">Anulowane</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        handleRemoveExtra(
                          extra.id,
                          extra.serviceItem?.name || ''
                        )
                      }
                      disabled={removeExtra.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="flex items-center justify-between border-t pt-3 mt-2">
              <span className="text-sm font-medium">Razem usługi dodatkowe</span>
              <span className="text-lg font-bold">
                {totalPrice.toLocaleString('pl-PL')} zł
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Extra Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={resetAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dodaj usługę dodatkową</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Category select */}
            <div className="space-y-1.5">
              <Label>Kategoria</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(v) => {
                  setSelectedCategoryId(v);
                  setSelectedItemId('');
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
                <Label>Pozycja</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
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
                              — {Number(item.basePrice).toLocaleString('pl-PL')} zł
                              {item.priceType === 'PER_PERSON' && '/os.'}
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

            {/* Note (if required or user wants) */}
            {selectedItem && (
              <div className="space-y-1.5">
                <Label htmlFor="extra-note">
                  {selectedItem.noteLabel || 'Uwagi'}
                  {selectedItem.requiresNote && ' *'}
                </Label>
                <Textarea
                  id="extra-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    selectedItem.requiresNote
                      ? `Podaj szczegóły (wymagane)`
                      : 'Opcjonalne uwagi'
                  }
                  rows={2}
                />
              </div>
            )}

            {/* Custom price override */}
            {selectedItem && selectedItem.priceType !== 'FREE' && (
              <div className="space-y-1.5">
                <Label htmlFor="extra-price">Cena indywidualna (opcjonalnie)</Label>
                <Input
                  id="extra-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={`Domyślna: ${Number(selectedItem.basePrice).toLocaleString('pl-PL')} zł`}
                />
                <p className="text-xs text-muted-foreground">
                  Pozostaw puste, aby użyć ceny domyślnej
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetAddForm}>
                Anuluj
              </Button>
              <Button
                onClick={handleAddExtra}
                disabled={!selectedItemId || assignExtra.isPending}
              >
                {assignExtra.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Dodaj usługę
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
