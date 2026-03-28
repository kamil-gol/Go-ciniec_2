'use client';

import { ConfirmDialog } from '@/components/shared';

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  onDelete: () => void;
  isPending: boolean;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  templateName,
  onDelete,
  isPending,
}: DeleteTemplateDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Usuń szablon"
      description={`Czy na pewno chcesz usunąć szablon „${templateName}"? Ta operacja jest nieodwracalna — zostaną usunięte także wszystkie wersje historyczne.`}
      confirmLabel="Usuń szablon"
      variant="destructive"
      onConfirm={onDelete}
      loading={isPending}
    />
  );
}
