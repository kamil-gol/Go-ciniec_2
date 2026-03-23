'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmClose: () => void;
}

export function CloseDialog({ open, onOpenChange, onConfirmClose }: CloseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Niezapisane zmiany</AlertDialogTitle>
          <AlertDialogDescription>
            Masz niezapisane zmiany w szablonie. Czy na pewno chcesz zamknąć
            edytor? Zmiany zostaną utracone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Wróć do edycji</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmClose}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Zamknij bez zapisu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
