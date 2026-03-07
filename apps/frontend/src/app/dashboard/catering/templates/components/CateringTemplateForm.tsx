// apps/frontend/src/app/dashboard/catering/templates/components/CateringTemplateForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  useCreateCateringTemplate,
  useUpdateCateringTemplate,
} from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CateringTemplate } from '@/types/catering.types';

const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100),
  slug: z
    .string()
    .min(1, 'Slug jest wymagany')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Tylko małe litery, cyfry i myślniki'),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('Nieprawiłowy URL').optional().or(z.literal('')),
  isActive: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  template?: CateringTemplate | null;
  onClose: () => void;
}

export function CateringTemplateForm({ template, onClose }: Props) {
  const isEdit = !!template;
  const createMutation = useCreateCateringTemplate();
  const updateMutation = useUpdateCateringTemplate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      isActive: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        slug: template.slug,
        description: template.description ?? '',
        imageUrl: template.imageUrl ?? '',
        isActive: template.isActive,
        displayOrder: template.displayOrder,
      });
    }
  }, [template, form]);

  // Auto-generate slug from name (only on create)
  const watchName = form.watch('name');
  useEffect(() => {
    if (isEdit) return;
    const slug = watchName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue('slug', slug, { shouldValidate: false });
  }, [watchName, isEdit, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      description: values.description || undefined,
      imageUrl: values.imageUrl || undefined,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Sekcja: Dane podstawowe ── */}
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dane podstawowe
          </p>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa szablonu *</FormLabel>
                <FormControl>
                  <Input placeholder="np. Catering komunijny" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input placeholder="np. catering-komunijny" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opis</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Krótki opis szablonu..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL zdjęcia</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Sekcja: Ustawienia ── */}
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ustawienia
          </p>

          <div className="flex items-end gap-4">
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Kolejność wyświetlania</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pb-1">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Aktywny</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Zapisz zmiany' : 'Utwórz szablon'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
