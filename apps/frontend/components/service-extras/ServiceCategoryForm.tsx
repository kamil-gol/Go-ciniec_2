'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-service-extras';
import type {
  ServiceCategory,
  CreateServiceCategoryInput,
} from '@/types/service-extra.types';
import { toast } from 'sonner'

interface ServiceCategoryFormProps {
  category?: ServiceCategory | null;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ServiceCategoryForm({ category, onClose }: ServiceCategoryFormProps) {
  const isEditing = !!category;

  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [description, setDescription] = useState(category?.description || '');
  const [icon, setIcon] = useState(category?.icon || '');
  const [color, setColor] = useState(category?.color || '#3B82F6');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [isExclusive, setIsExclusive] = useState(category?.isExclusive ?? false);
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const isLoading = createCategory.isPending || updateCategory.isPending;

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && name) {
      setSlug(slugify(name));
    }
  }, [name, autoSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nazwa jest wymagana');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug jest wymagany');
      return;
    }

    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data: {
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            icon: icon.trim() || null,
            color: color || null,
            isActive,
            isExclusive,
          },
        });
        toast.success('Kategoria zaktualizowana: ' + name);
      } else {
        const data: CreateServiceCategoryInput = {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          color: color || undefined,
          isActive,
          isExclusive,
        };
        await createCategory.mutateAsync(data);
        toast.success('Kategoria utworzona: ' + name);
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Nie udało się zapisać');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">Nazwa kategorii *</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Tort, Muzyka, Wystrój sali"
          autoFocus
        />
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="cat-slug">Slug *</Label>
          {!isEditing && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoSlug}
                onChange={(e) => setAutoSlug(e.target.checked)}
                className="rounded"
              />
              Auto
            </label>
          )}
        </div>
        <Input
          id="cat-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoSlug(false);
          }}
          placeholder="np. tort, muzyka, wystoj-sali"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="cat-desc">Opis</Label>
        <Textarea
          id="cat-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Krótki opis kategorii"
          rows={2}
        />
      </div>

      {/* Icon + Color row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cat-icon">Ikona (emoji)</Label>
          <Input
            id="cat-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎂"
            maxLength={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-color">Kolor</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="cat-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1"
              placeholder="#3B82F6"
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {/* Exclusive */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>Kategoria wyłączna</Label>
            <p className="text-xs text-muted-foreground">
              Tylko jedna pozycja z tej kategorii może być wybrana na rezerwację
            </p>
          </div>
          <Switch checked={isExclusive} onCheckedChange={setIsExclusive} />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>Aktywna</Label>
            <p className="text-xs text-muted-foreground">
              Nieaktywne kategorie nie są widoczne przy rezerwacji
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
          {isEditing ? 'Zapisz zmiany' : 'Utwórz kategorię'}
        </Button>
      </div>
    </form>
  );
}
