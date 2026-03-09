// apps/frontend/app/dashboard/catering/templates/[id]/packages/components/OptionManager.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Star, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useAddSectionOption, useUpdateSectionOption, useRemoveSectionOption } from '@/hooks/use-catering';
import { useDishesByCategory } from '@/hooks/use-dishes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CateringPackageSection } from '@/types/catering.types';

interface Props { section: CateringPackageSection; templateId: string; }

export function OptionManager({ section, templateId }: Props) {
  const [selectedDishId, setSelectedDishId] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const { data: dishes, isLoading: dishesLoading } = useDishesByCategory(section.categoryId);
  const addOption = useAddSectionOption(section.id, templateId);
  const updateOption = useUpdateSectionOption(templateId);
  const removeOption = useRemoveSectionOption(templateId);

  const options = [...(section.options ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  const alreadyAddedDishIds = new Set(options.map((o) => o.dishId));
  const availableDishes = (dishes ?? []).filter(
    (d) => (d as any).isActive && !alreadyAddedDishIds.has(d.id),
  );

  const handleAdd = () => {
    if (!selectedDishId) return;
    addOption.mutate(
      {
        dishId: selectedDishId,
        customPrice: customPrice !== '' ? parseFloat(customPrice) : undefined,
        isDefault: false,
      },
      { onSuccess: () => { setSelectedDishId(''); setCustomPrice(''); } },
    );
  };

  const handleToggleDefault = (optionId: string, current: boolean) =>
    updateOption.mutate({ optionId, data: { isDefault: !current } });

  const handleRemove = (optionId: string) => removeOption.mutate(optionId);

  const formatPrice = (val: unknown) =>
    val != null ? `${Number(val).toFixed(2)} zł` : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dania w sekcji
        </span>
        {options.length > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold text-muted-foreground">
            {options.length}
          </span>
        )}
      </div>

      {/* Dish list */}
      {options.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed bg-muted/30 px-3 py-3">
          <UtensilsCrossed className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">
            Brak dań — dodaj dania z listy poniżej
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {options.map((opt) => {
            const dish = (opt as any).dish;
            const priceDisplay =
              formatPrice(opt.customPrice) ??
              formatPrice(dish?.price) ??
              null;

            return (
              <div
                key={opt.id}
                className="group flex items-center justify-between rounded-lg border bg-background px-3 py-2 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Star toggle */}
                  <button
                    title={opt.isDefault ? 'Usuń jako domyślne' : 'Ustaw jako domyślne'}
                    className="shrink-0 text-muted-foreground/40 hover:text-amber-400 transition-colors"
                    onClick={() => handleToggleDefault(opt.id, opt.isDefault)}
                  >
                    <Star
                      className={`h-3.5 w-3.5 transition-colors ${
                        opt.isDefault
                          ? 'fill-amber-400 text-amber-400'
                          : 'group-hover:text-amber-300'
                      }`}
                    />
                  </button>

                  {/* Name */}
                  <span className="text-sm font-medium truncate">
                    {dish?.name ?? '–'}
                  </span>

                  {opt.isDefault && (
                    <Badge className="shrink-0 gap-0.5 border-0 bg-amber-100 py-0 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Domyślne
                    </Badge>
                  )}
                  {opt.customPrice != null && (
                    <Badge variant="outline" className="shrink-0 py-0 text-[10px] text-blue-600 border-blue-200 dark:text-blue-400">
                      Własna cena
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {priceDisplay && (
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {priceDisplay}
                    </span>
                  )}
                  <button
                    className="text-destructive/40 hover:text-destructive transition-colors"
                    onClick={() => handleRemove(opt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add dish row */}
      <div className="flex items-center gap-2 pt-1">
        <Select
          value={selectedDishId}
          onValueChange={setSelectedDishId}
          disabled={dishesLoading || availableDishes.length === 0}
        >
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue
              placeholder={
                dishesLoading
                  ? 'Ładowanie dań...'
                  : availableDishes.length === 0
                  ? 'Wszystkie dania zostały dodane'
                  : 'Wybierz danie do dodania...'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableDishes.map((dish) => (
              <SelectItem key={dish.id} value={dish.id}>
                <span>{dish.name}</span>
                {(dish as any).price != null && (
                  <span className="ml-1.5 text-muted-foreground text-xs">
                    {Number((dish as any).price).toFixed(2)} zł
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Cena własna"
          className="h-8 w-32 text-xs"
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
        />

        <Button
          size="sm"
          className="h-8 px-3 gap-1.5 shrink-0"
          disabled={!selectedDishId || addOption.isPending}
          onClick={handleAdd}
        >
          {addOption.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Plus className="h-3.5 w-3.5" />}
          Dodaj
        </Button>
      </div>
    </div>
  );
}
