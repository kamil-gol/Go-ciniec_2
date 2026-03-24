'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Package,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { PRICE_LABELS, PRICE_TYPE_STYLES, priceSuffix, type CategoryRowProps } from './category-list-config';

export function SortableCategoryRows({
  category,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onCreateItem,
  onEditItem,
  onDeleteCategory,
  onDeleteItem,
}: CategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemCount = category._count?.items ?? category.items?.length ?? 0;

  return (
    <>
      {/* Category header row */}
      <TableRow
        ref={setNodeRef}
        style={style}
        className={`group hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors cursor-pointer ${
          isDragging ? 'bg-purple-50 dark:bg-purple-900/20 shadow-lg z-50 ring-2 ring-purple-400/30' : ''
        } ${!category.isActive ? 'opacity-60' : ''}`}
        onClick={() => onToggleExpand(category.id)}
      >
        {/* Drag handle */}
        <TableCell className="w-10 pr-0">
          <button
            className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-neutral-400" />
          </button>
        </TableCell>

        {/* Category name */}
        <TableCell>
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            )}
            <span
              className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
              style={{ backgroundColor: category.color || '#94a3b8' }}
            />
            <span className="text-lg flex-shrink-0">{category.icon || '📁'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">{category.name}</p>
                {category.isExclusive && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    Wyłączna
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-neutral-500 truncate max-w-[250px]">{category.description}</p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Item count */}
        <TableCell className="text-center">
          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {itemCount}
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          {category.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Aktywna
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Nieaktywna
            </span>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onCreateItem(category.id)}>
              <Plus className="mr-1 h-3.5 w-3.5" />Dodaj
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditCategory(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteCategory(category)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded items */}
      {isExpanded && category.items && category.items.length > 0 && category.items.map((item) => (
        <TableRow
          key={item.id}
          className="group hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors bg-neutral-50/30 dark:bg-neutral-800/20"
        >
          <TableCell></TableCell>
          <TableCell>
            <div className="flex items-center gap-3 pl-8">
              <span className="text-base">{item.icon || '📦'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.requiresNote && (
                    <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300">
                      Notatka
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium border mr-1 ${PRICE_TYPE_STYLES[item.priceType] || ''}`}>
                    {PRICE_LABELS[item.priceType]}
                  </span>
                  {item.priceType !== 'FREE' && (
                    <span className="font-medium tabular-nums">
                      {Number(item.basePrice).toLocaleString('pl-PL')} zł{priceSuffix(item.priceType)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell></TableCell>
          <TableCell>
            {item.isActive ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                Nieaktywna
              </span>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteItem(item)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}

      {/* Empty state for expanded category */}
      {isExpanded && (!category.items || category.items.length === 0) && (
        <TableRow className="bg-neutral-50/30 dark:bg-neutral-800/20">
          <TableCell></TableCell>
          <TableCell colSpan={4}>
            <div className="flex items-center gap-2 py-3 pl-8 text-sm text-neutral-400">
              <Package className="h-4 w-4" />
              Brak pozycji
              <Button variant="link" size="sm" className="h-auto p-0 text-purple-600" onClick={() => onCreateItem(category.id)}>
                — dodaj pierwszą
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
