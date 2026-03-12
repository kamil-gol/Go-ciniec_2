// apps/frontend/app/dashboard/catering/templates/[id]/packages/components/SectionForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateCateringSection, useUpdateCateringSection } from '@/hooks/use-catering';
import { useDishCategories } from '@/hooks/use-dishes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CateringPackageSection } from '@/types/catering.types';

// Dozwolone wartości ćwiartkowe: 0.25 – 3.0
const QUARTER_VALUES = [
  0.25, 0.5, 0.75,
  1, 1.25, 1.5, 1.75,
  2, 2.25, 2.5, 2.75,
  3,
];
const QUARTER_OPTIONS = QUARTER_VALUES.map((v) => ({
  value: String(v),
  label: String(v).replace('.', ','),
}));
// Opcja "bez limitu" tylko dla maxSelect
const MAX_OPTIONS = [{ value: '0', label: '0 (bez limitu)' }, ...QUARTER_OPTIONS];

const schema = z.object({
  categoryId: z.string().min(1, 'Kategoria jest wymagana'),
  name: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  minSelect: z.coerce.number().min(0.25).max(3).multipleOf(0.25),
  maxSelect: z.coerce.number().min(0).max(3).multipleOf(0.25),
  isRequired: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  packageId: string;
  templateId: string;
  section?: CateringPackageSection | null;
  onClose: () => void;
}

export function SectionForm({ packageId, templateId, section, onClose }: Props) {
  const isEdit = !!section;
  const createSection = useCreateCateringSection(packageId, templateId);
  const updateSection = useUpdateCateringSection(templateId);
  const { data: categories, isLoading: categoriesLoading } = useDishCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: '', name: '', description: '',
      minSelect: 1, maxSelect: 1, isRequired: true, displayOrder: 0,
    },
  });

  useEffect(() => {
    if (section) {
      form.reset({
        categoryId: section.categoryId,
        name: section.name ?? '',
        description: section.description ?? '',
        minSelect: Number(section.minSelect),
        // null/undefined z backendu traktujemy jako 0 (bez limitu)
        maxSelect: section.maxSelect != null ? Number(section.maxSelect) : 0,
        isRequired: section.isRequired,
        displayOrder: section.displayOrder,
      });
    }
  }, [section, categories, form]);

  const onSubmit = (values: FormValues) => {
    // maxSelect=0 oznacza brak limitu — wysyłamy null, żeby backend wyczyścił pole
    const maxSelectValue = values.maxSelect !== 0 ? values.maxSelect : null;

    if (isEdit && section) {
      updateSection.mutate(
        {
          sectionId: section.id,
          data: {
            name: values.name || null,
            description: values.description || null,
            minSelect: values.minSelect,
            maxSelect: maxSelectValue,
            isRequired: values.isRequired,
            displayOrder: values.displayOrder,
          },
        },
        { onSuccess: onClose },
      );
    } else {
      createSection.mutate(
        {
          categoryId: values.categoryId,
          name: values.name || undefined,
          description: values.description || undefined,
          minSelect: values.minSelect,
          maxSelect: maxSelectValue ?? undefined,
          isRequired: values.isRequired,
          displayOrder: values.displayOrder,
        },
        { onSuccess: onClose },
      );
    }
  };

  const isPending = createSection.isPending || updateSection.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategoria dań *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={categoriesLoading || isEdit}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={categoriesLoading ? 'Ładowanie...' : 'Wybierz kategorię'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Kategoria nie może być zmieniona po utworzeniu sekcji.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Własna nazwa sekcji</FormLabel>
              <FormControl>
                <Input placeholder="Zostaw puste — użyje nazwy kategorii" {...field} />
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
              <FormLabel>Opis sekcji</FormLabel>
              <FormControl>
                <Textarea placeholder="Opcjonalny opis dla klienta..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Min/Max — Selecty z wartościami ćwiartkowymi 0,25–3,00 */}
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="minSelect"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min. wybór</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {QUARTER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxSelect"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maks. wybór</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value ?? 0)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MAX_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">0 = bez limitu</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kolejność</FormLabel>
                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isRequired"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Sekcja wymagana</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Zapisz zmiany' : 'Dodaj sekcję'}
          </Button>
        </div>

      </form>
    </Form>
  );
}
