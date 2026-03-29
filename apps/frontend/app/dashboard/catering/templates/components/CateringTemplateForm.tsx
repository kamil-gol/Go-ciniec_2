// apps/frontend/app/dashboard/catering/templates/components/CateringTemplateForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import {
  useCreateCateringTemplate,
  useUpdateCateringTemplate,
} from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DialogFooter } from '@/components/ui/dialog';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import type { CateringTemplate } from '@/types/catering.types';

interface FormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

interface Props {
  template?: CateringTemplate | null;
  onClose: () => void;
}

export function CateringTemplateForm({ template, onClose }: Props) {
  const isEdit = !!template;
  const createMutation = useCreateCateringTemplate();
  const updateMutation = useUpdateCateringTemplate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      isActive: true,
      displayOrder: 0,
    },
  });

  const isActive = watch('isActive');
  const watchName = watch('name');

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        slug: template.slug,
        description: template.description ?? '',
        imageUrl: template.imageUrl ?? '',
        isActive: template.isActive,
        displayOrder: template.displayOrder,
      });
    } else {
      reset({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        isActive: true,
        displayOrder: 0,
      });
    }
  }, [template, reset]);

  // Auto-generuj slug z nazwy (tylko nowy szablon)
  useEffect(() => {
    if (isEdit) return;
    const slug = watchName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue('slug', slug);
  }, [watchName, isEdit, setValue]);

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      imageUrl: data.imageUrl || undefined,
      isActive: data.isActive,
      displayOrder: Number(data.displayOrder),
    };
    if (isEdit && template) {
      updateMutation.mutate(
        { id: template.id, data: payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Nazwa */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nazwa szablonu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register('name', { required: 'Nazwa jest wymagana' })}
          placeholder="np. Catering komunijny"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug <span className="text-red-500">*</span>
        </Label>
        {isEdit ? (
          <Input
            value={template?.slug ?? ''}
            disabled
            className="bg-muted"
          />
        ) : (
          <Input
            id="slug"
            {...register('slug', {
              required: 'Slug jest wymagany',
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: 'Tylko małe litery, cyfry i myślniki',
              },
            })}
            placeholder="np. catering-komunijny"
          />
        )}
        {errors.slug && (
          <p className="text-sm text-red-500">{errors.slug.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {isEdit
            ? 'Nie można zmienić slugu istniejącego szablonu'
            : 'Generowany automatycznie z nazwy'}
        </p>
      </div>

      {/* Opis — Markdown editor */}
      <div className="space-y-2">
        <Label htmlFor="description">Opis</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <MarkdownEditor
              id="description"
              value={field.value}
              onChange={field.onChange}
              placeholder="Szczegółowy opis szablonu cateringowego (obsługuje **Markdown**)…"
              rows={6}
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Obsługuje formatowanie Markdown: **pogrubienie**, *kursywa*, listy, nagłówki.
        </p>
      </div>

      {/* URL zdjęcia */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL zdjęcia</Label>
        <Input
          id="imageUrl"
          {...register('imageUrl')}
          placeholder="https://..."
        />
      </div>

      {/* Kolejność wyświetlania */}
      <div className="space-y-2">
        <Label htmlFor="displayOrder">Kolejność wyświetlania</Label>
        <Input
          id="displayOrder"
          type="number"
          {...register('displayOrder', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Niższy numer = wyżej na liście
        </p>
      </div>

      {/* Aktywny */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Szablon aktywny
        </Label>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Zapisz zmiany' : 'Utwórz szablon'}
        </Button>
      </DialogFooter>

    </form>
  );
}
