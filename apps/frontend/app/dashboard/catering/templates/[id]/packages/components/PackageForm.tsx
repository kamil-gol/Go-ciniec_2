'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  useCreateCateringPackage,
  useUpdateCateringPackage,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATERING_PRICE_TYPE_LABELS } from '@/types/catering.types';
import type { CateringPackage, CateringPriceType } from '@/types/catering.types';

const priceTypes = ['PER_PERSON', 'FLAT', 'TIERED'] as const;

const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100),
  description: z.string().max(500).optional(),
  shortDescription: z.string().max(200).optional(),
  priceType: z.enum(priceTypes),
  basePrice: z.coerce.number().min(0, 'Cena musi być >= 0'),
  minGuests: z.coerce.number().int().min(1).optional().or(z.literal('')),
  maxGuests: z.coerce.number().int().min(1).optional().or(z.literal('')),
  badgeText: z.string().max(30).optional(),
  isPopular: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  templateId: string;
  pkg?: CateringPackage | null;
  onClose: () => void;
}

export function PackageForm({ templateId, pkg, onClose }: Props) {
  const isEdit = !!pkg;
  const createMutation = useCreateCateringPackage(templateId);
  const updateMutation = useUpdateCateringPackage(templateId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      priceType: 'PER_PERSON',
      basePrice: 0,
      minGuests: '',
      maxGuests: '',
      badgeText: '',
      isPopular: false,
      isActive: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (pkg) {
      form.reset({
        name: pkg.name,
        description: pkg.description ?? '',
        shortDescription: pkg.shortDescription ?? '',
        priceType: pkg.priceType,
        basePrice: pkg.basePrice,
        minGuests: pkg.minGuests ?? '',
        maxGuests: pkg.maxGuests ?? '',
        badgeText: pkg.badgeText ?? '',
        isPopular: pkg.isPopular,
        isActive: pkg.isActive,
        displayOrder: pkg.displayOrder,
      });
    }
  }, [pkg, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      shortDescription: values.shortDescription || undefined,
      priceType: values.priceType as CateringPriceType,
      basePrice: values.basePrice,
      minGuests: values.minGuests !== '' ? Number(values.minGuests) : undefined,
      maxGuests: values.maxGuests !== '' ? Number(values.maxGuests) : undefined,
      badgeText: values.badgeText || undefined,
      isPopular: values.isPopular,
      isActive: values.isActive,
      displayOrder: values.displayOrder,
    };

    if (isEdit && pkg) {
      await updateMutation.mutateAsync({ packageId: pkg.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa pakietu *</FormLabel>
              <FormControl>
                <Input placeholder="np. Standard, Premium, Deluxe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Krótki opis (na karcie pakietu)</FormLabel>
              <FormControl>
                <Input placeholder="np. Idealny na 50–100 osób" {...field} />
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
              <FormLabel>Pełny opis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Szczegółowy opis pakietu..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typ ceny *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priceTypes.map((key) => (
                      <SelectItem key={key} value={key}>
                        {CATERING_PRICE_TYPE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cena bazowa (zł) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minGuests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min. gości</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="–" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxGuests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maks. gości</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="–" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="badgeText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tekst badge&apos;a</FormLabel>
                <FormControl>
                  <Input placeholder="np. Bestseller" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="isPopular"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Popularny</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Aktywny</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Zapisz zmiany' : 'Utwórz pakiet'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
