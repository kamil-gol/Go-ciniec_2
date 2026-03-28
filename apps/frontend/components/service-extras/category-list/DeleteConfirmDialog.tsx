'use client';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface DeleteConfirmDialogProps {
  target: { type: string; id: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function DeleteConfirmDialog({
  target,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={!!target}
      onOpenChange={() => onCancel()}
      variant="destructive"
      title="Potwierdź usunięcie"
      description={
        <>
          Czy na pewno chcesz usunąć <strong>{target?.name}</strong>?
          {target?.type === 'category' && (
            <span className="block mt-1 text-red-600 dark:text-red-400">
              Uwaga: usunięcie kategorii usunie również wszystkie pozycje w niej.
            </span>
          )}
        </>
      }
      confirmLabel="Usuń"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
