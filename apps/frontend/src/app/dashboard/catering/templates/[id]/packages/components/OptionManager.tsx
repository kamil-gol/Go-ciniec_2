// apps/frontend/src/app/dashboard/catering/templates/[id]/packages/components/OptionManager.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Star, Loader2 } from 'lucide-react';
import {
  useAddSectionOption,
  useUpdateSectionOption,
  useRemoveSectionOption,
} from '@/hooks/use-catering';
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

interface Props {
  section: CateringPackageSection;
  templateId: string;
}

export function OptionManager({ section, templateId }: Props) {
  const [selectedDishId, setSelectedDishId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: dishes, isLoading: dishesLoading } = useDishesByCategory(
    section.categoryId,
  );
  const addOption = useAddSectionOption(section.id, templateId);
  const updateOption = useUpdateSectionOption(templateId);
  const removeOption = useRemoveSectionOption(templateId);

  const options = [...(section.options ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const alreadyAddedDishIds = new Set(options.map((o) => o.dishId));

  const availableDishes = (dishes ?? []).filter(
    (d) => (d as any).isActive && !alreadyAddedDishIds.has(d.id),
  );

  const handleAdd = async () => {
    if (!selectedDishId) return;
    setAdding(true);
    try {
      await addOption.mutateAsync({
        dishId: selectedDishId,
        customPrice: customPrice !== '' ? parseFloat(customPrice) : undefined,
        isDefault: false,
      });
      setSelectedDishId('');
      setCustomPrice('');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleDefault = async (
    optionId: string,
    currentValue: boolean,
  ) => {
    await updateOption.mutateAsync({
      optionId,
      data: { isDefault: !currentValue },
    });
  };

  const handleRemove = async (optionId: string) => {
    await removeOption.mutateAsync(optionId);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Dania w sekcji
      </p>

      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-1 px-0.5">
          Brak dań — dodaj pierwsze
        </p>
      ) : (
        <div className="space-y-1.5">
          {options.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between rounded border bg-background px-2.5 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span>{(opt as any).dish?.name ?? '–'}</span>
                {opt.isDefault && (
                  <Badge variant="secondary" className="text-xs gap-0.5">
                    <Star className="h-2.5 w-2.5" />
                    Domyślne
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {opt.customPrice != null
                    ? `${opt.customPrice.toFixed(2)} zł`
                    : (opt as any).dish?.price != null
                      ? `${(opt as any).dish.price.toFixed(2)} zł`
                      : '–'}
                </span>
                <button
                  title={
                    opt.isDefault
                      ? 'Usuń jako domyślne'
                      : 'Ustaw jako domyślne'
                  }
                  className="text-amber-500 hover:text-amber-600 transition-colors"
                  onClick={() => handleToggleDefault(opt.id, opt.isDefault)}
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      opt.isDefault ? 'fill-current' : ''
                    }`}
                  />
                </button>
                <button
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  onClick={() => handleRemove(opt.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  ? 'Ładowanie...'
                  : availableDishes.length === 0
                    ? 'Wszystkie dania dodane'
                    : 'Dodaj danie...'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableDishes.map((dish) => (
              <SelectItem key={dish.id} value={dish.id}>
                <span>{dish.name}</span>
                {(dish as any).price != null && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({(dish as any).price.toFixed(2)} zł)
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
          className="h-8 w-28 text-xs"
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
        />

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          disabled={!selectedDishId || adding}
          onClick={handleAdd}
        >
          {adding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
