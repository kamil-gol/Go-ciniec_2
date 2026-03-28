'use client';

import { Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type TemplateCategory,
} from '@/types/document-template.types';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  onNameChange: (value: string) => void;
  newSlug: string;
  onSlugChange: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  newCategory: TemplateCategory;
  setNewCategory: (value: TemplateCategory) => void;
  onCreate: () => void;
  isPending: boolean;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  newName,
  onNameChange,
  newSlug,
  onSlugChange,
  newDescription,
  setNewDescription,
  newCategory,
  setNewCategory,
  onCreate,
  isPending,
}: CreateTemplateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-600" />
            Nowy blok tekstu
          </AlertDialogTitle>
          <AlertDialogDescription>
            Utwórz nowy szablon dokumentu. Będzie dostępny do edycji po utworzeniu.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="new-name">Nazwa szablonu *</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="np. Informacje o parkingu"
              className="mt-1.5"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="new-slug">
              Slug <span className="text-muted-foreground font-normal">(identyfikator)</span>
            </Label>
            <Input
              id="new-slug"
              value={newSlug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="np. informacje-o-parkingu"
              className="mt-1.5 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Używany w kodzie. Tylko małe litery, cyfry i myślniki.
            </p>
          </div>

          <div>
            <Label htmlFor="new-desc">
              Opis <span className="text-muted-foreground font-normal">(opcjonalny)</span>
            </Label>
            <Input
              id="new-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="np. Wyświetlany w PDF rezerwacji pod warunkami"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="new-category">Kategoria *</Label>
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as TemplateCategory)}>
              <SelectTrigger className="mt-1.5 w-full h-9">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORY_ORDER.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {TEMPLATE_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={onCreate}
            disabled={!newName.trim() || !newSlug.trim() || isPending}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-3.5 w-3.5" />
            )}
            Utwórz szablon
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
