'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateItem,
  useUpdateItem,
  useServiceCategories,
} from '@/hooks/use-service-extras';
import { useToast } from '@/hooks/use-toast';
import type {
  ServiceItem,
  ServicePriceType,
  CreateServiceItemInput,
} from '@/types/service-extra.types';

interface ServiceItemFormProps {
  item?: ServiceItem | null;
  preselectedCategoryId?: string | null;
  onClose: () => void;
}

export function ServiceItemForm({
  item,
  preselectedCategoryId,
  onClose,
}: ServiceItemFormProps) {
  const isEditing = !!item;

  const [categoryId, setCategoryId] = useState(
    item?.categoryId || preselectedCategoryId || ''
  );
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [priceType, setPriceType] = useState<ServicePriceType>(
    item?.priceType || 'FLAT'
  );
  const [basePrice, setBasePrice] = useState<string>(
    item ? String(item.basePrice) : '0'
  );
  const [icon, setIcon] = useState(item?.icon || '');
  const [requiresNote, setRequiresNote] = useState(item?.requiresNote ?? false);
  const [noteLabel, setNoteLabel] = useState(item?.noteLabel || '');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  const { data: categories } = useServiceCategories();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const { toast } = useToast();

  const isLoading = createItem.isPending || updateItem.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      toast({ title: 'Wybierz kategori\u0119', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'Nazwa jest wymagana', variant: 'destructive' });
      return;
    }

    try {
      if (isEditing && item) {
        await updateItem.mutateAsync({
          id: item.id,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            priceType,
            basePrice: priceType === 'FREE' ? 0 : parseFloat(basePrice) || 0,
            icon: icon.trim() || null,
            requiresNote,
            noteLabel: requiresNote ? noteLabel.trim() || null : null,
            isActive,
          },
        });
        toast({ title: 'Pozycja zaktualizowana', description: name });
      } else {
        const data: CreateServiceItemInput = {
          categoryId,
          name: name.trim(),
          description: description.trim() || undefined,
          priceType,
          basePrice: priceType === 'FREE' ? 0 : parseFloat(basePrice) || 0,
          icon: icon.trim() || undefined,
          requiresNote,
          noteLabel: requiresNote ? noteLabel.trim() || undefined : undefined,
          isActive,
        };
        await createItem.mutateAsync(data);
        toast({ title: 'Pozycja utworzona', description: name });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'B\u0142\u0105d',
        description: error?.response?.data?.message || 'Nie uda\u0142o si\u0119 zapisa\u0107',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      {!isEditing && (
        <div className="space-y-1.5">
          <Label>Kategoria *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
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
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="item-name">Nazwa pozycji *</Label>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. DJ, Tort klasyczny 3-pi\u0119trowy"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="item-desc">Opis</Label>
        <Textarea
          id="item-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opis us\u0142ugi"
          rows={2}
        />
      </div>

      {/* Price Type + Base Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Typ ceny *</Label>
          <Select
            value={priceType}
            onValueChange={(v) => setPriceType(v as ServicePriceType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FLAT">Kwota sta\u0142a</SelectItem>
              <SelectItem value="PER_PERSON">Za osob\u0119</SelectItem>
              <SelectItem value="FREE">Gratis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="item-price">
            {priceType === 'PER_PERSON' ? 'Cena za osob\u0119 (z\u0142)' : 'Cena (z\u0142)'}
          </Label>
          <Input
            id="item-price"
            type="number"
            min="0"
            step="0.01"
            value={priceType === 'FREE' ? '0' : basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            disabled={priceType === 'FREE'}
          />
        </div>
      </div>

      {/* Icon */}
      <div className="space-y-1.5">
        <Label htmlFor="item-icon">Ikona (emoji)</Label>
        <Input
          id="item-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="\uD83C\uDFB5"
          maxLength={4}
          className="w-24"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {/* Requires Note */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>Wymaga notatki</Label>
            <p className="text-xs text-muted-foreground">
              Klient musi poda\u0107 dodatkowe informacje
            </p>
          </div>
          <Switch checked={requiresNote} onCheckedChange={setRequiresNote} />
        </div>

        {/* Note Label (shown only if requiresNote) */}
        {requiresNote && (
          <div className="space-y-1.5 pl-4 border-l-2">
            <Label htmlFor="item-note-label">Etykieta pola notatki</Label>
            <Input
              id="item-note-label"
              value={noteLabel}
              onChange={(e) => setNoteLabel(e.target.value)}
              placeholder="np. Opis tortu, Uwagi do muzyki"
            />
          </div>
        )}

        {/* Active */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>Aktywna</Label>
            <p className="text-xs text-muted-foreground">
              Nieaktywne pozycje nie s\u0105 widoczne przy rezerwacji
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Zapisz zmiany' : 'Utw\u00f3rz pozycj\u0119'}
        </Button>
      </div>
    </form>
  );
}
