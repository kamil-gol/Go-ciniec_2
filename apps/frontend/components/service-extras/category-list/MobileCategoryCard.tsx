'use client';

import { formatCurrency } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICE_LABELS, priceSuffix, type CategoryRowProps } from './category-list-config';
import type { KeyboardEvent } from 'react';

export function MobileCategoryCard({
  category,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onCreateItem,
  onEditItem,
  onDeleteCategory,
  onDeleteItem,
}: CategoryRowProps) {
  const itemCount = category._count?.items ?? category.items?.length ?? 0;

  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand(category.id);
    }
  };

  return (
    <div className={`${!category.isActive ? 'opacity-60' : ''}`}>
      {/* Category header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${category.name}, ${itemCount} pozycji${isExpanded ? ' (rozwinięte)' : ' (zwinięte)'}`}
        className="p-4 flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        onClick={() => onToggleExpand(category.id)}
        onKeyDown={handleHeaderKeyDown}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || '#94a3b8' }}
          />
          <span className="text-lg flex-shrink-0">{category.icon || '📁'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate">{category.name}</p>
              {category.isExclusive && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  Wył.
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">{itemCount} pozycji</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCreateItem(category.id)} aria-label="Dodaj pozycję">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditCategory(category)} aria-label="Edytuj kategorię">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteCategory(category)} aria-label="Usuń kategorię">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expanded items */}
      {isExpanded && category.items && category.items.map((item) => (
        <div key={item.id} className="px-4 py-2.5 pl-14 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span>{item.icon || '📦'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-neutral-500">
                {PRICE_LABELS[item.priceType]}
                {item.priceType !== 'FREE' && ` · ${formatCurrency(item.basePrice)}${priceSuffix(item.priceType)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)} aria-label="Edytuj pozycję">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteItem(item)} aria-label="Usuń pozycję">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
