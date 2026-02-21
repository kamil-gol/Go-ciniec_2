'use client';

import { useState } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Oczekuje',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Potwierdzone',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Anulowane',
    className: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    icon: XCircle,
  },
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
      toast({ title: 'Wybierz pozycj\u0119', variant: 'destructive' });
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
      toast({ title: 'Us\u0142uga dodana', description: selectedItem?.name });
      resetAddForm();
    } catch (error: any) {
      toast({
        title: 'B\u0142\u0105d',
        description: error?.response?.data?.message || 'Nie uda\u0142o si\u0119 doda\u0107',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveExtra = async (extraId: string, name: string) => {
    try {
      await removeExtra.mutateAsync(extraId);
      toast({ title: 'Us\u0142uga usuni\u0119ta', description: name });
    } catch (error: any) {
      toast({
        title: 'B\u0142\u0105d',
        description: error?.response?.data?.message || 'Nie uda\u0142o si\u0119 usun\u0105\u0107',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (extraId: string, status: ExtraStatus) => {
    try {
      await updateExtra.mutateAsync({ extraId, data: { status } });
    } catch (error: any) {
      toast({
        title: 'B\u0142\u0105d',
        description: error?.response?.data?.message || 'Nie uda\u0142o si\u0119 zaktualizowa\u0107',
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
    <>
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30">
          {/* Header */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Us\u0142ugi dodatkowe</h2>
                  {extras.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {extras.length} {extras.length === 1 ? 'pozycja' : extras.length < 5 ? 'pozycje' : 'pozycji'}
                      {totalPrice > 0 && (
                        <span className="font-semibold text-violet-700 dark:text-violet-300 ml-1">
                          \u2014 {totalPrice.toLocaleString('pl-PL')} z\u0142
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-md"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Dodaj
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            {extrasLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : extras.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <Gift className="mb-2 h-8 w-8 text-violet-300 dark:text-violet-700" />
                <p>Brak us\u0142ug dodatkowych</p>
                <p className="text-xs mt-1">Kliknij \u201eDodaj\u201d aby przypisa\u0107 tort, muzyk\u0119, dekoracje...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {extras.map((extra) => {
                  const statusCfg = STATUS_CONFIG[extra.status as ExtraStatus] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusCfg.icon;

                  return (
                    <div
                      key={extra.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        extra.status === 'CANCELLED'
                          ? 'bg-neutral-50/60 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700 opacity-60'
                          : 'bg-white dark:bg-black/20 border-neutral-200 dark:border-neutral-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">
                          {extra.serviceItem?.icon || '\ud83d\udce6'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">
                              {extra.serviceItem?.name || 'Nieznana pozycja'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.className}`}>
                              <StatusIcon className="h-2.5 w-2.5" />
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-semibold">{Number(extra.totalPrice).toLocaleString('pl-PL')} z\u0142</span>
                            {extra.quantity > 1 && ` (\u00d7${extra.quantity})`}
                            {extra.note && (
                              <span className="ml-2 italic">\u2014 {extra.note}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
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
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() =>
                            handleRemoveExtra(
                              extra.id,
                              extra.serviceItem?.name || ''
                            )
                          }
                          disabled={removeExtra.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Total */}
                <div className="flex items-center justify-between p-3 mt-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white shadow-lg">
                  <span className="text-sm font-bold">Razem us\u0142ugi dodatkowe</span>
                  <span className="text-lg font-bold">
                    {totalPrice.toLocaleString('pl-PL')} z\u0142
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add Extra Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={resetAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Gift className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              Dodaj us\u0142ug\u0119 dodatkow\u0105
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
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategori\u0119" />
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
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz pozycj\u0119" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <span>{item.icon || '\ud83d\udce6'}</span>
                          <span>{item.name}</span>
                          {item.priceType !== 'FREE' && (
                            <span className="text-muted-foreground">
                              \u2014 {Number(item.basePrice).toLocaleString('pl-PL')} z\u0142
                              {item.priceType === 'PER_PERSON' && '/os.'}
                            </span>
                          )}
                          {item.priceType === 'FREE' && (
                            <span className="text-green-600">\u2014 Gratis</span>
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
                      ? 'Podaj szczeg\u00f3\u0142y (wymagane)'
                      : 'Opcjonalne uwagi'
                  }
                  rows={2}
                />
              </div>
            )}

            {/* Custom price override */}
            {selectedItem && selectedItem.priceType !== 'FREE' && (
              <div className="space-y-1.5">
                <Label htmlFor="extra-price" className="text-sm font-semibold">Cena indywidualna (opcjonalnie)</Label>
                <Input
                  id="extra-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={`Domy\u015blna: ${Number(selectedItem.basePrice).toLocaleString('pl-PL')} z\u0142`}
                />
                <p className="text-xs text-muted-foreground">
                  Pozostaw puste, aby u\u017cy\u0107 ceny domy\u015blnej
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
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {assignExtra.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Dodaj us\u0142ug\u0119
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
