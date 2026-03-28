'use client';

import { useState, useEffect } from 'react';
import {
  Archive,
  Settings2,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  useArchiveSettings,
  useUpdateArchiveDays,
  useRunArchiveNow,
} from '../../src/hooks/use-archive-settings';
import type { ArchiveRunResult } from '../../src/hooks/use-archive-settings';
import { Skeleton } from '@/components/ui/skeleton';

export function ArchiveTab() {
  const { data: settings, isLoading, error, refetch } = useArchiveSettings();
  const updateMutation = useUpdateArchiveDays();
  const archiveMutation = useRunArchiveNow();

  const [daysInput, setDaysInput] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastResult, setLastResult] = useState<ArchiveRunResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync settings to local input state (suppress because this is prop→state sync)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (settings) {
      setDaysInput(settings.archiveAfterDays.toString());
    }
  }, [settings]);

  const handleSaveDays = async () => {
    const days = parseInt(daysInput, 10);
    if (isNaN(days) || days < 1 || days > 365) return;
    try {
      await updateMutation.mutateAsync(days);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // error handled by mutation state
    }
  };

  const handleRunArchive = async () => {
    setShowConfirmDialog(false);
    try {
      const result = await archiveMutation.mutateAsync();
      setLastResult(result.data);
    } catch {
      // error handled by mutation state
    }
  };

  const daysValue = parseInt(daysInput, 10);
  const isDaysValid = !isNaN(daysValue) && daysValue >= 1 && daysValue <= 365;
  const isDaysChanged = settings && daysValue !== settings.archiveAfterDays;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Settings card skeleton */}
        <div className="rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        {/* Action card skeleton */}
        <div className="rounded-2xl border p-6 space-y-4">
          <Skeleton className="h-5 w-56 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="font-medium text-destructive">Błąd ładowania ustawień archiwizacji</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {(error as Error).message || 'Nieznany błąd'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Ustawienia */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Konfiguracja</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="archiveDays"
                className="block text-sm font-medium mb-1.5"
              >
                Archiwizuj po (dni od anulowania)
              </label>
              <div className="flex gap-2">
                <input
                  id="archiveDays"
                  type="number"
                  min={1}
                  max={365}
                  value={daysInput}
                  onChange={(e) => setDaysInput(e.target.value)}
                  className="flex h-10 w-28 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <button
                  onClick={handleSaveDays}
                  disabled={
                    !isDaysValid ||
                    !isDaysChanged ||
                    updateMutation.isPending
                  }
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 transition-colors"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Zapisz
                </button>
              </div>

              {!isDaysValid && daysInput !== '' && (
                <p className="mt-1 text-xs text-destructive">
                  Wartość musi być liczbą od 1 do 365
                </p>
              )}

              {saveSuccess && (
                <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Zapisano pomyślnie
                </p>
              )}

              {updateMutation.isError && (
                <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {(updateMutation.error as any)?.response?.data?.error ||
                    'Błąd zapisu'}
                </p>
              )}
            </div>

            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p>
                    Rezerwacje ze statusem <strong>CANCELLED</strong> zostaną
                    automatycznie zarchiwizowane po upływie podanej liczby dni od
                    anulowania.
                  </p>
                  <p className="mt-1">
                    CRON uruchamia się codziennie o <strong>02:00</strong>.
                    Data graniczna:{' '}
                    <strong>
                      {settings
                        ? new Date(settings.cutoffDate).toLocaleDateString(
                            'pl-PL',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }
                          )
                        : '\u2014'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Ręczne uruchomienie */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Play className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Ręczna archiwizacja</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Uruchom proces archiwizacji natychmiast \u2014 ta sama logika co CRON,
            ale wykonana na żądanie.
          </p>

          {settings && settings.pendingCandidatesCount > 0 ? (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {settings.pendingCandidatesCount}{' '}
                  {settings.pendingCandidatesCount === 1
                    ? 'rezerwacja czeka'
                    : 'rezerwacji czeka'}{' '}
                  na archiwizację
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-muted/50 p-3 mb-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Brak rezerwacji oczekujących na archiwizację
              </p>
            </div>
          )}

          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={archiveMutation.isPending || !settings?.pendingCandidatesCount}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            {archiveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Archiwizuj teraz
          </button>

          {lastResult && (
            <div className="mt-4 rounded-md border p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Archiwizacja zakończona
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Zarchiwizowano: <strong>{lastResult.archivedCount}</strong>{' '}
                rezerwacji (próg: {lastResult.archiveAfterDays} dni)
              </p>
            </div>
          )}

          {archiveMutation.isError && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Błąd archiwizacji
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(archiveMutation.error as any)?.response?.data?.error ||
                  'Nieznany błąd'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statystyki */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Statystyki</h2>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Odśwież
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Oczekujące na archiwizację
              </p>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {settings?.pendingCandidatesCount ?? '\u2014'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Anulowane &gt; {settings?.archiveAfterDays ?? 30} dni temu
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Wszystkie anulowane
              </p>
              <Ban className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {settings?.totalCancelledCount ?? '\u2014'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Status CANCELLED, niezarchiwizowane
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Zarchiwizowane łącznie
              </p>
              <Archive className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {settings?.archivedTotalCount ?? '\u2014'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Status ARCHIVED
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowConfirmDialog(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Potwierdź archiwizację
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Czy na pewno chcesz uruchomić ręczną archiwizację?
            </p>
            <p className="mt-1 text-sm">
              <strong>{settings?.pendingCandidatesCount}</strong>{' '}
              {settings?.pendingCandidatesCount === 1
                ? 'rezerwacja zostanie zarchiwizowana'
                : 'rezerwacji zostanie zarchiwizowanych'}
              . Tej operacji nie można cofnąć.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleRunArchive}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archiwizuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
