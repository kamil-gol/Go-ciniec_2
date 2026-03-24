'use client';

import { useState } from 'react';
import {
  Gift,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useReservationExtras,
  useServiceCategories,
  useAssignExtra,
  useRemoveReservationExtra,
  useUpdateReservationExtra,
} from '@/hooks/use-service-extras';
import type { ExtraStatus } from '@/types/service-extra.types';
import { toast } from 'sonner';
import { STATUS_CONFIG, formatExtraPriceDetails } from './extras-panel/extras-panel.config';
import { AddExtraDialog } from './extras-panel/AddExtraDialog';

interface ReservationExtrasPanelProps {
  reservationId: string;
  readOnly?: boolean;
}

export function ReservationExtrasPanel({ reservationId, readOnly = false }: ReservationExtrasPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Inline note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const {
    data: extrasData,
    isLoading: extrasLoading,
  } = useReservationExtras(reservationId);
  const { data: categories } = useServiceCategories(true);
  const assignExtra = useAssignExtra(reservationId);
  const removeExtra = useRemoveReservationExtra(reservationId);
  const updateExtra = useUpdateReservationExtra(reservationId);

  const extras = extrasData?.data || [];
  const totalPrice = extrasData?.totalExtrasPrice || 0;

  const handleRemoveExtra = async (extraId: string, name: string) => {
    if (readOnly) return;
    try {
      await removeExtra.mutateAsync(extraId);
      toast.success('Usługa usunięta: ' + name);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie udało się usunąć');
    }
  };

  const handleStatusChange = async (extraId: string, status: ExtraStatus) => {
    if (readOnly) return;
    try {
      await updateExtra.mutateAsync({ extraId, data: { status } });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie udało się zaktualizować');
    }
  };

  const handleQuantityChange = async (extraId: string, newQuantity: number) => {
    if (readOnly) return;
    if (newQuantity < 1) return;
    try {
      await updateExtra.mutateAsync({ extraId, data: { quantity: newQuantity } });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie udało się zaktualizować ilości');
    }
  };

  // ── Inline note editing ──────────────────────────────────────────────────────────

  const startEditingNote = (extraId: string, currentNote: string | null | undefined) => {
    if (readOnly) return;
    setEditingNoteId(extraId);
    setEditingNoteValue(currentNote || '');
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const saveNote = async (extraId: string) => {
    if (readOnly) return;
    const trimmed = editingNoteValue.trim();
    setSavingNoteId(extraId);
    try {
      await updateExtra.mutateAsync({
        extraId,
        data: { note: trimmed || null },
      });
      toast.success(trimmed ? 'Notatka zapisana' : 'Notatka usunięta');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie udało się zapisać notatki');
    } finally {
      setSavingNoteId(null);
      setEditingNoteId(null);
      setEditingNoteValue('');
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, extraId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveNote(extraId);
    }
    if (e.key === 'Escape') {
      cancelEditingNote();
    }
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
                  <h2 className="text-xl sm:text-2xl font-bold">Usługi dodatkowe</h2>
                  {extras.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {extras.length} {extras.length === 1 ? 'pozycja' : extras.length < 5 ? 'pozycje' : 'pozycji'}
                      {totalPrice > 0 && (
                        <span className="font-semibold text-violet-700 dark:text-violet-300 ml-1">
                          — {totalPrice.toLocaleString('pl-PL')} zł
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {!readOnly && (
                <Button
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white shadow-md"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Dodaj
                </Button>
              )}
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
                <p>Brak usług dodatkowych</p>
                {!readOnly && (
                  <p className="text-xs mt-1">Kliknij „Dodaj" aby przypisać tort, muzykę, dekoracje...</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {extras.map((extra) => {
                  const statusCfg = STATUS_CONFIG[extra.status as ExtraStatus] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusCfg.icon;
                  const canEditQuantity = !readOnly && extra.priceType !== 'FREE' && extra.status !== 'CANCELLED' && !extra.serviceItem?.category?.isExclusive;
                  const isEditingThisNote = editingNoteId === extra.id;
                  const isSavingThisNote = savingNoteId === extra.id;

                  return (
                    <div
                      key={extra.id}
                      className={`rounded-xl border p-3 transition-all ${
                        extra.status === 'CANCELLED'
                          ? 'bg-neutral-50/60 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700 opacity-60'
                          : 'bg-white dark:bg-black/20 border-neutral-200 dark:border-neutral-700 hover:shadow-md'
                      }`}
                    >
                      {/* Main row: info + controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg flex-shrink-0">
                            {extra.serviceItem?.icon || '📦'}
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
                              <span className="font-semibold">{formatExtraPriceDetails(extra)}</span>
                            </div>
                          </div>
                        </div>

                        {!readOnly && (
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {/* Inline quantity controls */}
                            {canEditQuantity && (
                              <div className="inline-flex items-center rounded-md border border-neutral-200 dark:border-neutral-700 mr-1">
                                <button
                                  className="h-7 w-7 inline-flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-l-md disabled:opacity-40"
                                  onClick={() => handleQuantityChange(extra.id, extra.quantity - 1)}
                                  disabled={extra.quantity <= 1 || updateExtra.isPending}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-semibold tabular-nums border-x border-neutral-200 dark:border-neutral-700 leading-7">
                                  {extra.quantity}
                                </span>
                                <button
                                  className="h-7 w-7 inline-flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-r-md disabled:opacity-40"
                                  onClick={() => handleQuantityChange(extra.id, extra.quantity + 1)}
                                  disabled={updateExtra.isPending}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            )}

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
                        )}
                      </div>

                      {/* Note row */}
                      {extra.status !== 'CANCELLED' && (
                        <div className="mt-2 ml-9">
                          {readOnly ? (
                            extra.note ? (
                              <span className="text-xs text-muted-foreground italic">{extra.note}</span>
                            ) : null
                          ) : isEditingThisNote ? (
                            <div className="space-y-1.5">
                              <textarea
                                autoFocus
                                value={editingNoteValue}
                                onChange={(e) => setEditingNoteValue(e.target.value)}
                                onKeyDown={(e) => handleNoteKeyDown(e, extra.id)}
                                placeholder="Wpisz notatkę..."
                                rows={2}
                                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/20 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none placeholder:text-violet-400 dark:placeholder:text-violet-600"
                              />
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => saveNote(extra.id)}
                                  disabled={isSavingThisNote}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
                                >
                                  {isSavingThisNote ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                  Zapisz
                                </button>
                                <button
                                  onClick={cancelEditingNote}
                                  disabled={isSavingThisNote}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                >
                                  <X className="h-3 w-3" />
                                  Anuluj
                                </button>
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  Enter = zapisz, Esc = anuluj
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditingNote(extra.id, extra.note)}
                              className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            >
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              {extra.note ? (
                                <span className="italic">{extra.note}</span>
                              ) : (
                                <span className="text-violet-400 dark:text-violet-600 opacity-60 group-hover:opacity-100">
                                  Dodaj notatkę...
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Total */}
                <div className="flex items-center justify-between p-3 mt-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white shadow-lg">
                  <span className="text-sm font-bold">Razem usługi dodatkowe</span>
                  <span className="text-lg font-bold">
                    {totalPrice.toLocaleString('pl-PL')} zł
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add Extra Dialog — only render when not readOnly */}
      {!readOnly && (
        <AddExtraDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          categories={categories}
          onAdd={(data) => { assignExtra.mutateAsync(data) }}
          isPending={assignExtra.isPending}
        />
      )}
    </>
  );
}
