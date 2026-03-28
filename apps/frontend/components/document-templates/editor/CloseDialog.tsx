'use client';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface CloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmClose: () => void;
}

export function CloseDialog({ open, onOpenChange, onConfirmClose }: CloseDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="warning"
      title="Niezapisane zmiany"
      description="Masz niezapisane zmiany w szablonie. Czy na pewno chcesz zamknąć edytor? Zmiany zostaną utracone."
      confirmLabel="Zamknij bez zapisu"
      cancelLabel="Wróć do edycji"
      onConfirm={onConfirmClose}
    />
  );
}
