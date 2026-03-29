// apps/frontend/app/dashboard/catering/templates/[id]/packages/components/PackageForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useCreateCateringPackage, useUpdateCateringPackage } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DialogFooter } from '@/components/ui/dialog';
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

const BASE_PRICE_LABEL: Record<CateringPriceType, string> = {
  PER_PERSON: 'Cena za osobę (zł)',
  FLAT: 'Cena całkowita (zł)',
  TIERED: 'Cena domyślna / fallback (zł)',
};

interface TierRow {
  upTo: number | null; // null = ∞ (ostatni próg)
  price: number;
}

interface FormData {
  name: string;
  shortDescription: string;
  description: string;
  priceType: CateringPriceType;
  basePrice: number;
  minGuests: number | '';
  maxGuests: number | '';
  badgeText: string;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
}

interface Props {
  templateId: string;
  pkg?: CateringPackage | null;
  onClose: () => void;
}

export function PackageForm({ templateId, pkg, onClose }: Props) {
  const isEdit = !!pkg;
  const createMutation = useCreateCateringPackage(templateId);
  const updateMutation = useUpdateCateringPackage(templateId);

  const [tiers, setTiers] = useState<TierRow[]>([{ upTo: null, price: 0 }]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      name: '', shortDescription: '', description: '',
      priceType: 'PER_PERSON', basePrice: 0,
      minGuests: '', maxGuests: '', badgeText: '',
      isPopular: false, isActive: true, displayOrder: 0,
    },
  });

  const priceType = watch('priceType');
  const isPopular = watch('isPopular');
  const isActive = watch('isActive');

  useEffect(() => {
    if (pkg) {
      reset({
        name: pkg.name,
        shortDescription: pkg.shortDescription ?? '',
        description: pkg.description ?? '',
        priceType: pkg.priceType,
        basePrice: pkg.basePrice,
        minGuests: pkg.minGuests ?? '',
        maxGuests: pkg.maxGuests ?? '',
        badgeText: pkg.badgeText ?? '',
        isPopular: pkg.isPopular,
        isActive: pkg.isActive,
        displayOrder: pkg.displayOrder,
      });
      if (pkg.tieredPricing && typeof pkg.tieredPricing === 'object') {
        const tp = pkg.tieredPricing as { tiers?: TierRow[] };
        if (tp.tiers && tp.tiers.length > 0) {
          setTiers(tp.tiers);
          return;
        }
      }
      setTiers([{ upTo: null, price: 0 }]);
    } else {
      reset({
        name: '', shortDescription: '', description: '',
        priceType: 'PER_PERSON', basePrice: 0,
        minGuests: '', maxGuests: '', badgeText: '',
        isPopular: false, isActive: true, displayOrder: 0,
      });
      setTiers([{ upTo: null, price: 0 }]);
    }
  }, [pkg, reset]);

  const addTier = () =>
    setTiers((prev) => [
      ...prev.slice(0, -1),
      { upTo: 0, price: 0 },
      prev[prev.length - 1],
    ]);

  const removeTier = (i: number) =>
    setTiers((prev) => prev.filter((_, idx) => idx !== i));

  const updateTier = (i: number, field: keyof TierRow, value: number | null) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name,
      shortDescription: data.shortDescription || undefined,
      description: data.description || undefined,
      priceType: data.priceType,
      basePrice: Number(data.basePrice),
      tieredPricing: data.priceType === 'TIERED' ? { tiers } : undefined,
      minGuests: data.minGuests !== '' ? Number(data.minGuests) : undefined,
      maxGuests: data.maxGuests !== '' ? Number(data.maxGuests) : undefined,
      badgeText: data.badgeText || undefined,
      isPopular: data.isPopular,
      isActive: data.isActive,
      displayOrder: Number(data.displayOrder),
    };
    if (isEdit && pkg) {
      updateMutation.mutate({ packageId: pkg.id, data: payload }, { onSuccess: onClose });
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
          Nazwa pakietu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register('name', { required: 'Nazwa jest wymagana' })}
          placeholder="np. Standard, Premium, Deluxe"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Krótki opis */}
      <div className="space-y-2">
        <Label htmlFor="shortDescription">Krótki opis</Label>
        <Input
          id="shortDescription"
          {...register('shortDescription')}
          placeholder="np. Idealny na 50–100 osób"
        />
        <p className="text-xs text-muted-foreground">Widoczny na karcie pakietu</p>
      </div>

      {/* Pełny opis */}
      <div className="space-y-2">
        <Label htmlFor="description">Pełny opis</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Szczegółowy opis pakietu..."
          rows={3}
        />
      </div>

      {/* Typ ceny */}
      <div className="space-y-2">
        <Label>
          Typ ceny <span className="text-red-500">*</span>
        </Label>
        <Select
          value={priceType}
          onValueChange={(v) => setValue('priceType', v as CateringPriceType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz typ ceny..." />
          </SelectTrigger>
          <SelectContent>
            {priceTypes.map((k) => (
              <SelectItem key={k} value={k}>
                {CATERING_PRICE_TYPE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cena bazowa */}
      <div className="space-y-2">
        <Label htmlFor="basePrice">
          {BASE_PRICE_LABEL[priceType]} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="basePrice"
          type="number"
          step="0.01"
          min="0"
          {...register('basePrice', { required: 'Cena jest wymagana' })}
        />
        {priceType === 'TIERED' && (
          <p className="text-xs text-muted-foreground">
            Używana gdy żaden próg nie pasuje do liczby gości
          </p>
        )}
        {errors.basePrice && (
          <p className="text-sm text-red-500">{errors.basePrice.message}</p>
        )}
      </div>

      {/* TIERED PRICING BUILDER */}
      {priceType === 'TIERED' && (
        <div className="space-y-3 rounded-lg border border-dashed border-orange-300 dark:border-orange-700 p-4 bg-orange-50/50 dark:bg-orange-900/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Progi cenowe
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Dodaj próg
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Próg z ∞ obowiązuje dla wszystkich gości powyżej ostatniego limitu.
          </p>

          <div className="space-y-2">
            {/* nagłówek kolumn */}
            <div className="grid grid-cols-[1fr_1fr_2rem] gap-2 px-1">
              <p className="text-xs font-medium text-muted-foreground">Do ilu osób</p>
              <p className="text-xs font-medium text-muted-foreground">Cena (zł / os.)</p>
              <span />
            </div>

            {tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_2rem] gap-2 items-center">
                {tier.upTo === null ? (
                  <Input
                    value="∞ (pozostałe)"
                    disabled
                    className="bg-muted text-center font-mono text-sm"
                  />
                ) : (
                  <Input
                    type="number"
                    min={1}
                    value={tier.upTo ?? ''}
                    onChange={(e) =>
                      updateTier(i, 'upTo', e.target.value ? Number(e.target.value) : 0)
                    }
                    placeholder="np. 30"
                  />
                )}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tier.price}
                  onChange={(e) => updateTier(i, 'price', Number(e.target.value))}
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => removeTier(i)}
                  disabled={tiers.length === 1 || tier.upTo === null}
                  title={
                    tier.upTo === null
                      ? 'Ostatni próg jest wymagany'
                      : 'Usuń próg'
                  }
                  aria-label="Usuń próg cenowy"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liczba gości */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minGuests">Min. gości</Label>
          <Input
            id="minGuests"
            type="number"
            min={1}
            placeholder="–"
            {...register('minGuests')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Maks. gości</Label>
          <Input
            id="maxGuests"
            type="number"
            min={1}
            placeholder="–"
            {...register('maxGuests')}
          />
        </div>
      </div>

      {/* Badge + Kolejność */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="badgeText">Tekst badge&apos;a</Label>
          <Input
            id="badgeText"
            {...register('badgeText')}
            placeholder="np. Bestseller"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayOrder">Kolejność wyświetlania</Label>
          <Input
            id="displayOrder"
            type="number"
            min={0}
            {...register('displayOrder', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Popularny + Aktywny */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isPopular"
            checked={isPopular}
            onCheckedChange={(c) => setValue('isPopular', c)}
          />
          <Label htmlFor="isPopular" className="cursor-pointer">Popularny</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={(c) => setValue('isActive', c)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">Aktywny</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Zapisz zmiany' : 'Utwórz pakiet'}
        </Button>
      </DialogFooter>

    </form>
  );
}
