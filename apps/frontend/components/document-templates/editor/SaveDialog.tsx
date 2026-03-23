'use client';

import { Save, Loader2, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeReason: string;
  onChangeReasonChange: (value: string) => void;
  onConfirmSave: () => void;
  isPending: boolean;
}

export function SaveDialog({
  open,
  onOpenChange,
  changeReason,
  onChangeReasonChange,
  onConfirmSave,
  isPending,
}: SaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-600" />
            Zapisz zmiany
          </AlertDialogTitle>
          <AlertDialogDescription>
            Opcjonalnie opisz co zostało zmienione. Powód będzie widoczny w historii wersji.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="change-reason" className="text-sm font-medium">
            Powód zmiany <span className="text-muted-foreground font-normal">(opcjonalny)</span>
          </Label>
          <Input
            id="change-reason"
            value={changeReason}
            onChange={(e) => onChangeReasonChange(e.target.value)}
            placeholder="np. Zaktualizowano warunki płatności..."
            className="mt-1.5"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirmSave();
              }
            }}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmSave}
            disabled={isPending}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Zapisz wersję
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
