'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

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
      variant="destructive"
      icon={Trash2}
      title="Usuń szablon"
      description={
        <>
          Czy na pewno chcesz usunąć szablon <strong>„{templateName}"</strong>?
          Ta operacja jest nieodwracalna — zostaną usunięte także wszystkie wersje historyczne.
        </>
      }
      confirmLabel="Usuń szablon"
      onConfirm={onDelete}
      isLoading={isPending}
    />
  );
}
