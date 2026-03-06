'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  basePrice: number;
}

interface PackageCardsProps {
  packages: Package[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PackageCards({ packages, selectedId, onSelect }: PackageCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {packages.map((pkg) => {
        const isSelected = pkg.id === selectedId;
        return (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect(pkg.id)}
            className={cn(
              'relative flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-colors',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40',
            )}
          >
            {isSelected && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-2.5 w-2.5" />
              </span>
            )}
            <span className="text-sm font-medium leading-tight pr-5">{pkg.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(pkg.basePrice)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
